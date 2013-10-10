/* version: 1.0.0 */
/* require: none */
;(function(document, window) {

  window._l = window._l || {};
  _l.media = _l.media || {};

 /**
  * MusicAnalyser Class
  * http://d.hatena.ne.jp/weathercook/20111121/1321892542
  */
  var MusicAnalyser = function(options) {
    var options = options || {};
    this.fallback = options.fallback || function() {
      alert('お使いのブラウザは対応していません。');
    }
    
    this.dataUrl;
    this.ctx;

    this.volume = 0.5;/* 0 〜 1 */
    this.isPlay = false;
    this.playbackRate = 1;

    this.isSupport = this.testSupport();

    this.init();

    this.fn = MusicAnalyser.prototype;
  }
  MusicAnalyser.prototype = {

    init: function(callback) {
      if (! this.isSupport) this.fallback();

      this.ctx = new webkitAudioContext();

      //volume contorol
      this.ctx.gainNode = this.ctx.createGainNode();
      this.ctx.gainNode.gain.value = this.volume;

      //analser
      this.ctx.analyser = this.ctx.createAnalyser();
      this.timeDomainData = new Uint8Array(this.ctx.analyser.frequencyBinCount);

      this.ctx.filter = this.ctx.createBiquadFilter();

    },

    getData: function(dataUrl, callback) {

      this.dataUrl = dataUrl;

      //get data
      var xhr = new XMLHttpRequest();
      xhr.open('GET', dataUrl, true);
      xhr.responseType = 'arraybuffer';
      
      var self = this;
      xhr.onload = function() {
        self.ctx.decodeAudioData(xhr.response, function(buffer){
          self.buffer = buffer;//data(ctxからsource生成→destinationにconnectで出力)
          if(typeof callback == 'function') callback();
        });
      }
      xhr.send();
    },

    createSource: function() {
      
      var src = this.ctx.createBufferSource();//sourceのオブジェクト(noteOn/Offするたびに使い捨て)
      
      src.buffer =  this.buffer;
      src.playbackRate.value = this.playbackRate;
      
      // this.ctx.filter.type = 5; //peaking
      // this.ctx.filter.frequency.value = 50;

      //destinationNode : 出力
      //src.connect(this.ctx.filter);
      src.connect(this.ctx.gainNode);
      this.ctx.gainNode.connect(this.ctx.analyser);
      this.ctx.analyser.connect(this.ctx.destination);

      return src;
    },

    play: function(callback, callbackEnded) {
      this.isPlay = true;

      this.ctx.src = this.createSource();   
      var endTime = this.ctx.currentTime + (this.ctx.src.buffer.duration/this.playbackRate);    
      //play start!
      this.ctx.src.noteOn(this.ctx.currentTime);

      var self = this;
      (function step(){
        
        //timeDomainData
        //self.ctx.analyser.getByteTimeDomainData(self.timeDomainData);//this.timeDomainDataを更新
        //memo:timeDomainData用係数
        //var k = (1/100)*(1/self.iMusic.volume);
        //dataの値を -1〜1 に標準化する係数。
        //dataは-100-100を基準にしているため、1/100
        //volumeにより割り算されているため、volumeのmax1で割った値を描ける

        self.ctx.analyser.getByteFrequencyData(self.timeDomainData);

        if(self.ctx.currentTime > endTime) {
          if(typeof callbackEnded == 'function') callbackEnded();
        } else {
          if(typeof callback == 'function') callback(self.timeDomainData);
        }
        
        if(self.isPlay) {
          requestAnimationFrame(step);
        }
      
      })();
    },

    //for test
    drawWave :function(data, options) {
      options = options || {};

      var canvas = options.canvas || document.getElementById('music_wave');
      var ctx = canvas.getContext('2d');
      
      ctx.beginPath();
      ctx.fillStyle = "#fff";
      ctx.rect(0,0,canvas.width,canvas.height);
      ctx.fill();
      var value;
      ctx.beginPath();
      ctx.moveTo(0,-999);
      for (var i=0; i<data.length; i++){
        value = data[i]-128+canvas.height/2; //2の8乗 = 128。8ビットデータのため
        ctx.lineTo(i,value);
      }
      ctx.moveTo(0,999);
      ctx.closePath();
      ctx.strokeStyle = "#555";
      ctx.stroke();

    },

    stop: function() {
      this.isPlay = false;
      this.ctx.src.noteOff(this.ctx.currentTime);
    },

    testSupport: function() {
      try {
        new webkitAudioContext();
      } catch(e) {
        return false;
      }
      return true;
    }

  }

  _l.media.musicanalyser = function(options) {
    return new MusicAnalyser(options);
  }
  
})(document, window);
