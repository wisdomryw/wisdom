/***
 * 该js文件用于videoContainer div中元素事件和样式控制
 * 为播放器插件的主js文件
 * 
 * author: renyuwei
 * time  : 2016.4.7
 */

var fps = 25; // 默认帧频
var isFullScreen = false;
var timeDrag = false;
var showBotttom = 0;

var controlsfixed = 1; // 1 表示控制栏固定，0 表示控制栏不固定
var inoutpoint = 1; // 1 表示有入出点， 0 没有入出点
var fullScreenFixed = 0;

var inpointvalue = "00:00:00:00";
var outpointvalue = "00:00:00:00";
$(document)
		.ready(
				function() {
					/**测试按钮的事件----开始----使用插件时可注释掉**/
					$("#fixed").click(function() {
						controlsfixed = 1;
						initConfigInfo();
					});
					$("#nofixed").click(function() {
						controlsfixed = 0;
						initConfigInfo();
					});
					$("#haspoint").click(function() {
						inoutpoint = 1;
						initConfigInfo();
					});
					$("#nopoint").click(function() {
						inoutpoint = 0;
						initConfigInfo();
					});
					$("#refresh").click(function() {
						window.location.reload();
					});
					$(".control").delegate("#inoutpoint","click",function(){
						var inp = formatHMSFToNumber(inpointvalue);
						var outp = formatHMSFToNumber(outpointvalue);
						if (inp > outp) {
							alert("入点是：" + inpointvalue + "\n" + "出点是："+ outpointvalue + "\n" + "出点小于入点，请重新打点!");
						} else {
							alert("入点是：" + inpointvalue + "\n" + "出点是："+ outpointvalue);
						}
					});
					/**测试按钮的事件----结束**/
					
					//根据配置信息进行初始化设置
					var initConfigInfo = function() {
						if (controlsfixed == 1) {
							$('.control').css('bottom',showBotttom);
							$("#videoContainer").removeClass("videoContainer");
							$("#videoContainer")
									.addClass("fixedvideoContainer");
							$(".control").css("background", "#000");
							
						} else {
							//('.control').css('bottom',0);
							$("#videoContainer").removeClass(
									"fixedvideoContainer");
							$("#videoContainer").addClass("videoContainer");
							$(".control").css("background", "");
						}

						if (inoutpoint != 1) {
							$("#btmControlPoint").hide();
							showBotttom = -43;
						} else {
							$("#btmControlPoint").show();
							showBotttom = -73;
						}
					};
					initConfigInfo(); //调用初始化方法
					

					var direction = function() {
						if (window.orientation == 90
								|| window.orientation == -90) {
							// ipad、iphone竖屏；Andriod横屏
							if (inoutpoint == 1) {
								$("#btmControlPoint").empty();
								$("#landscapeinout").remove();
								var landscapeinouthtml = '<div id="landscapeinout">'
									    + '<div class="btnx3 btn save" id="inoutpoint"></div>'
										+ '<div class="palyerLeft palyerLeft btn" id="palyerRight"></div>'
										+ '<div class="palyerLeft palyerRight btn" id="palyerLeft"></div>'
										+ '<div class="palyerRightValue">' + outpointvalue + '</div>'
										+ '<div class="palyerLeftValue">' + inpointvalue + '</div>'
										+ '</div>';
								$(".btmControl").append(landscapeinouthtml);
								$(".palyerLeftValue").css("float", "right");
								$(".palyerRightValue").css("float", "right");
							}

							$(".progress").css("width", "85%");
							$(".time").css("width", "15%");
							if (isFullScreen == true) {
								videoFullScreen();
							}
							return false;
						} else if (window.orientation == 0
								|| window.orientation == 180) {
							// ipad、iphone横屏；Andriod竖屏
							if (inoutpoint == 1) {
								var portraithtml = '<div class="btnx3 btn save" id="inoutpoint"></div>'
									    + '<div class="palyerLeft palyerLeft btn" id="palyerRight"></div>'
										+ '<div class="palyerLeft palyerRight btn" id="palyerLeft"></div>'
										+ '<div class="palyerLeftValue">' + inpointvalue + '</div>'
										+ '<div class="palyerRightValue">' + outpointvalue + '</div>'
										+ '</div>';
								$("#btmControlPoint").empty();
								$("#btmControlPoint").append(portraithtml);
								$("#landscapeinout").remove();
								$(".palyerLeftValue").css("float", "left");
								$(".palyerRightValue").css("float", "left");
							}
							$(".progress").css("width", "75%");
							$(".time").css("width", "25%");
							if (isFullScreen == true) {
								videoFullScreen();
							}
							return false;
						}
					};
					/* 用户变化屏幕方向时自适应屏幕宽高度，同时根据是否有入出点调整入出点div布局。
					     并添加入出点点击事件*/
					$(window)
							.bind(
									'orientationchange',
								function(e) {
									setTimeout(
									function() {
										direction();
												}, 50);
											});

					// 设置播放器容器div大小
					var controllsInitSize = function(width, height) {
						$("#videoContainer").css("width", width);
						$("#videoContainer").css("height", height);
					};
					
					
					var video = $('#myVideo');
					// 伪全屏，使播放器宽度和高度铺满整个屏幕，同时让控制条呈现浮动效果
					var videoFullScreen = function() {
						if (controlsfixed == 1) {
							fullScreenFixed = 1;
							$("#videoContainer").removeClass(
									"fixedvideoContainer");
							$("body").css("background", "#000");
							$(".control").css("background", "");
							$("#videoContainer").css("color", "#ccc");
							var windowHeight = $(window).height();
							var windowWidth = $(window).width();
							$(video).attr("width", windowWidth);
							$(video).attr("height", windowHeight);
							controllsInitSize(windowWidth, windowHeight);
						} else {
							$("body").css("background", "#000");
							$(".control").css("background", "#000");
							$("#videoContainer").removeClass("videoContainer");
							$("#videoContainer").css("color", "#ccc");
							var windowHeight = $(window).height();
							var windowWidth = $(window).width();
							$(video).attr("width", windowWidth);
							$(video).attr("height", windowHeight);
							controllsInitSize(windowWidth, windowHeight);
						}

					};
                    //退出全屏，使样式和布局恢复全屏前的状态
					var videoExitFullScreen = function() {
						if (controlsfixed == 1) {
							fullScreenFixed = 0;
							$("body").css("background", "");
							$("#videoContainer")
									.addClass("fixedvideoContainer");
							$("#videoContainer").css("color", "#ccc");
							$(".control").css("bottom", showBotttom);
							$(".control").css("background", "#000");
							$(video).attr("width", "100%");
							$(video).attr("height", "100%");
							controllsInitSize("", "");
						} else {
							$("body").css("background", "");
							$("#videoContainer").addClass("videoContainer");
							$(video).attr("width", "100%");
							$(video).attr("height", "100%");
							controllsInitSize("", "");
						}

					};

					video[0].removeAttribute("controls");
					$('.control').show().css({
						'bottom' : showBotttom
					});
					$('.loading').fadeIn(500);
					// before everything get started
					video.on('loadedmetadata', function() {

						// set video properties
						$('.current').text(timeFormat(0));
						$('.duration').text(timeFormat(video[0].duration));
						updateVolume(0, 0.7);

						// start to get video buffering data
						setTimeout(startBuffer, 150);

						// bind video events
						$('#videoContainer').append('<div id="init"></div>')
								.hover(function() {
									if (controlsfixed != 1) {
										$('.control').stop().animate({
											'bottom' : 0
										}, 500);
									}
									
								}, function() {
									if (!volumeDrag && !timeDrag) {
										$('.control').stop().animate({
											'bottom' : showBotttom
										}, 500);
									}
								}).on('click', function() {
									$('#init').remove();
									$('.btnPlay').addClass('paused');
									$(this).unbind('click');
									video[0].play();
								});
						$('#init').fadeIn(200);
					});

					// display video buffering bar
					var startBuffer = function() {
						var currentBuffer = video[0].buffered.end(0);
						var maxduration = video[0].duration;
						var perc = 100 * currentBuffer / maxduration;
						$('.bufferBar').css('width', perc + '%');

						if (currentBuffer < maxduration) {
							setTimeout(startBuffer, 500);
						}
					};

					// display current video play time
					video.on('timeupdate', function() {
						var currentPos = video[0].currentTime;
						var maxduration = video[0].duration;
						var perc = 100 * currentPos / maxduration;
						$('.timeBar').css('width', perc + '%');
						$('.current').text(timeFormat(currentPos));
					});

					// CONTROLS EVENTS
					// video screen and play button clicked
					video.on('click', function() {
						playpause();
					});
					$('.btnPlay').on('click', function() {
						playpause();
					});
					var playpause = function() {
						if (video[0].paused || video[0].ended) {
							$('.btnPlay').addClass('paused');
							video[0].play();
						} else {
							$('.btnPlay').removeClass('paused');
							video[0].pause();
						}
					};

					// speed text clicked
					$('.btnx1').on('click', function() {
						fastfowrd(this, 1);
					});
					$('.btnx3').on('click', function() {
						fastfowrd(this, 3);
					});
					var fastfowrd = function(obj, spd) {
						$('.text').removeClass('selected');
						$(obj).addClass('selected');
						video[0].playbackRate = spd;
						video[0].play();
					};

					// stop button clicked
					$('.btnStop').on('click', function() {
						$('.btnPlay').removeClass('paused');
						updatebar($('.progress').offset().left);
						video[0].pause();
					});

					// fullscreen button clicked
					$('.btnFS').on('click', function() {
						if (isFullScreen == false) {
							videoFullScreen();
							isFullScreen = true;
						} else {
							videoExitFullScreen();
							isFullScreen = false;
						}

						/*
						 * if ($.isFunction(video[0].webkitEnterFullscreen)) {
						 * //video[0].webkitEnterFullscreen(); } else if
						 * ($.isFunction(video[0].mozRequestFullScreen)) {
						 * //video[0].mozRequestFullScreen(); } else {
						 * alert('Your browsers doesn\'t support fullscreen'); }
						 */
					});

					// light bulb button clicked
					$('.btnLight').click(function() {
						if (isFullScreen)
							return;
						$(this).toggleClass('lighton');

						// if lightoff, create an overlay
						if (!$(this).hasClass('lighton')) {
							$('body').append('<div class="overlay"></div>');
							$('.overlay').css({
								'position' : 'absolute',
								'width' : 100 + '%',
								'height' : $(document).height(),
								'background' : '#000',
								'opacity' : 0.9,
								'top' : 0,
								'left' : 0,
								'z-index' : 999
							});
							$('.videoContainer').css({
								'z-index' : 1000
							});
						}
						// if lighton, remove overlay
						else {
							$('.overlay').remove();
						}
					});

					// sound button clicked
					$('.sound').click(
							function() {
								video[0].muted = !video[0].muted;
								$(this).toggleClass('muted');
								if (video[0].muted) {
									$('.volumeBar').css('height', 0);
								} else {
									$('.volumeBar').css('height',
											video[0].volume * 100 + '%');
								}
							});

					// VIDEO EVENTS
					// video canplay event
					video.on('canplay', function() {
						$('.loading').fadeOut(100);
					});

					// video canplaythrough event
					// solve Chrome cache issue
					var completeloaded = false;
					video.on('canplaythrough', function() {
						completeloaded = true;
					});

					// video ended event
					video.on('ended', function() {
						$('.btnPlay').removeClass('paused');
						video[0].pause();
					});

					// video seeking event
					video.on('seeking', function() {
						// if video fully loaded, ignore loading screen
						if (!completeloaded) {
							$('.loading').fadeIn(200);
						}
					});

					// video seeked event
					video.on('seeked', function() {
					});

					// video waiting for more data event
					video.on('waiting', function() {
						$('.loading').fadeIn(200);
					});

					// VIDEO PROGRESS BAR
					// when video timebar clicked
					timeDrag = false; /* check for drag event */
					var progressFun = function(e) {
						e.preventDefault();
						var touch = event.touches[0];
						timeDrag = true;
						updatebar(touch.pageX);
					};
					var progressUpFun = function(e) {
						var touch = event.touches[0];
						if (timeDrag) {
							timeDrag = false;
							updatebar(touch.pageX);
						}
					};
					var progressMoveFun = function(e) {
						var touch = event.touches[0];
						if (timeDrag) {
							updatebar(touch.pageX);
						}
					};
					var updatebar = function(x) {
						var progress = $('.progress');

						// calculate drag position
						// and update video currenttime
						// as well as progress bar
						var maxduration = video[0].duration;
						var position = x - progress.offset().left;
						var percentage = 100 * position / progress.width();
						if (percentage > 100) {
							percentage = 100;
						}
						if (percentage < 0) {
							percentage = 0;
						}
						$('.timeBar').css('width', percentage + '%');
						video[0].currentTime = maxduration * percentage / 100;
					};
					document.getElementById("progress").addEventListener(
							"touchstart", progressFun, false);
					document.addEventListener("touchmove", progressMoveFun,
							false);
					document.addEventListener("touchend", progressUpFun, false);
					// VOLUME BAR
					// volume bar event
					var volumeDrag = false;
					$('.volume').on('mousedown', function(e) {
						volumeDrag = true;
						video[0].muted = false;
						$('.sound').removeClass('muted');
						updateVolume(e.pageX);
					});
					$(document).on('mouseup', function(e) {
						if (volumeDrag) {
							volumeDrag = false;
							updateVolume(e.pageX);
						}
					});
					$(document).on('mousemove', function(e) {
						if (volumeDrag) {
							updateVolume(e.pageX);
						}
					});
					var updateVolume = function(x, vol) {
						var volume = $('.volume');
						var percentage;
						// if only volume have specificed
						// then direct update volume
						if (vol) {
							percentage = vol * 100;
						} else {
							var position = x - volume.offset().left;
							percentage = 100 * position / volume.width();
						}

						if (percentage > 100) {
							percentage = 100;
						}
						if (percentage < 0) {
							percentage = 0;
						}

						// update volume bar and video volume
						$('.volumeBar').css('height', percentage + '%');
						video[0].volume = percentage / 100;

						// change sound icon based on volume
						if (video[0].volume == 0) {
							$('.sound').removeClass('sound2').addClass('muted');
						} else if (video[0].volume > 0.5) {
							$('.sound').removeClass('muted').addClass('sound2');
						} else {
							$('.sound').removeClass('muted').removeClass(
									'sound2');
						}

					};

					// Time format converter - 00:00
					var timeFormat = function(seconds) {
						var m = Math.floor(seconds / 60) < 10 ? "0"
								+ Math.floor(seconds / 60) : Math
								.floor(seconds / 60);
						var s = Math.floor(seconds - (m * 60)) < 10 ? "0"
								+ Math.floor(seconds - (m * 60)) : Math
								.floor(seconds - (m * 60));
						return m + ":" + s;
					};
					/**
					 * 重置结束打点信息
					 */
					var resetEndPoint = function() {
						$('.endpoint').css('display','none');
						$('.endpoint').css('margin-left', 0 + '%');
						outpointvalue = "00:00:00:00";
					    $('.palyerRightValue').html(outpointvalue);
					};
					
					/**
					 * 重置开始打点信息
					 */
					var resetStartPoint = function() {
						$('.palyerLeftValue').html("00:00:00:00");
						$('.startpoint').css('margin-left',0 + '%');
						$('.startpoint').css('display','none');
						inpointvalue = "00:00:00:00";
					};
					
					// 获取开始节点设置到相应位置
					
					$(".control").delegate("#palyerLeft","click",function(){
						var outpoint = formatHMSFToNumber(outpointvalue);
						var currentPos = video[0].currentTime;
						if (outpoint < currentPos) {
							resetEndPoint();
						}
						var currentTimeFormat = getPoint();
						$('.palyerLeftValue').html(currentTimeFormat);
						var maxduration = video[0].duration;
						var perc = 100 * currentPos / maxduration;
						$('.startpoint').css('display','block');
						$('.startpoint').css('margin-left', perc + '%');
						inpointvalue =  currentTimeFormat;

					});
					/**
					 * 获取节点
					 * 
					 * @author zhaipeng
					 * @time 2016-03-04
					 * @returns 00:00:00:00
					 */
					function getPoint() {
						return getPlayTime(video[0].currentTime);
					}

					// 获结束节点设置到相应位置
					$(".control").delegate("#palyerRight","click",function(){
						var currentTime = getPoint();
						var sTime = formatHMSFToNumber($(
								'.palyerLeftValue').html());
						var eTime = video[0].currentTime;
						var maxduration = video[0].duration;
						var perc = 100 * eTime / maxduration;
						$('.endpoint').css('display','block');
						$('.palyerRightValue').html(currentTime);
						$('.endpoint').css('margin-left',
								perc + '%');
						if (eTime < sTime) {
							resetStartPoint();
						}
						outpointvalue =  currentTime;

					});
					/**
					 * 当前媒体播放时间，00：00:00:00格式
					 * 
					 * @returns {String}
					 */
					function getPlayTime(dwFrameCount) {
						var MOVIESCALE = 1;
						var hour = (dwFrameCount / (MOVIESCALE * 3600));
						var dwReste = dwFrameCount % (MOVIESCALE * 3600);

						var minute = (dwReste / (MOVIESCALE * 60));
						var dwReste = (dwReste % (MOVIESCALE * 60));

						var second = dwReste / MOVIESCALE;
						var dwReste = (dwReste % MOVIESCALE);

						var minsec = dwReste * fps;

						var sh = Math.floor(hour) >= 10 ? Math.floor(hour)
								: "0" + Math.floor(hour);
						var sm = Math.floor(minute) >= 10 ? Math.floor(minute)
								: "0" + Math.floor(minute);
						var ss = Math.floor(second) >= 10 ? Math.floor(second)
								: "0" + Math.floor(second);
						var sf = Math.ceil(minsec) >= 10 ? Math.ceil(minsec)
								: "0" + Math.ceil(minsec);

						return sh + ":" + sm + ":" + ss + ":" + sf;

					}
					/**
					 * 解析时间
					 * 
					 * @param time
					 *            xx:xx:xx:xx
					 * @returns {Number}
					 */
					function formatHMSFToNumber(time) {
						var str = new String(time);
						var t = str.split(":");
						return Number(t[0]) * 3600 + Number(t[1]) * 60
								+ Number(t[2]) * 1 + Number(t[3]) / fps;

					}
				});