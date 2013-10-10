/**
 * responsive framework atmedia.js
 * [version] 1.0.0
 * [global namespace] $.atmedia
 * [jQuery] version 1.7.0 or above
 */
;(function(window, document, $, undefined) {

  "use strict";

  var $window = $(window);

  // handle event
  var Handler = function() {
    this.splitter = '/';

    this.isReadied = false;
    this.isLoaded = false;

    this.que = {
      /*
      ready: {
        _callbacks: [
          { fn: function(){}, options: { sort: 0, context: this } },
          { fn: function(){}, options: { sort: 0, context: this } }
        ],
        _update: true,
        _define: { fn: function(){}, context: this, argument: [x,y] }
        
        change: {
          _callbacks: [ ... ]
          _update: ...,
          _define: { ... }
        }
      }
      */
    };
    this.fn = Handler.prototype;
  }
  Handler.prototype = {

    /** initialize **/

    init: function() {
      $($.proxy(function() {
        this.ready();
        this.load();
        this.resize();
        this.orientationchange();
        this.scroll();        
        this.custom();        
      }, this)); 
    },

    /** root event **/

    ready: function() {
      this.publish('ready');
      this.isReadied = true;
    },

    load: function() {
      $window
        .on('load', $.proxy(function() {
          this.isLoaded = true;
          this.publish('load');
        }, this));
    },

    resize: function() {
      $window.stop(true, true)
        .on('resize orientationchange', $.proxy(function() {
          this.publish('resize', [$window.width(), $window.height()]); 
        }, this));    
    },

    orientationchange: function() {
      $window.stop(true, true)
        .on('orientationchange', $.proxy(function() {
          this.publish('orientationchange', [$window.width(), $window.height()]);
        }, this));
    },

    scroll: function() {
      $window.stop(true, true)
        .on('scroll', $.proxy(function() {
          this.publish('scroll', [$window.scrollTop(), $window.scrollLeft()]);
        }, this));
    },

    custom: function() {
      this.publish('custom');
    },

    /** publish subscribe **/

    define: function(ev, fn, options) {
      options = options || {};
      var list = this.parseEventStr(ev);

      for (var i = 0, l = list.length; i < l; i++) {
        var path = list[i],
            rootEv = this.parseEventPath(path)[0],
            que = this.getQue(path),
            define = que._define; 
        define.fn = fn;
        if(options.context) define.context = options.context;
        if(options.argument) define.argument = options.argument;
      }
      return this;
    },

    undefine: function(ev) {
      var que = this.getQue(ev);
      que = {};
      return this;
    },

    publish: function(ev, argument) {
      var list = this.parseEventStr(ev);

      for (var i = 0, l = list.length; i < l; i++) {
        var path = list[i],
            rootEv = this.parseEventPath(path)[0],
            que = this.getQue(path),
            callbacks = que._callbacks;

        if (que._update) {
          this.sortCallbacks(callbacks);
          que._update = false;
        }

        this.runCallbacks(callbacks, argument, rootEv);
      }
      return this;
    },

    subscribe: function(ev, fn, options) {
      var list = this.parseEventStr(ev);

      for (var i = 0, l = list.length; i < l; i++) {
        var path = list[i],
            rootEv = this.parseEventPath(path)[0],
            que = this.setQue(path, fn, options);        
        que._update = true;

        if (rootEv == 'ready' && this.isReadied || rootEv == 'load' && this.isLoaded) {
          var define = que._define,
              fn = define.fn,
              context = define.context || window,
              argument = define.argument || [];
          if (typeof fn == 'function') {
            fn.apply(context, argument);
          }
        }
      }
      return this;
    },

    unsubscribe: function(ev, fn) {
      var list = this.parseEventStr(ev);

      for (var i = 0, l = list.length; i < l; i++) {
        var path = list[i],
            callbacks = this.getQue(path)._callbacks;
        for (var j = 0, k = callbacks.length; j < k; j++) {
          if (callbacks[j].fn === fn) {
            this.removeCallbacks(callbacks, j);
            break;
          }
        }       
      }
      return this;
    },

    getQue: function(path) {
      var list = this.parseEventPath(path),
          que = this.que;

      for (var i = 0, l = list.length; i < l; i++) {
        if (!que[list[i]]) {
          que = this.createQue(que, list[i]);
        }
        que = que[list[i]];
      }
      return que;
    },

    setQue: function(path, fn, options) {
      var que = this.getQue(path);
      que._callbacks.push({
            fn: fn,
            options: options
          });
      return que;
    },

    createQue: function(que, ev) {
      que[ev] = {
        _callbacks: [],
        _update: true,
        _define: {
          fn: function() {
            this.publish(ev);
          },
          context: this,
          argument: []
        }
      }
      return que;
    },

    runCallbacks: function(callbacks, argument, rootEv) {
      for (var i = 0; i < callbacks.length; i++) {  
        callbacks[i].options = callbacks[i].options || {};
        
        if (typeof callbacks[i].fn == 'function') {
          var context = callbacks[i].options.context || window;
          argument = argument || [];
          callbacks[i].fn.apply(context, argument);

          if (rootEv && (rootEv == 'ready' || rootEv == 'load')) {
            this.removeCallbacks(callbacks, i);
            i--;
          }
        }
      }
    },

    removeCallbacks: function(callbacks, index) {
      return callbacks.splice(index, 1);
    },

    sortCallbacks: function(callbacks) {
      var l =  callbacks.length,
          index = l + 1;

      for (var i = 0; i < l; i++) {
        callbacks[i].options = callbacks[i].options || {};
        
        if (!callbacks[i].options.sort) {
          callbacks[i].options.sort = ++index;
        } else if (callbacks[i].options.sort == 'first') {          
          callbacks[i].options.sort = -1;
        }
      }

      callbacks.sort(function (a, b){
        return ( +a.options.sort - +b.options.sort);
      });

      return callbacks;
    },

    parseEventStr: function(path) {
      //ex. change/large change/medium　→ [change/large, change/medium]
      if (!path) return false;
      return this.castEventStr(path).split(/\s+/);
    },

    parseEventPath: function(path) {
      //ex. change/large　→ [change, large]
      if (!path) return false;
      return this.castEventStr(path).split(this.splitter);
    },

    castEventStr: function(eventStr) {
      if (!eventStr) return false;
      var reg = new RegExp('^\\s*\\' + this.splitter + '|\\' + this.splitter + '\\s*$|^\\s*|\\s*$','g');
      return eventStr.replace(reg, '');
    }

  }

  var handler = new Handler();
  
  // model for class 
  var Klass = function() {
    this.fn = Klass.prototype
  }
  Klass.prototype = {

    extend: function(obj) {
      $.extend(this, obj);
    },

    include: function(obj) {
      $.extend(this.fn, obj);
    }
  
  }

  var klass = new Klass();

  // define element related CSS
  var DefineElement = function(args) {
    if (!args.id) return null;
    this.id = args.id;
    this.style = {};
    this.statusList = [];

    if (args.style) {
      this.addStyle(args.style);
    }
    this.el = $('<div id="' + this.id + '"/>');
    $('body').prepend(this.el);

    this.fn = DefineElement.prototype;
    $.extend(this.fn, klass);
  }
  DefineElement.prototype = {

    addStyle: function(style) {
      for (var status in style) {
        this.statusList.push([status, status.charAt(0).toUpperCase() + status.slice(1)]);
      }
      $.extend(true, this.style, style);
    },

    getStatus: function() {
      var status,
          style = this.style;
      
      for (var key in style) {
        if (style[key] && this.el.css(style[key].prop) == style[key].val) {
          status = key;
          break;
        }
      }
      return status;
    },

    matchStatus: function(key) {
      var property = this.style[key];
      return property && this.el.css(property.prop) == property.val;
    }

  }

  // define custom event
  var DefineEvent = function(args) {
    this.name = handler.parseEventStr(args.name);
    this.parent = handler.castEventStr(args.parent);
    this.el = args.el;
    this.argument = args.argument;

    this.parentOptions = args.parentOptions || {};
    this.parentOptions.context = this.parentOptions.context || this;

    this._fn = DefineEvent.prototype;
    $.extend(this._fn, klass);

    if (args.define) {
      this._fn.define = args.define;
      this.init();
    }
  }
  DefineEvent.prototype = {

    init: function() {      
      handler.subscribe(this.parent, this.define, this.parentOptions);
      
      for (var i = 0, l = this.name.length; i < l; i++) {
        var path = this.parent + handler.splitter + this.name[i];
        handler.define(path, this.define, { context: this, argument: this.argument });
      }
    },

    define: function() {
      /** user definition **/
    },

    publish: function(ev) {
      var path = this.parent + handler.splitter + handler.castEventStr(ev);
      handler.publish(path, this.argument);
    },

    deleteEvent: function() {
      handler.unsubscribe(this.parent, this.define);
      for (var i = 0, l = this.name.length; i < l; i++) {
        var path = this.parent + handler.splitter + this.name[i];
        handler.undefine(path);
      }
    }

  }


  // use this instance as access to Handler/DefineElement/DefineEvent
  var Interface = function() {
    this.fn = Interface.prototype;
    $.extend(this.fn, klass);
  }
  Interface.prototype = {

    defineElement: function(args) {
      return new DefineElement(args);
    },

    defineEvent: function(args) {
      return new DefineEvent(args);
    },

    define: function(ev, fn) {
      handler.define(ev, fn);
      return this;
    },

    publish: function(ev, args) {
      handler.publish(ev, args);
      return this;
    },

    subscribe: function(ev, fn, options) {
      handler.subscribe(ev, fn, options);
      return this;
    },

    unsubscribe: function(ev, fn) {
      handler.unsubscribe(ev, fn);
      return this;
    },

    isReadied: function() {
      return handler.isReadied;
    },

    isLoaded: function() {
      return handler.isLoaded;
    },

    onready: function(fn, options) {
      this.subscribe('ready', fn, options);
      return this;
    },

    onload: function(fn, options) {
      this.subscribe('load', fn, options);
      return this;
    },

    onresize: function(fn, options) {
      this.subscribe('resize', fn, options);
      return this;
    },

    onscroll: function(fn, options) {
      this.subscribe('scroll', fn, options);
      return this;
    }

  }

  handler.init();


  // $.atmedia return this object
  var _export = new Interface();

  // _export.helper
  var Helper = function() {
    this.fn = Helper.prototype;
    $.extend(this.fn, klass); 
  }
  _export.helper = new Helper();

  // _export.util
  var Util = function() {
    this.fn = Util.prototype;
    $.extend(this.fn, klass); 
  }
  _export.util = new Util();

  // export this function to $
  var atmedia = function(args) {
    args = args || {};

    var deviceStyle = args.deviceStyle;

    if (!deviceStyle) return _export;

    _export.subscribe('ready', function(){

      // define device
      var device = _export.defineElement(deviceStyle);

      _export.device = device.getStatus();
      _export.subscribe('resize', function() {
        _export.device = device.getStatus();
      });

      // define change event
      _export.defineEvent({
        name: 'change',
        parent: 'ready',
        argument: [_export.device],
        define: function() {
          this.publish('change');
        }
      });
      _export.defineEvent({
        name: 'change',
        parent: 'resize',
        el: device,
        argument: [_export.device],        
        define: function() {
          var current = _export.device;
          if (this.status && this.status != current) {
            this.publish('change');
          }
          this.status = _export.device;
        },
        status: false
      });

      // define change child event
      var defineChangeChild = function() {
        var l = this.el.statusList.length;
        for (var i = 0; i < l; i++) {
          if (_export.device == this.el.statusList[i][0]) {
            for (var j = 0; j < l; j++) {
              if (j == i) continue;
              // ex. callbacks.offMedium, callbacks.offSmall
              this.publish('off' + this.el.statusList[j][1]);
            }
            // ex. callbacks.onLarge
            this.publish('on' + this.el.statusList[i][1]);
            break;
          }
        }
      }
      _export.defineEvent({
        name: 'onLarge offLarge onMedium offMedium onSmall offSmall',
        parent: 'ready/change',
        el: device,
        define: defineChangeChild
      });
      _export.defineEvent({
        name: 'onLarge offLarge onMedium offMedium onSmall offSmall',
        parent: 'resize/change',
        el: device,
        define: defineChangeChild
      });

      // define change child resize event
      _export.defineEvent({
        name: 'change/onLargeResize change/onMediumResize change/onSmallResize',
        parent: 'resize',
        el: device,
        status: _export.device,
        define: function() {
          var current = _export.device;
          if (this.status == current) {
            for (var i = 0, l = this.el.statusList.length; i < l; i++) {
              if (this.el.getStatus() == this.el.statusList[i][0]) {
                // ex. callbacks.onLargeResize
                this.publish('change/on' + this.el.statusList[i][1] + 'Resize');
                break;
              }
            }
          }
          this.status = _export.device;
        }
      });

    });

    // define _export.onchange
    _export.include({
      onchange: function(fns, options) {
        if (typeof fns == 'function') {
          _export.subscribe('ready/change', fns, options);
          _export.subscribe('resize/change', fns, options);
          return this;
        }
        if (typeof fns == 'object') {
          for (var ev in fns) {
            _export.subscribe('ready/change/' + ev, fns[ev], options);
            _export.subscribe('resize/change/' + ev, fns[ev], options);
          }
          return this;
        }
      }
    });

    return _export;
  }

  // interface _export
  atmedia._export = _export;

  // connect atmedia to $
  //$.extend($, { atmedia: atmedia });

  //for lib
  window._l = window._l || {};
  _l.status = _l.status || {};

  _l.status.atmedia = atmedia;

})(window, document, jQuery);