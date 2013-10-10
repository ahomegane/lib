/* version: 1.0.0 */
/* require: jquery */
;(function(window, document, $, undefined) {

	window._l = window._l || {};
	_l.cpt = _l.cpt || {};

  var _tile;

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

      supportTransition: function() {
        var prop = [
          'webkitTransitionProperty',
          'MozTransitionProperty',
          'mozTransitionProperty',
          'msTransitionProperty',
          'oTransitionProperty',
          'transitionProperty'
        ];
        var div = document.createElement('div');
        for (var i = 0, l = prop.length; i < l; i++) {
          if(div.style[prop[i]] !== undefined){
            return true;
          }
        }
        return false;
      },

      toCamel: function(hyphen) {
        if (! hyphen) return hyphen;
        var camel = hyphen.replace(/\-./g, function (matched) {
            return matched.charAt(1).toUpperCase();
        });
        return camel;
      }

    }

    var env = {
      supportTransition: util.supportTransition()
    }

    var Frame = function(frame, options) {
      options = options || {};

      this.options = {
        elements: frame.find('> li'),
        margin: {
          right: 10,
          bottom: 10
        },
        offset: {
          top: 0,
          left: 0
        },
        animation: true,
        initAnimation: false,
        ease: 'ease',// linear/ease/ease-in/ease-out/ease-in-out
        duration: 200,
        delay: 0,
        intervalInit: 0,
        resize: true,
        intervalResize: 0,
        initCallback: null
      }
      $.extend(true, this.options, options);

      if (this.options.animation && ! env.supportTransition) {
        this.options.ease = util.toCamel(this.options.ease);
      }

      this.frame = frame;
      this.width = this.frame.width();
      this.css = {};
      this.elements = this.options.elements;
      this.tiles = [];
      this.grid = new Grid(this.options);
      this.timer = {
        resize: null
      };

      this.init();
    }
    Frame.prototype = {

      init: function() {
        var _this = this;

        $.extend(true, this.css, {
          display: 'block',
          position: 'relative'
        });

        var height = 0;
        this.elements.each(function(i) {
          _this.tiles[i] = new Tile($(this), _this.options);
          if ($(this).hasClass('tile-left')) {
            _this.tiles[i].isFixedLeft = true;
          } else if ($(this).hasClass('tile-right')) {
            _this.tiles[i].isFixedRight = true;
          }
        });
        this.elements.each(function(i) {
          if ($(this).hasClass('left')) {

          } else {
            _this.tiles[i] = new Tile($(this), _this.options);
            _this.layout(_this.tiles[i]);
          }
          if (height < _this.tiles[i].point.rb.y) height = _this.tiles[i].point.rb.y;
        });
        $.extend(true, this.css, {
          height: height
        });

        this.render(this.options.intervalInit, function() {
          _this.options.initAnimation = true;
          if (typeof _this.options.initCallback == 'function') _this.options.initCallback();
        });

        if (this.options.resize) {
          $(window).on('resize orientationchange', function(e) {
            clearTimeout(_this.timer.resize);
            _this.timer.resize = setTimeout(function() {
              _this.width = _this.frame.width();
              _this.refresh(_this.options.intervalResize);
            }, 30);
          });       
        }
      },

      refresh: function(interval) {
        var _this = this;

        $.each(this.tiles, function(i) {
          _this.tiles[i].isSet = false;       
        });

        var height = 0;
        $.each(this.tiles, function(i) {
          _this.layout(_this.tiles[i]);
          if (height < _this.tiles[i].point.rb.y) height = _this.tiles[i].point.rb.y;    
        });
        $.extend(true, this.css, {
          height: height
        });

        this.render(interval);
      },

      layout: function(tile) {
        var options = this.options;

        this.grid.sort();

        for (var j = 0, k = this.grid.y.length; j < k; j ++) {
          if (tile.isSet) break;

          for (var i = 0, l = this.grid.x.length; i < l; i ++) {
            var gridX = this.grid.x[i],
                gridY = this.grid.y[j];

            if (! this.isCd(gridX, gridY, tile) && ! this.isOver(gridX, gridY, tile)) {
              tile.update({
                x: gridX,
                y: gridY
              })
              .isSet = true;

              this.grid
                .addX(tile.point.rt.x + options.margin.right, this.width - this.options.offset.left)
                .addY(tile.point.lb.y + options.margin.bottom);

              break;
            }
          }
        }
      },

      isCd: function(x, y, tile) {//interfere with other tile

        for (var i = 0, l = this.tiles.length; i < l; i ++) {
          var check = this.tiles[i],
              point = check.point;
          if (! check.isSet) continue;
          if (
            point.lt.x <= x + tile.width &&
            x <= point.rb.x &&
            point.lt.y <= y + tile.height &&
            y <= point.rb.y
          ) {
            return true;
          }
        }
        return false;
      },

      isOver: function(x, y, tile) {//over frame width
        if (x <= this.options.offset.left && this.width < x + tile.width) return false;
        if (this.width < x + tile.width || x < 0) return true;
        return false;
      },

      render: function(interval, callback) {        
        var _this = this;

        interval = interval || 0;

        this.frame.css(this.css);

        var i = 0;
        (function loop() {
          _this.tiles[i].render(); 
          i++; 
          if (i < _this.tiles.length) {
            setTimeout(loop, interval);
          } else {
            if (typeof callback == 'function') callback();
          }
        })();
      }
    }

    var Tile = function(element, options) {
      this.element = element;
      this.options = options;

      this.point = {
        lt: {x: 0, y: 0},
        rt: {x: 0, y: 0},
        lb: {x: 0, y: 0},
        rb: {x: 0, y: 0}
      };
      this.width = element.outerWidth();
      this.height = element.outerHeight();
      this.isSet = false;
      this.isSetTransition = false;
      
      this.css = {
        position: 'absolute'
      };
    }
    Tile.prototype = {

      resize: function() {
        this.width = element.outerWidth();
        this.height = element.outerHeight();
        return this;
      },

      update: function(lt) {
        var options = this.options;
        this.point = {
          lt: {
            x: lt.x,
            y: lt.y
          },
          rt: {
            x: lt.x + this.width,
            y: lt.y
          },
          lb: {
            x: lt.x,
            y: lt.y + this.height
          },
          rb: {
            x: lt.x + this.width,
            y: lt.y + this.height
          }
        };
        return this;
      },

      render: function (){
        var _this = this;

        if (this.options.animation && this.options.initAnimation && env.supportTransition) {
          this.setTransition();
        }

        var update = {
          left: this.point.lt.x,
          top: this.point.lt.y
        };
        $.extend(true, this.css, update);

        if (this.options.animation && this.options.initAnimation && ! env.supportTransition) {
          this.element
            .delay(this.options.delay)
            .stop(true)
            .animate(update, this.options.duration, this.options.ease);
        } else {
          this.element.css(this.css);
        }        
        return this;
      },

      setTransition: function() {
        if (this.isSetTransition) return;

        var ease = this.options.ease,
            duration = this.options.duration,
            delay = this.options.delay;

        var value = 'top ' + duration + 'ms ' + ease + ' ' + delay + 'ms' + ', ';
        value += 'left ' + duration + 'ms ' + ease + ' ' + delay + 'ms';
        this.element.css({
          transition: value
        });

        this.isSetTransition = true;
      }

    }

    var Grid = function(options) {
      this.options = options;
      this.x = [options.offset.left];
      this.y = [options.offset.top];
    }
    Grid.prototype = {

      addX: function(x, max) {
        if (this.filterX(x, max)) this.x.push(x);
        return this;
      },

      addY: function(y) {
        if (this.filterY(y)) this.y.push(y);
        return this;
      },

      filterX: function(x, max) {
        var _this = this;
        if (x > max || x < 0) return false;
        for (var i = 0, l = this.x.length; i < l; i ++) {        
          if (_this.x[i] == x) return false;
        }
        return true;
      },

      filterY: function(y, max) {
        var _this = this;
        if (y > max || y < 0) return false;
        for (var i = 0, l = this.y.length; i < l; i ++) {
          if (_this.y[i] == y) return false;
        }
        return true;
      },

      sort: function() {
        this.x.sort(function(a,b){return a - b;});
        this.y.sort(function(a,b){return a - b;});
        return this;
      }

    }

    _tile = function(frame, options) {
      return new Frame(frame, options);
    }

  })(window, document, jQuery);

  // export
  window._l.cpt.tile = _tile;

})(window, document, jQuery);