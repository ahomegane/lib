/* version: 1.0.0 */
/* require: jquery, lib.env.js */
;(function(window, document, $, undefined) {

  window._l = window._l || {};

  var prefix = _l.prefix,
      prefixShort = prefix.replace(/\-/g, ''),
      propertyNames = {
        transitionEnd: (function() {
          if (prefixShort == 'moz') return 'transitionend';
          return prefixShort + 'TransitionEnd';
        })()
      };

  /* transfrom */
  ;(function(window, document, $, undefined) {

    var Transform = {
      
      getTransform: function() {
        var matrix = this.css('transform').replace(/matrix\((.*)\)/, '$1').split(',');
        return {
          translateX: +matrix[4],
          translateY: +matrix[5]
        }
      }

    }

    $.extend($.fn, Transform);

  })(window, document, jQuery);

  /* transition */
  ;(function(window, document, $, undefined) {
  
    var Util = function() {
    }
    Util.prototype = {

      addPrefix: function(property) {
        var p = [
          'transform',
          'perspective'
        ];
        for (var i = 0, l = p.length; i < l; i++) {
          if (property == p[i]) return prefix + property;
        }
        return property;
      }

    }
    var util = new Util();

    $.extend($, {
      isTransitionEndTargetProperty: function(e, property) {
        var propertyName = e.originalEvent.propertyName;        
        if (propertyName == property || propertyName == prefix + property) return true;
        return false;
      }
    });

    var Transition = {

      addTransition: function(options) {
        var options = options || {};
        
        //ease: linear/ease/ease-in/ease-out/ease-in-out/cubic-bezier(num, num, num, num)
        var target = options.target || 'all',
            time = options.time || 400,
            ease = options.ease || 'linear',
            delay = options.delay || 0,
            css = options.css,
            transitionEnd = options.transitionEnd;

        var str = '';

        if (typeof target == 'string') target = [target];

        for (var i = 0, l = target.length; i < l; i++) {
          if (i != 0) str += ',';
          str += util.addPrefix(target[i]) + ' ' + time + 'ms ' + ease + ' ' + delay + 'ms';
        }

        this.css('transition', str);
        setTimeout($.proxy(function() {
          if (transitionEnd) this.on(propertyNames.transitionEnd, transitionEnd);
          if (css) this.css(css);
        }, this), 0);

        return this;
      },

      removeTransition: function($el) {
        this.css('transition', '');
        return this;
      },

      onTransitionEnd: function(callback) {
        this.on(propertyNames.transitionEnd, callback);
        return this;
      },

      offTransitionEnd: function(callback) {
        this.off(propertyNames.transitionEnd, callback);
        return this;
      },

      oneTransitionEnd: function(property, callback) {
        var one = function(e) {
          if (! $.isTransitionEndTargetProperty(e, property)) return;
          callback(e);
          $(this).offTransitionEnd(one);
        };
        this.onTransitionEnd(one);
      }

    };

    $.extend($.fn, Transition);

  })(window, document, jQuery);
})(window, document, jQuery);