/***
 * 该js文件用于播放器中触屏拖动进行快进快退，音量控制的功能
 * 该js引用在vidoe.js文件之后进行使用
 * 
 * author: renyuwei
 * time  : 2016.4.7
 */


var touchStartY = 0;          //接触屏时y坐标
var touchStartX = 0;          //接触屏时x坐标
var touchDistancY = 0;        //垂直移动距离
var touchDistancX = 0;        //水平移动距离
var touchStartVolume = 0;     //开始音量
var horizontalthreshold = 45; //垂直移动阈值
var verticalthreshold = 20;  //水平移动阈值
var drag = false;
$(document).ready(
		function() {
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

				var sh = Math.floor(hour) >= 10 ? Math.floor(hour) : "0"
						+ Math.floor(hour);
				var sm = Math.floor(minute) >= 10 ? Math.floor(minute) : "0"
						+ Math.floor(minute);
				var ss = Math.floor(second) >= 10 ? Math.floor(second) : "0"
						+ Math.floor(second);
				var sf = Math.ceil(minsec) >= 10 ? Math.ceil(minsec) : "0"
						+ Math.ceil(minsec);

				return sh + ":" + sm + ":" + ss + ":" + sf;

			}

			var video = $('#myVideo');
			/** 暂停功能* */
			var playpause = function() {
				if (video[0].paused || video[0].ended) {
					$('.btnPlay').addClass('paused');
					video[0].play();
				} else {
					$('.btnPlay').removeClass('paused');
					video[0].pause();
				}
			};
			/** 隐藏播放器控制条* */
			var hideControll = function() {
				$('.control').stop().animate({
					'bottom' : showBotttom
				}, 500);
			};
			/** 显示播放器控制条* */
			var showControll = function() {
				$('.control').stop().animate({
					'bottom' : 0
				}, 500);
			};
			/** 更新音量图标* */
			var updateVolumeBar = function(volumeValue) {
				if (volumeValue == 0) {
					$('.volumeBar').css('height', 0);
					$('.sound').removeClass('sound2').addClass('muted');
				} else if (volumeValue > 0.5) {
					$('.volumeBar').css('height', video[0].volume * 100 + '%');
					$('.sound').removeClass('muted').addClass('sound2');
				} else {
					$('.volumeBar').css('height', video[0].volume * 100 + '%');
					$('.sound').removeClass('muted').removeClass('sound2');
				}
			};
			/** 触摸播放屏时触发该事件* */
			var touchStartFun = function(event) {
				event.preventDefault();
				var touch = event.touches[0];
				touchStartY = touch.pageY;
				touchStartX = touch.pageX;
				touchStartVolume = video[0].volume;
				touchStartVideoTime = video[0].currentTime;
			};
			/** 触摸播放屏并移动时触发该事件* */
			var touchMoveFun = function(event) {
				var touch = event.touches[0];
				var y = touch.pageY;
				var x = touch.pageX;
				var X = x - touchStartX;
				var Y = y - touchStartY;
				if (Math.abs(X) > Math.abs(Y) && X > 0) { // 从左往右移动
					drag = true;
					if (Math.abs(X) > horizontalthreshold) {
						$(".quickforwad").css("display", "block");
						touchDistancX = x - touchStartX;
						var timeValue = touchStartVideoTime + touchDistancX
								/ fps;
						if (timeValue >= video[0].duration) {
							timeValue = video[0].duration;
						} else if (timeValue < 0) {
							timeValue = 0;
						}
						video[0].currentTime = timeValue;
						$(".outpoint").html("/ " + getPlayTime(video[0].duration));
						$(".inpoint").html(getPlayTime(timeValue));
						$("#forwardbackicon").attr("src","customvideo/img/quickforward.png");
					}
				} else if (Math.abs(X) > Math.abs(Y) && X < 0) { // 从右往左移动
					drag = true;
					if (Math.abs(X) > horizontalthreshold) {
						$(".quickforwad").css("display", "block");
						touchDistancX = x - touchStartX;
						var timeValue = touchStartVideoTime + touchDistancX
								/ fps;
						if (timeValue >= video[0].duration) {
							timeValue = video[0].duration;
						} else if (timeValue < 0) {
							timeValue = 0;
						}
						video[0].currentTime = timeValue;
						$(".outpoint").html("/ " + getPlayTime(video[0].duration));
						$(".inpoint").html(getPlayTime(timeValue));
						$("#forwardbackicon").attr("src","customvideo/img/quickbackward.png");
					}
				} else if ((Math.abs(Y) > Math.abs(X) && Y > 0) // 上下移动
						|| (Math.abs(Y) > Math.abs(X) && Y < 0)) {
					if (Math.abs(Y) < verticalthreshold)
						return;
					touchDistancY = touchStartY - y;
					if (touchDistancY != 0) {
						drag = true;
						$(".volume").css("display", "block");
						var volumeValue = touchDistancY / 100;
						var volumeValue = touchStartVolume + volumeValue
						if (volumeValue >= 1) {
							video[0].volume = 1;
						} else if (volumeValue <= 0) {
							video[0].volume = 0;
						} else {
							video[0].volume = volumeValue;
						}
						updateVolumeBar(video[0].volume);
					} else {
						drag = false;
					}
				}
			};
			/* 离开触发屏时触发该事件 */
			var touchEndFun = function(event) {
				if (!drag) {
					playpause();
					if (controlsfixed == 0 || fullScreenFixed == 1) {
						showControll();
					}
					setTimeout(function() {
						if (!timeDrag) {
							if (controlsfixed == 0 || fullScreenFixed == 1) {
								hideControll();
							}
						}
					}, 10000);
				} else {
					drag = false;
				}
				$(".volume").delay(5000).fadeOut(500);
				$(".quickforwad").delay(5000).fadeOut(500);
			};
			// 为播放屏添加触发，移动，离开三个事件
			document.getElementById("myVideo").addEventListener("touchstart",
					touchStartFun, false);
			document.getElementById("myVideo").addEventListener("touchmove",
					touchMoveFun, false);
			document.getElementById("myVideo").addEventListener("touchend",
					touchEndFun, false);
		});