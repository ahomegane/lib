/* version: 1.0.0 */
/* require: jquery, _l.env, lib.ui.css3-jquery */
;(function(window, document, $, undefined) {

  window._l = window._l || {};

  var supportTransition = _l.support.transition;

  ;(function(window, document, $, undefined) {

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

              var prop, i = 0;
              for (var key in css) {
                if (++i > 1) break;
                prop = key;
              }

              var complete = function() {
                if (callback) callback();
                _this.dequeue();
              }

              _this.addTransition({
                css: css,
                time: time,
                ease: ease
              })
              .oneTransitionEnd(prop, complete);
            }
            return _this.queue('fx', doAnimation);

          } else {
            return _this.animate(css, time, $.camelCase(ease), callback);
          }

        }   
        return render();
      }
    }

    $.extend($.fn, extend);

  })(window, document, jQuery);

})(window, document, jQuery);