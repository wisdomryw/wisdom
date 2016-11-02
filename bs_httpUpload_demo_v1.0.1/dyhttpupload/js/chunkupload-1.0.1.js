/**
 * http断点分片上传的插件
 * @version 1.0.1
 * @author renyuwei
 * @time   2016.10.27
 */
;(function ($, window, document, undefined) {
    var jsscripts = document.scripts;
    var scriptsrc = jsscripts[jsscripts.length-1].src; //获取当前js的路径
    //文件扩展名字符串
    var fileExtStr = "&ac3&ai&aiff&ani&asf&au&avi&bat&bin&bmp&bup&cab&cal&cat&cur&dat&dcr&der&dic&dll&doc&docx&dvd&dwg&dwt&fon&gif&hlp&hst&html&ico&ifo&inf&ini&java&jif&jpg&log&m4a&mmf&mmm&mov&mp2&mp2v&mp3&mp4&mpeg&msp&pdf&png&ppt&pptx&psd&ra&rar&reg&rtf&theme&Thumbs&tiff&tlb&ttf&txt&vob&wav&wma&wmv&wpl&wri&xls&xlsx&xml&xsl&zip&exe&";
    var defaults = {//默认参数
        "uploadAddress": "",
        "retryMigrateAddress": "",
        "chunkSize": 5 * 1024 * 1024,
        "isRename":false,
        "fileSavePath":""
    };
    /**
     * 上传组件对象
     * @param $ele
     * @param options
     */
    var httpUploadPlugin = function ($ele, options) {
        this.pluginId = "";
        this.pluginBasePath = "";
        this.$ele = $ele;
        this.options = options;
        this.taskQueue = [];  //公用的任务队列对象
        this.taskIndex = -1;
        this.currentUploadIndex = 0;
        this.init();
    };
    /**
     * 上传组件的扩展方法定义
     */
    httpUploadPlugin.prototype = {
        constructor: httpUploadPlugin,
        /*初始化页面和绑定事件*/
        init: function () {
            this.getPluginBasePath();
            this.renderHtml();
            this.bindEvent();

        },
        /*自动生成id*/
        guidGenerator: function () {
            var S4 = function () {
                return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
            };
            return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
        },
        /*获取插件的base地址*/
        getPluginBasePath:function() {
            var jspath = scriptsrc.substring(0,scriptsrc.lastIndexOf("/"));
            this.pluginBasePath = jspath.substring(0,jspath.lastIndexOf("/") + 1);
            return this.pluginBasePath;
        },
        /*切分字符串，支持中英文*/
        splitStr: function (str, n) {
            var r = /[^\x00-\xff]/g;
            if (str.replace(r, "mm").length <= n) {
                return str;
            }
            var m = Math.floor(n / 2);
            for (var i = m; i < str.length; i++) {
                if (str.substr(0, i).replace(r, "mm").length >= n) {
                    return str.substr(0, i) + "...";
                }
            }
            return str;
        },
        bytesToSize: function (bytes) {
            if (bytes === 0) return '0 B';
            var k = 1024;
            var sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
            var i = Math.floor(Math.log(bytes) / Math.log(k));
            return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
        },
        /*渲染初始页面*/
        renderHtml: function () {
            this.pluginId = this.guidGenerator(); //生成插件Id，标识插件的唯一性
            var options = this.options;
            var html = '';
            html = '<div style="width:100%; border:1px #ddd solid; font-size:12px; position:relative" id="httpupload-plugin-'+this.pluginId+'">' +
                '<div style="width:100%; border-bottom:1px #ddd solid; height:28px; line-height:28px;">' +
                '<input id="httpupload-plugin-file-button-'+this.pluginId+'" type="button" style="border:1px #ddd solid;background:#fff; margin:4px;" value="上传"/>' +
                '<input id="httpupload-plugin-file-input-'+this.pluginId+'" type="file" style="display:none;" />' +
                '</div><div id="httpupload-plugin-container-'+this.pluginId+'"></div><div style="clear:both"></div></div>';
            this.$ele.html(html);
        },
        //上传完成回调函数
        complete: function (xhr,fileSize,fileSessionIdPara,taskIndex,that) {
            if (xhr.status == 200) {
                $("#httpupload-plugin-uploadtip-" + fileSessionIdPara+"-"+taskIndex).html("上传成功");
                var returnJson = JSON.parse(xhr.responseText);
                that.taskQueue[taskIndex].migrateFileName = returnJson.migrateFileName;
                that.taskQueue[taskIndex].fileName = returnJson.originFileName;
                that.taskQueue[taskIndex].stop = true;
                that.uploadNext();
            } else {
                $("#httpupload-plugin-uploadtip-" + fileSessionIdPara+"-"+taskIndex).html("上传失败");
                var idLen = $("#httpupload-plugin-controlicon-" + fileSessionIdPara+"-"+taskIndex).length;
                if (idLen == 0) {
                    var icon = '<img id="'+"httpupload-plugin-controlicon-"+fileSessionIdPara+"-"+taskIndex+'" src="'+that.pluginBasePath+'images/start.png" style="float: right;" />';
                    $("#httpupload-plugin-controlinfo-" + fileSessionIdPara+"-"+taskIndex).append(icon);
                }
                $("#httpupload-plugin-controlicon-" + fileSessionIdPara+"-"+taskIndex).off("click");
                $("#httpupload-plugin-controlicon-" + fileSessionIdPara+"-"+taskIndex).on("click",function(){
                    $(this).remove();
                    if (xhr.status == 601) {
                        //重试迁移
                        that.retryMigrate(taskIndex,that);
                    } else {
                        //重新上传
                        that.doUplaod(that.taskQueue[taskIndex].uploadFile, that.taskQueue[taskIndex].fileSessionId, that.progress, that.complete);//重启该任务上传
                    }

                });
            }
        },
        //迁移失败，重试迁移任务
        retryMigrate:function(taskIndex,that) {
            var fileSessionId = that.taskQueue[taskIndex].fileSessionId;
            var migrateAddress = that.options.retryMigrateAddress;
            var array = [];
            array.push(fileSessionId);
            var obj = {"fileSessionIdArray":array};
            var objstr = JSON.stringify(obj);
            $.ajax({
                    type: 'POST',
                    //请求类型 post
                    dataType: "json",
                    url: migrateAddress,
                    //请求地址
                    data: objstr,
                    //请求数据
                    success: function(data) {
                        var returnResult = data[0];
                        if (returnResult.success) {
                            $("#httpupload-plugin-uploadtip-" + fileSessionId+"-"+taskIndex).html("上传成功");
                        }
                     }
                } //请求成功时操作
            );
        },
        //上传进度回调函数
        progress: function (progressValue,fileSessionIdPara,taskIndex) {
            console.log("上传百分比： "+Math.floor(progressValue * 100) + "%");
            $("#httpupload-plugin-progressvalue-" + fileSessionIdPara+"-"+taskIndex).css("width", Math.floor(progressValue * 100) + "%");//进度条变化
        },

        /**
         * 为初始化页面绑定事件，添加
         * 上传进度回调函数，上传完成
         * 回调函数。
         */
        bindEvent: function () {
            var that = this;
            //为上传按钮绑定隐藏选择文件事件
            $("#httpupload-plugin-file-button-"+that.pluginId).on("click", function () {
                $("#httpupload-plugin-file-input-"+that.pluginId).click();
            });
            //文件选择完成后，触发上传功能，添加上传进度和成功上传回调事件
            $("#httpupload-plugin-file-input-"+this.pluginId).on("change", function () {
                var uploadFile = $('#httpupload-plugin-file-input-'+that.pluginId).get(0).files[0];

                $('#httpupload-plugin-file-input-'+that.pluginId).val("");//置文件输入框为空,下次可以选择同样文件上传
                var fileSessionId = that.guidGenerator();//生成fileSesionId
                that.addUpload(uploadFile, fileSessionId, that.progress, that.complete);
            });
        },
        /*如果有下个任务，且任务不为空,则触发执行任务*/
        uploadNext: function () {
            while (this.currentUploadIndex != this.taskQueue.length - 1) {
                this.currentUploadIndex = this.currentUploadIndex + 1;
                if (this.taskQueue[this.currentUploadIndex] != null) {
                    this.taskQueue[this.currentUploadIndex].stop = false;
                    this.doUplaod(this.taskQueue[this.currentUploadIndex].uploadFile, this.taskQueue[this.currentUploadIndex].fileSessionId, this.progress, this.complete);//添加上传功能
                    break;
                }
            }
        },
        /**
         * 添加上传任务
         */
        addUpload: function (uploadFile, fileSessionId, progress, complete) {
            this.taskIndex++;
            this.addUploadHtml(fileSessionId, uploadFile.name,this.taskIndex);         //渲染新添加的任务
            this.bindUploadHtmlEvent(fileSessionId,this.taskIndex);                  //为渲染的任务页面绑定事件
            var fileName = uploadFile.name;
            //添加任务队列
            this.taskQueue[this.taskIndex] = {
                "stop":true,                           //任务是否暂停
                "isDelete":false,                      //任务是否删除
                "finishProgress":0,                    //上传进度0-100，100表示完成
                "uploadFile":uploadFile,               //上传文件对象
                "offset":0,                            //上传偏移值
                "fileName":fileName,                   //源文件名
                "migrateFileName":"",                  //迁移后的文件名，上传完成后返回
                "fileSessionId":fileSessionId,         //上传的fileSessionId
                "responseStatus":""                    //上传完成后状态码
            };
            //判断任务队列中是否有正在上传任务
            if (!this.isTaskUploading()) {
                this.currentUploadIndex = this.taskIndex;
                this.taskQueue[this.currentUploadIndex].stop = false;
                this.doUplaod(uploadFile, fileSessionId, progress, complete);//添加上传功能
            }
        },
        //判断是否有任务正在上传中
        isTaskUploading: function () {
            for (var i= 0;i<this.taskQueue.length;i++ ) {
                if(this.taskQueue[i] != null) {
                    var taskStatus = this.taskQueue[i].stop;
                    if (!taskStatus) {
                        return true;
                    }
                }
            }
            return false;
        },
        //根据文件类型获取文件图标
        getIconNameByFileType:function(fileName) {
            if (fileName != null) {
                var extFileName = fileName.substring(fileName.lastIndexOf(".") + 1);
                extFileName = extFileName.toLowerCase();
                if (fileExtStr.indexOf("&"+extFileName+"&") != -1) {
                    return extFileName+".png";
                } else {
                    return "unk.png";
                }
            } else {
                return "unk.png";
            }
        },
        //渲染新添加的上传任务页面
        addUploadHtml: function (fileSessionId, fileName,taskIndex) {
            var html = '';
            var filetypeIconPath = this.pluginBasePath+"images/"+this.getIconNameByFileType(fileName);
            var fileName = this.splitStr(fileName,26);
            html = '<div style="width:260px; height:45px; background:#f5f5f5; border:1px #ddd solid; padding:10px; float:left; margin:5px;" id="httpupload-plugin-uploadcontrol-' + fileSessionId + '-'+taskIndex +'">' +
                '<div style="float:left"><img src="'+filetypeIconPath+'" width="40px" height="40px"/></div>' +
                '<div style="float:left; width:210px;"><div style="margin:5px; padding:0px; width:100%; height:15px;">' +
                '<div style="float:left;" id="httpupload-plugin-filename-' + fileSessionId + '-'+taskIndex +'">' + fileName + '</div>' +
                '<div style="float:right;"><a href="#" style=" text-decoration:none; color:#1597DD" id="httpupload-plugin-delete-' + fileSessionId + '-'+taskIndex +'">删除</a></div></div>' +
                '<div style="margin:5px; padding:0px;  width:100%; height:15px;" id="httpupload-plugin-controlinfo-' + fileSessionId + '-'+taskIndex +'">' +
                '<div style="width:70px; height:13px; border:1px #ddd solid; float:left" id="httpupload-plugin-progressbar-' + fileSessionId + '-'+taskIndex +'">' +
                '<div style="width:0%; height:13px; background:#390" id="httpupload-plugin-progressvalue-' + fileSessionId + '-'+taskIndex +'"></div></div>' +
                '</div></div></div>';
            $("#httpupload-plugin-container-"+this.pluginId).append(html);
        },

        //绑定添加的上传任务页面事件
        bindUploadHtmlEvent: function (fileSessionId,taskindex) {
            var that = this;
            //为删除上传任务按钮绑定事件
            $("#httpupload-plugin-delete-" + fileSessionId+"-"+taskindex).on("click", function () {
                $("#httpupload-plugin-uploadcontrol-" + fileSessionId+"-"+taskindex).remove();
                that.deleteUpload(taskindex);
            });
        },
        renderTipInfo:function(fileSessionId,uploadFile) {
            var idLen = $("#httpupload-plugin-uploadtip-" + fileSessionId+"-"+this.currentUploadIndex).length;
            if (idLen == 0) {
                var filesizevalue = this.bytesToSize(uploadFile.size);
                //添加是否完成标识
                var finishhtml = '<font style="color:#999;margin-left: 5px; margin-right:10px;">'+filesizevalue+'</font><font style="color:#390;" id="httpupload-plugin-uploadtip-'+fileSessionId+"-"+this.currentUploadIndex+'">上传中</font>';
                $("#httpupload-plugin-controlinfo-" + fileSessionId+"-"+this.currentUploadIndex).append(finishhtml);
            } else {
                $("#httpupload-plugin-uploadtip-" + fileSessionId+"-"+this.currentUploadIndex).html("上传中");
            }
        },
        //开始上传文件
        doUplaod: function (file, fileSessionId, progress, complete) {
            this.renderTipInfo(fileSessionId,file);
            var that = this;
            var url = that.options.uploadAddress;
            var aborting = false, TO = null;            //定义变量
            var xhr = null;
            var offset = this.taskQueue[this.currentUploadIndex].offset;
            //上传分片
            var uploadNextChunk = function () {
                var TO = null;
                var chunkStart = offset, chunkEnd = Math.min(offset + that.options.chunkSize, file.size) - 1;
                //通过Html5 File API获取分片的数据
                var currentBlob = (file.slice || file.mozSlice || file.webkitSlice).call(file, chunkStart, chunkEnd + 1);
                if (!(currentBlob && currentBlob.size > 0)) {
                    alert('Chunk size is 0'); // Sometimes the browser reports an empty chunk when it shouldn't, could retry here
                    return;
                }
                xhr = new XMLHttpRequest();
                if (chunkEnd === file.size - 1) {
                    // Add extra URL params on the last chunk
                    // Important: URL parameters passing this doesn't work currently, pass parameters via some custom "X-" header instead
                    var redirectParam = JSON.stringify({"fileSavePath":that.options.fileSavePath,"fileSessionId":fileSessionId,"isRename":that.options.isRename});
                    xhr.open('POST', url + (url.indexOf('?') > -1 ? '&' : '?') + "redirectParam="+redirectParam, true);
                    // xhr.open('POST', url, true);
                } else {
                    xhr.open('POST', url, true);
                }
                // 进度监控
                xhr.upload.addEventListener('progress', function (e) {
                    if (aborting) {
                        return;
                    }
                    that.taskQueue[that.currentUploadIndex].finishProgress = Math.floor(((chunkStart + e.loaded) / file.size)*100);
                    progress((chunkStart + e.loaded) / file.size,that.taskQueue[that.currentUploadIndex].fileSessionId,that.currentUploadIndex);
                });
                xhr.addEventListener('load', function () {
                    if (aborting) {
                        return;
                    }
                    //判断该任务是否取消，如果取消，则停止上传。
                    if (that.taskQueue[that.currentUploadIndex].stop) {
                        if (that.taskQueue[that.currentUploadIndex].isDelete) {
                            that.taskQueue[that.currentUploadIndex] = null; //如果是删除任务，则任务队列指针置为null
                            that.uploadNext();
                        }
                        return;
                }
                    if (xhr.readyState >= 4) {
                        that.taskQueue[that.currentUploadIndex].offset = chunkEnd + 1;
                        that.taskQueue[that.currentUploadIndex].responseStatus = xhr.status;
                         if (xhr.status === 201) {
                            //分片上传完成
                            offset = chunkEnd + 1;
                            //that.taskQueue[that.currentUploadIndex].finishProgress = Math.floor((offset/ file.size)*100);
                            //progress(offset / file.size,that.taskQueue[that.currentUploadIndex].fileSessionId,that.currentUploadIndex);   //回调进度函数
                            TO = setTimeout(uploadNextChunk, 1); // attempt to avoid xhrs sticking around longer than needed
                        } else {
                            //上传完成
                            complete(xhr,file.size,that.taskQueue[that.currentUploadIndex].fileSessionId,that.currentUploadIndex,that);
                        }
                    }
                });
                xhr.addEventListener('error', function () {
                    complete(xhr,file.size,that.taskQueue[that.currentUploadIndex].fileSessionId,that.currentUploadIndex,that);
                });
                //按照nginx_upload_module的http协议进行封装Post头部
                xhr.setRequestHeader('Content-Type', 'application/octet-stream');
                xhr.setRequestHeader('Content-Disposition', 'attachment; filename="' + encodeURIComponent(file.name) + '"');
                xhr.setRequestHeader('X-Content-Range', 'bytes ' + chunkStart + '-' + chunkEnd + '/' + file.size);
                xhr.setRequestHeader('X-Session-ID', fileSessionId);
                xhr.send(currentBlob);//发送请求，上传数据
            };
            TO = setTimeout(uploadNextChunk, 1);
            return {
                abort: function () {
                    aborting = true;
                    if (TO !== null) {
                        clearTimeout(TO);
                        TO = null;
                    }
                    try {
                        xhr.abort();
                    } catch (err) {
                    }
                },
                pause: function () {
                    this.abort();
                    aborting = false;
                },
                resume: function () {
                    uploadNextChunk();
                }
            };
        },
        //停止上传的任务，置指针为空
        deleteUpload: function (taskindex) {
            if (this.taskQueue[taskindex] != null && !this.taskQueue[taskindex].stop) {
                this.taskQueue[taskindex].isDelete = true;
                this.taskQueue[taskindex].stop = true;
            } else if(this.taskQueue[taskindex].stop) {
                this.taskQueue[taskindex] = null; //如果是删除任务，则任务队列指针置为null
            }
        },
        //是否完成所有上传任务
        isFinishedAllTasks: function() {
            var finishStatus = true;
            var returnJsonObj = {"finishStatus": true,"description": "全部上传完成！"};
            if (this.taskQueue.length > 0) {
                for (var i = 0; i < this.taskQueue.length; i++) {
                    var uploadTask = this.taskQueue[i];
                    if (uploadTask != null) {
                        if (uploadTask.responseStatus != 200) {
                            returnJsonObj.finishStatus = false;
                            returnJsonObj.description = "没有全部完成！";
                        }
                    }
                }
            } else {
                returnJsonObj.description = "无上传任务！";
            }
            return returnJsonObj;
        },
        //获取上传任务详情
        getUploadTasksDetail: function() {
            var returnJson = {};
            var taskArray = [];
            if (this.taskQueue.length > 0) {
                for (var i = 0; i < this.taskQueue.length; i++) {
                    var uploadTask = this.taskQueue[i];
                    if (uploadTask != null) {
                        var uploadTaskJson = {};
                        uploadTaskJson.fileSessionId = uploadTask.fileSessionId;
                        uploadTaskJson.fileName = uploadTask.fileName;
                        uploadTaskJson.migrateFileName = uploadTask.migrateFileName;
                        uploadTaskJson.offset = uploadTask.offset;
                        uploadTaskJson.stop = uploadTask.stop;
                        uploadTaskJson.finishProgress = uploadTask.finishProgress;
                        uploadTaskJson.responseStatus = uploadTask.responseStatus;
                        taskArray.push(uploadTaskJson);
                    }
                }
            } else {
                returnJson.description = "没有上传任务！";
            }
            returnJson.uploadTasksDetail = taskArray;
            returnJson.description = "返回成功！";

            return returnJson;
        }
    };
    //为jquery扩展方法，返回插件对象
    $.fn.httpUploadPlugin = function (options) {
        options = $.extend(defaults, options || {});
        return new httpUploadPlugin($(this), options);
    }

})(jQuery, window, document);
