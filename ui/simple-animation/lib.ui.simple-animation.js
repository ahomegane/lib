/* version: 1.0.0 */
/* require: jquery, _l.env, lib.ui.css3-jquery */
;(function(window, document, $, undefined) {

  window._l = window._l || {};

  var _export;
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

    var util = {

      toCamel: function(hyphen) {
        if (! hyphen) return hyphen;
        var camel = hyphen.replace(/\-./g, function (matched) {
            return matched.charAt(1).toUpperCase();
        });
        return camel;
      }

    }

    var SimpleAnimation = function(el, options) {
      this.el = el;

      this.options = {
        x: 0,
        y: 0,
        z: 0,
        w: this.el.width(),
        h: this.el.height(),
        o: +this.el.css('opacity'),
        duration: 400,
        ease: 'ease',// linear/ease/ease-in/ease-out/ease-in-out
        origin: 'left-top',
        position: 'static'
      }
      options = options || {};
      $.extend(true, this.options, options);

      this.origin = this.options.origin.replace(/( |　)/g, '').split('-');
      var parsed = this.parse(this.options);
      this.default = parsed.point;

      this.supportTransition = supportTransition;
      this.fn = SimpleAnimation.prototype;
    }
    SimpleAnimation.prototype = {

      init: function() {
        this.point = $.extend({}, this.default);
        this.timer = {
          resize: null
        };
        this.el.css({
          position: this.options.position
        });
        this.css(this.point);
        return this;
      },

      parse: function(point) {
        var _this = this;
        var clone = {}, css = {}, param = {};

        var addClone = function(a) {
          clone[a] = point[a];
        }
        var addCss = function(a, b) {
          if (/%/.test(point[a])) {
            var per = +point[a].replace(/%/, '') / 100,
                baseValue = +_this.el.css(b).replace(/px/, '');
            
            if (/^(w|h)$/.test(a)) {
              var getParentValue = function(el) {
                var parent = el.parent();
                if (a == 'w') return parent.width();
                if (a == 'h') return parent.height();
              };
              baseValue = getParentValue(_this.el);
            }
            if (/^(x|y)$/.test(a)) {
              var getParentValue = function(el) {
                var parent = el.parent(),
                    parentTarget = parent.css('position');
                if (/^static$/.test(parentTarget)) {
                  getParentValue(parent);
                } else {
                  if (a == 'x') return parent.width();
                  if (a == 'y') return parent.height();
                }
              };
              baseValue = getParentValue(_this.el);
            }
            point[a] = baseValue * per;
          }
          css[b] = +point[a];
          addClone(a);
        }
        var addParam = function(a, b) {
          param[b] = +point[a];
          addClone(a);
        }

        // x, y, z, w, h, o -> css
        if (point.x != null || point.y != null) {
          $.each(this.origin, function(i, origin) {
            if (point.x != null && (origin == 'left' || origin == 'right')) {
              addCss('x', origin);
            } else if (point.y != null && (origin == 'top' || origin == 'bottom')) {
              addCss('y', origin);
            }
          });
        }
        if (point.z != null) addCss('z', 'z-index');
        if (point.w != null) addCss('w', 'width');
        if (point.h != null) addCss('h', 'height');
        if (point.o != null) addCss('o', 'opacity');

        // duration, ease -> param
        if (point.duration != null) addParam('duration', 'duration');
        if (point.ease != null) addParam('ease', 'ease');

        return { css: css, param: param, point: clone };
      },

      deferred: function() {
        var d = new $.Deferred;
        d.resolve();
        return d;
      },

      wait: function(time, callback) {
        var d = new $.Deferred;
        setTimeout(function() {
          if (typeof callback == 'function') {
            callback(d);
          } else {
            d.resolve();
          }
        }, time);
        return d;
      },

      css: function(point) {
        var _this = this;
        if (! point) return this.deferred();

        var parsed = this.parse(point),
            css = parsed.css;
        this
          .update(point)
          .render(css)
          .el.trigger('saCss', this);        
        return this.deferred();
      },

      animate: function(point, callbackComplete, callbackBefore) {
        var _this = this;
        if (! point) return this.deferred();

        if (typeof callbackBefore == 'function') callbackBefore();
        this.el.trigger('saAnimateBefore');

        var parsed = this.parse(point),
            css = parsed.css,
            param = parsed.param;
        var duration = param.duration || this.options.duration,
            ease = param.ease || this.options.ease;
        
        if (! this.isFirstAnimation) {//for firefox
          setTimeout(function() {
            _this
              .update(point)
              .render(css, duration, ease);
          }, 0);
          this.isFirstAnimation = true;
        } else {
          this
            .update(point)
            .render(css, duration, ease);
        }

        return _this.wait(duration, function(d) {
          _this            
            .el.trigger('saAnimate', this);
          if (typeof callbackComplete == 'function') {
            callbackComplete(d);
          } else {
            d.resolve();
          }
        });
      },

      resize: function(change, target) {
        var _this = this;

        target = target || ['x', 'y', 'w', 'h'];
        var point = {};
        $.each(target, function(i, t) {
          if (/^(x|w)$/.test(t)) point[t] = _this.point[t] + change.x;
          if (/^(y|h)$/.test(t)) point[t] = _this.point[t] + change.y;
        });
        this.css(point);
      },

      responsive: function(target, stage) {
        var _this = this;

        stage = stage || $(window);
        target = target || ['w'];
        var size = {
          w: stage.width(),
          h: stage.height(),
          before: {
            w: stage.width(),
            h: stage.height()
          }
        };

        this.timer.resize = setTimeout(function() {
          clearTimeout(_this.timer.resize);
          $(window).on('resize orientationchange', function() {
            size.before.w = size.w;
            size.before.h = size.h;
            size.w = stage.width();
            size.h = stage.height();
            _this.resize({
              x: size.w - size.before.w,
              y: size.h - size.before.h
            }, target);
          });
        }, 50);
        return this;
      },

      render: function (css, duration, ease){
        if (duration && ease) {//animate
          if (this.supportTransition) {
            this.el.addTransition({
              css: css,
              time: duration,
              ease: ease
            });
          } else {
            this.el
              .stop(true, true)
              .animate(css, duration, util.toCamel(ease));
          }

        } else {//css
          if (this.supportTransition) {
            this.el.addTransition({
              css: css
            });
          } else {
            this.el
              .css(css);
          }
        }
        return this; 
      },

      update: function(point) {
        $.extend(this.point, point);
        return this;
      },

      remove: function() {
        this.el.remove();
      }

    }

    _export = function(el, options) {
      return new SimpleAnimation(el, options);
    }
    _export.extend = function(obj) {
      $.extend(SimpleAnimation, {});
    }
    _export.include = function(obj) {
      $.extend(SimpleAnimation.prototype, obj);
    }
    _export.klass = SimpleAnimation;

  })(window, document, jQuery);

  // export
  _l.ui = _l.ui || {};
  _l.ui.simpleAnimation = _export;

})(window, document, jQuery);