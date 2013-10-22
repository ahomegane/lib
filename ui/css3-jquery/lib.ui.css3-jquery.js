/* version: 1.0.1 */
/* require: jquery, lib.env.js */
;(function(window, document, $, undefined) {

  window._l = window._l || {};

  var prefix = _l.prefix,
      prefixShort = prefix.replace(/\-/g, '');
  
  var fixProp = {

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
  
    var util = {

      addPrefix: function(prop) {
        var target = [
          'transform',
          'perspective'
        ];
        for (var i = 0, l = target.length; i < l; i++) {
          if (prop == target[i]) return prefix + prop;
        }
        return prop;
      },

      makeReg: function(target) {
        return new RegExp('\\b' +  target + ' .+?(, |$)\\b', 'g')
      }

    }

    $.extend($, {
      isTransitionEndTarget: function(e, prop) {
        var name = e.originalEvent.propertyName;        
        if (name == prop || name == prefix + prop) return true;
        return false;
      }
    });

    var Transition = {

      addTransition: function(options) {
        options = options || {};                
        var target = options.target,
            css = options.css,
            time = options.time ? ' ' + (options.time / 1000) + 's' : ' ' + (400 / 1000) + 's',
            ease = options.ease ? ' ' + options.ease : ' ' + 'linear',//ease: linear/ease/ease-in/ease-out/ease-in-out/cubic-bezier(num, num, num, num)
            delay = options.delay ? ' ' + (options.delay / 1000) + 's' : '',
            transitionEnd = options.transitionEnd;

        var value = this.css('transition');
        value = value.replace(util.makeReg('all 0s'), '');

        if (target) {
          if (typeof target == 'string') target = [target];
          for (var i = 0, l = target.length; i < l; i++) {
            if (value != '') value += ', ';
            value = value.replace(util.makeReg(target[i]), '');
            value += util.addPrefix(target[i]) + time + ease + delay;
          }
        } else {
          for (var target in css) {
            if (value != '') value += ', ';
            value = value.replace(util.makeReg(target), '');
            value += util.addPrefix(target) + time + ease + delay;
          }
        }

        this.css('transition', value);

        setTimeout($.proxy(function() {
          if (transitionEnd) this.on(fixProp.transitionEnd, transitionEnd);
          if (css) this.css(css);
        }, this), 0);

        return this;
      },

      removeTransition: function(options) {
        options = options || {};
        var target = options.target;
            css = options.css;

        if (target || css) {
          var value = this.css('transition');
          value = value.replace(util.makeReg('all 0s'), '');

          if (target) {
            if (typeof target == 'string') target = [target];
            for (var i = 0, l = target.length; i < l; i++) {
              value = value.replace(util.makeReg(target[i]), '');
            }
          } else {
            for (var target in css) {
              value = value.replace(util.makeReg(target), '');
            }
          }
          this.css('transition', value);

        } else {
          this.css('transition', '');
        }
        return this;
      },

      onTransitionEnd: function(callback) {
        this.on(fixProp.transitionEnd, callback);
        return this;
      },

      offTransitionEnd: function(callback) {
        this.off(fixProp.transitionEnd, callback);
        return this;
      },

      oneTransitionEnd: function(prop, callback) {
        var one = function(e) {
          if (! $.isTransitionEndTarget(e, prop)) return;
          callback(e);
          $(this).offTransitionEnd(one);
        };
        this.onTransitionEnd(one);
      }

    };

    $.extend($.fn, Transition);

  })(window, document, jQuery);
})(window, document, jQuery);