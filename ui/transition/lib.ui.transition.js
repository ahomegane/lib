/* version: 1.0.0 */
/* require: jquery, _l.env, lib.ui.css3-jquery */
;(function(window, document, $, undefined) {

  window._l = window._l || {};

  /* extend jquery : transition */
  var supportTransition = _l.support.transition;

  ;(function() {

    // jquery easing extend
    jQuery.extend( jQuery.easing, {
      ease: function (x, t, b, c, d) {
        if ((t/=d/2) < 1) return c/2*t*t + b;
        return -c/2 * ((--t)*(t-2) - 1) + b;
      },
      easeIn: function (x, t, b, c, d) {
        return c*(t/=d)*t + b;
      },
      easeOut: function (x, t, b, c, d) {
        return -c *(t/=d)*(t-2) + b;
      },
      easeInOut: function (x, t, b, c, d) {
        if ((t/=d/2) < 1) return c/2*t*t + b;
        return -c/2 * ((--t)*(t-2) - 1) + b;
      }
    });

    var util = {

      toCamel: function(hyphen) {
        if (! hyphen) return hyphen;
        var camel = hyphen.replace(/\-./g, function (matched) {
            return matched.charAt(1).toUpperCase();
        });
        return camel;
      }

    }

    var extend = {

      transition: function() {
        var _this = this;

        var css = arguments[0];
        if (! css) return this.dequeue();

        var search = function(args, type) {
          for (var i in args) {
            if (i == 0) continue;
            if (typeof args[i] == type) return args[i];
          }
          return false;
        }
        var time = search(arguments, 'number') || 400,
            ease = search(arguments, 'string') || 'linear',
            callback = search(arguments, 'function');

        var render = function() {

          if (supportTransition) {
            var doAnimation = function() {              
              var complete = function() {
                if (callback) callback();
                _this.dequeue();
              }
              _this
              .removeTransition({
                css: css
              })
              .addTransition({
                css: css,
                time: time,
                ease: ease
              })
              .oneTransitionEnd(css, complete);
            }
            return _this.queue('fx', doAnimation);

          } else {
            return _this.animate(css, time, util.toCamel(ease), callback);
          }

        }   
        return render();
      }
    }

    $.extend($.fn, extend);

  })();

})(window, document, jQuery);