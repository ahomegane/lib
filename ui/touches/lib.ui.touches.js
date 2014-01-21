/* version: 1.0.0 */
/* require: none / jquery */
;(function(window, document, $, undefined) {

  window._l = window._l || {};
  _l.ui = _l.ui || {};

  var Touches = function(options) {
    options = options || {};
    this.options = {
      context: options.context || document.body,
      mouse: options.mouse || false
    }

    this.context = this.options.context;
    this.canTouch = 'ontouchstart' in window;

    this.jquery = false;
    if ($ && this.context instanceof $) {
      this.jquery = true;
    }

    this.reset();

    this.eventList = [];

    this.fn = Touches.prototype;
  }
  Touches.prototype = {

    bind: function(callbacks) {
      var _this = this;
      this.callbacks = callbacks || {};

      if (this.jquery) {
        var evt = '';
        if (this.canTouch) {
          evt += 'touchstart touchmove touchend touchcancel';
        } else {        
          if (this.options.mouse) evt += ' mousedown mousemove mouseup mouseout';
        }
        var eventSet = {
          el: this.context,
          evt: evt,
          fn: $.proxy(this.listener, this)
        };
        this.eventList.push(eventSet);
        eventSet.el.on(eventSet.evt, eventSet.fn);
        return;
      }

      var evt = [];
      if (this.canTouch) {
        evt = evt.concat(['touchstart', 'touchmove', 'touchend', 'touchcancel']);
      } else {
        if (this.options.mouse) evt = evt.concat(['mousedown', 'mousemove', 'mouseup', 'mouseout']);
      }
      for (var i = 0, l = evt.length; i < l; i++) {
        if (this.context.length) {
          for (var j = 0, k = this.context.length; j < k; j++) {
            var eventSet = {
              el: this.context[j],
              evt: evt[i],
              fn: function(e) {
                _this.listener.call(_this, e);
              }
            };
            this.eventList.push(eventSet);
            eventSet.el.addEventListener(eventSet.evt, eventSet.fn, false);
          }
        } else {
          var eventSet = {
            el: this.context,
            evt: evt[i],
            fn: function(e) {
              _this.listener.call(_this, e);
            }
          };
          this.eventList.push(eventSet);
          eventSet.el.addEventListener(eventSet.evt, eventSet.fn, false);
        }
      }
      
      return;
    },

    unbind: function() {
      for (var i = 0, l = this.eventList.length; i < l; i++) {
        if (this.jquery) {
          this.eventList[i].el.off(this.eventList[i].evt, this.eventList[i].fn);
        } else {
          this.eventList[i].el.removeEventListener(this.eventList[i].evt, this.eventList[i].fn, false);
        }
      }
    },

    listener: function(e) {
      e.preventDefault();

      if (this.jquery) {
        var originalEvent = e.originalEvent;
      } else {
        var originalEvent = e;
      }

      var pageX = this.canTouch ? originalEvent.changedTouches[0].pageX : e.pageX,
          pageY = this.canTouch ? originalEvent.changedTouches[0].pageY : e.pageY;
      
      switch (e.type) {
        case 'touchstart':
        case 'mousedown':
          this.startTime = +new Date;   
          this.current.x = pageX;
          this.current.y = pageY;
          this.initial.x = this.current.x;
          this.initial.y = this.current.y;

          this.touchstart(e, this.initial);
          break;

        case 'touchmove':
        case 'mousemove':
          if (! this.startTime) return false;
          this.before.x = this.current.x;
          this.before.y = this.current.y;
          this.current.x = pageX;
          this.current.y = pageY;
          this.total.x = this.current.x - this.initial.x;
          this.total.y = this.current.y - this.initial.y;
          this.move.x = this.current.x - this.before.x;
          this.move.y = this.current.y - this.before.y;

          this.touchmove(e, this.total, this.current, this.move, this.before);
          break;

        case 'touchend':
        case 'mouseup':
          if (! this.startTime) return false;
          this.touchTime = +new Date - this.startTime;
          this.touchend(e, this.total, this.current, this.move, this.touchTime);
          this.reset();
          break;

        case 'touchcancel':
        case 'mouseout':        
          if (! this.startTime) return false;
          this.touchTime = +new Date - this.startTime;
          this.touchcancel(e, this.total, this.current, this.move, this.touchTime);
          this.reset();
          break;
      }
      return false;
    },

    touchstart: function(e, initial) {
      var callback = this.callbacks.touchstart;
      if (typeof callback == 'function') callback(e, initial);
    },

    touchmove: function(e, total, current, move, before) {
      var callback = this.callbacks.touchmove;
      if (typeof callback == 'function') callback(e, total, current, move, before);
    },

    touchend: function(e, total, current, move, touchTime) {
      var callback = this.callbacks.touchend;
      if (typeof callback == 'function') callback(e, total, current, move, touchTime);
    },

    touchcancel: function(e, total, current, move, touchTime) {
      var callback = this.callbacks.touchcancel;
      if (typeof callback == 'function') callback(e, total, current, move, touchTime);
    },

    reset: function() {      
      this.initial =  {
        x: 0,
        y: 0
      }
      this.current = {
        x: 0,
        y: 0
      }
      this.move =  {
        x: 0,
        y: 0
      }
      this.before = {
        x: 0,
        y: 0
      }
      this.total =  {
        x: 0,
        y: 0
      }
      this.startTime = false;

    }

  }

  _l.ui.touches = function(options) {
    return new Touches(options);
  }

})(window, document, jQuery);