/* version: 1.0.0 */
/* require: none */
;(function(window, document, undefined){

  window._l = window._l || {};

  window.requestAnimationFrame = (function() {
    return window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      function(f) { return window.setTimeout(f, 1000 / 60); };
  })();
  window.cancelRequestAnimationFrame = (function() {
    return window.cancelRequestAnimationFrame ||
           window.webkitCancelRequestAnimationFrame ||
           window.mozCancelRequestAnimationFrame ||
           window.msCancelRequestAnimationFrame ||
           window.oCancelRequestAnimationFrame ||
           function(id) { window.clearTimeout(id); };
  }());

  window.performance = window.performance || {};
  if (!window.performance.now) {
    window.performance.now = (function() {
      return performance.mozNow || 
      performance.msNow || 
      performance.oNow || 
      performance.webkitNow ||
      function() { return +(new Date)};
    })();
  }

  var Util = function() {
    this.fn = Util.prototype;
  }
  Util.prototype = {

    toArray: function(a) {
      try {
        return Array.prototype.slice.call(a); //not work lteIe8

      } catch(e) {
        var rv = new Array(a.length);
        for(i = 0, l=rv.length; i < l; i++) { rv[i] = a[i]; }
        return rv;
      }
    },

    clearTimer: function(timerIdArray) {
     do{
        clearTimeout(timerIdArray.shift());
      } while (timerIdArray.length > 0);
    },

    loopTimer: function(render, time) {
      return new LoopTimer(render, time);
    },

    //16進数の色の数値のランダムに生成
    //maxval〜minval(16進数指定 0x******)を指定
    //http://www.nthelp.com/colorcodes.htm
    getRandomXColor: function(maxVal, minVal) {
      if(maxVal == null) maxVal = 0xffffff;
      if(minVal == null) minVal = 0x000000;
      //色指定は3or6桁である必要条件。そのため、'000000'を＋し、後ろから6桁をslice
      var rv = '000000' + (Math.floor(Math.random() * (maxVal-minVal)) + minVal).toString(16);
      rv = '#' + rv.slice(-6);
      return rv;
    }

  }

  var LoopTimer = function(render, time) {
    this.ids = [];
    this.init(render, time);
    this.fn = LoopTimer.prototype;
  }
  LoopTimer.prototype = {

    init: function(render, time) {
      var self = this;      
      (function loop() {
        do{
          clearTimeout(self.ids.shift());
        } while (self.ids.length > 0);
        requestAnimationFrame(render);
        self.ids.push(setTimeout(loop, time));
      })();
    },

    stop: function() {
      do{
        clearTimeout(this.ids.shift());
      } while (this.ids.length > 0);
    }
  }

  _l.util = new Util();

})(window, document);