/* version: 1.0.1 */
/* require: jquery, lib.env.js */
;(function(window, document, $, undefined) {

  window._l = window._l || {};

  var prefix = _l.prefix,
      prefixShort = prefix.replace(/\-/g, '');

  var supportTransition = _l.support.transition;

  /* extend jquery : transfrom helper */
  ;(function() {

    var extend = {

      getTransform: function() {
        var matrix = this.css('transform').replace(/matrix\((.*)\)/, '$1').split(',');
        return {
          translateX: +matrix[4],
          translateY: +matrix[5]
        }
      }

    }

    $.extend($.fn, extend);

  })();

  /* extend jquery : transition helper */
  ;(function() {

    var fixProp = {
      transitionEnd: (function() {
        if (prefixShort == 'moz') return 'transitionend';
        return prefixShort + 'TransitionEnd';
      })()
    };

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
      },

      toHyphen: function(camelCase) {
        return camelCase.replace(/([a-z]|\d)([A-Z])/g, '$1-$2').toLowerCase();
      }

    }

    $.extend($, {
      isTransitionEndTarget: function(e, prop) {
        var name = e.originalEvent.propertyName;      
        if (name == prop || name == prefix + prop) return true;
        return false;
      }
    });

    var extend = {

      addTransition: function(options) {
        if (! supportTransition) return this;
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
        
        this.css('transition', util.toHyphen(value));

        setTimeout($.proxy(function() {
          if (transitionEnd) this.on(fixProp.transitionEnd, transitionEnd);
          if (css) this.css(css);
        }, this), 10);

        return this;
      },

      removeTransition: function(options) {
        if (! supportTransition) return this;
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
          this.css('transition', util.toHyphen(value));

        } else {
          this.css('transition', '');
        }
        return this;
      },

      onTransitionEnd: function(callback) {
        if (! supportTransition) return this;        
        this.on(fixProp.transitionEnd, callback);
        return this;
      },

      offTransitionEnd: function(callback) {
        if (! supportTransition) return this;        
        this.off(fixProp.transitionEnd, callback);
        return this;
      },

      oneTransitionEnd: function(css, callback) {
        if (! supportTransition) return this;
        var one = function(e) {
          if (! $.isTransitionEndTarget(e, util.toHyphen(prop))) return;
          callback(e);
          $(this).offTransitionEnd(one);
        };

        //cssの値に変化がない場合、transitionEndでコールバックが実行されないため、即実行
        var prop, i = 0, isChangeCssValue = false;
        for (var key in css) {
          if (++i == 1) prop = key;
          var reg = new RegExp('^' + css[key] + '(?:$|px$|%$)');
          if (! reg.test(this.css(util.toHyphen(key)))) {
            isChangeCssValue = true;
            break;
          }
        }
        if (! isChangeCssValue) {          
          callback();
        } else {
          this.onTransitionEnd(one);
        }
        return this;        
      }

    };

    $.extend($.fn, extend);

  })();

})(window, document, jQuery);