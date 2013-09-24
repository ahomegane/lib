/* version: 1.0.0 */
/* require: lib.env.js */
;(function(window, document, undefined) {

  window._l = window._l || {};
  _l.media = _l.media || {};

	var AudioHdl = function(filepath, trackList) {
		this.filepath = filepath;
		this.ext = this.getExt();
		
		this.canAudio = true;
		if (!this.ext) this.canAudio = false;
		
		this.timeScale = 1000;
		this.trackListOrigin = trackList;
		this.trackListDefault = this.initTrackList(trackList);
		this.trackList = this.initTrackList(trackList);

		this.audio = new Audio(this.filepath + this.ext);

		this.isCanPlay = false;

		this.timerId = {
			loop: [],
			seek: []
		};
		this.isStopTimer = {
			loop: false,
			seek: false
		};
		this.que = {
			timeupdate: []
		};
		this.audio.addEventListener('timeupdate', $.proxy(function(e) {
			this.runQue('timeupdate');
		},this));

		this.fn = Audio.prototype;
	}
	AudioHdl.prototype = {

		getExt: function() {
			var audio = new Audio();
			var ext = 'wav';
			if (audio.canPlayType('audio/mp3') == 'maybe') {
				ext = '.mp3';
			} else if (audio.canPlayType('audio/ogg') == 'maybe') {
				ext = '.ogg';
			}
			return ext;
		},

		fallback: function() {
			alert('audio再生に対応していないブラウザです。');
		},

		load: function(callback) {
			var self = this;
			var listener = function() {
				self.isCanPlay = true;
				if(typeof callback == 'function') callback();
				self.audio.removeEventListener('canplay', listener);
			}

			if (this.isCanPlay) {
				if(typeof callback == 'function') callback();
				return;
			}
			this.audio.addEventListener('canplay', listener, false);
			this.audio.load();
		},

		canPlay: function() {
			return this.isCanPlay;
		},

		play: function() {
			this.stopTimer('seek');
			this.audio.play();
		},

		pause: function() {
			this.stopTimer('seek');
			this.audio.pause();
		},

		seek: function(trackName, callback) {
			var self = this;
			
			var startTime = this.trackList[trackName].startTime;
			this.setCurrentTime(startTime);

			this.play();

			var start = +new Date,
					duration = this.trackList[trackName]['duration'];
			var c = _l.browser.safari ? 800 : 0;//safariではなぜか短くなる
			(function loop() {
				if ((+new Date - start) > duration + c) {
					self.pause();
					if (typeof callback == 'function') callback();				
				} else {
					self.addTimer('seek', loop, 200);
				}
			})();
		},

		changeSpeed: function(rate) {
			this.audio.playbackRate = rate;
			this.audio.defaultPlaybackRate = rate;

			var trackListDefault = this.trackListDefault;
			this.trackList = (function() {
				var rv = {};
				for (var i in trackListDefault) {
					rv[i] = {};
					for (var j in trackListDefault[i]) {
						rv[i][j] = trackListDefault[i][j] / rate;
					}
				}
				return rv;
			})();
		},

		timeupdate: function(callback) {
			var self = this;
			this.que.timeupdate.push(function() {
				callback(self.audio.currentTime);
			});
		},

		startLoop: function(startTime, endTime) {
			var start = +new Date,
					duration = endTime - startTime;
			var self = this;
			this.setCurrentTime(startTime);
			this.play();
			(function loop() {
				if ((+new Date - start) > duration) {
					self.setCurrentTime(startTime);
					start = +new Date;
				}
				self.addTimer('loop', loop, 200);
			})();
		},

		stopLoop: function() {
			this.stopTimer('loop');
			this.pause();
		},

		setVolume: function(volume) { /* iPhoneだと設定を無視。必ず1 */
			this.audio.volume = +volume;/* 0-1 */
		},

		getVolume: function() {
			return this.audio.volume;/* 0-1 */
		},

		setCurrentTime: function(time) {
			this.audio.currentTime =  time / this.timeScale;
		},

		getCurrentTime: function() {
			return this.audio.currentTime * this.timeScale;
		},

		getTotalTime: function() {
			return this.audio.duration * this.timeScale;
		},

		runQue: function(queName) {
			for (var i = 0, l = this.que[queName].length; i < l; i++) {
				this.que[queName][i]();
			}
		},

		addTimer: function(timerName, callback, duration) {
			this.timerId[timerName].push(setTimeout(callback), duration);
		},

		stopTimer: function(timerName) {
			do {
				clearTimeout(this.timerId[timerName].shift());
			} while(this.timerId[timerName].length > 0);
		},

		initTrackList: function(trackList) {
			var rv = {};
			for (var i in trackList) {
				rv[i] = {};
				for (var j in trackList[i]) {
					rv[i][j] = trackList[i][j] * this.timeScale;
				}
			}
			return rv;
		}

	}

	_l.media.audio = function(filepath, trackList) {
		return new AudioHdl(filepath, trackList);
	}

})(window, document);