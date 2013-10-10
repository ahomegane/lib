/* version: 1.0.0 */
/* require: none */
;(function(window, document, undefined){

  window._l = window._l || {};
  _l.util = _l.util || {};

  var Event = function() {
    this.fn = Event.prototype;
  }
  Event.prototype = {
    
    ready: function(callback) {

      if (document.readyState === "complete") {//すでにonloadを実行している場合は即実行
        setTimeout(callback, 1);

      } else if(document.addEventListener) {//standard
        document.addEventListener("DOMContentLoaded", callback, false);
      
      } else {//legacy

        //http://javascript.nwbox.com/IEContentLoaded/
        var isReady = false;
        // only fire once
        function done() {
          if (!isReady) {
            isReady = true;
            callback();
          }
        };
        // polling for no errors
        (function doScrollCheck() {
          try {
            // throws errors until after ondocumentready
            document.documentElement.doScroll('left');
          } catch (e) {
            setTimeout(doScrollCheck, 50);
            return;
          }
          // no errors, fire
          done();
        })();
        // trying to always fire before onload
        document.onreadystatechange = function() {
          if (document.readyState == 'complete') {
            document.onreadystatechange = null;
            done();
          }
        };
      }
    },

    load: function(callback) {
      this.addEventListener(window, 'load', callback);
    },

    addEventListener: function(el, ev, listenerFunc) {
      if(el.addEventListener) { //IE以外
        el.addEventListener(ev, listenerFunc, false);
      } else if(el.attachEvent) { //IE
        el.attachEvent('on' + ev, listenerFunc);
      }
    },

    removeEventListener: function(el, ev, listenerFunc){
      if(el.removeEventListener) { //except for IE
        el.removeEventListener(ev, listenerFunc, false);
      } else if(el.detachEvent) { //IE
        el.detachEvent('on' + ev, listenerFunc);
      }
    },

    stopPropagation: function(e) {
      if(e.stopPropagation) { //except for IE
        e.stopPropagation();
      } else if(window.event) { //IE
        window.event.cancelBubble = true;
      }
    },

    preventDefault: function(e) {
      if(e.preventDefault) { //except for IE
        e.preventDefault();
      } else if(window.event) { //IE
        window.event.returnValue = false;
      }
    }

  }

  _l.util.event = new Event();

})(window, document);