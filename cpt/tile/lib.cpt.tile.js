/* version: 1.0.0 */
/* require: jquery */
;(function(window, document, $, undefined) {

  window._l = window._l || {};
  _l.cpt = _l.cpt || {};

  var _export;

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
      var _this = this;
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
        initAnimation: true,
        ease: 'ease',// linear/ease/ease-in/ease-out/ease-in-out
        duration: 200,
        delay: 0,
        intervalInit: 0,
        resize: true,
        intervalResize: 0,
        initCallback: null,
        origin: 'left-top'
      }
      this.options.resizeStop = function(frameWidth) {
        if (frameWidth < _this.options.offset.left) return true;
        return false;
      };
      $.extend(true, this.options, options);

      if (this.options.animation && ! env.supportTransition) {
        this.options.ease = util.toCamel(this.options.ease);
      }

      this.frame = frame;
      this.width = this.frame.width();
      this.children = this.options.elements;
      this.tiles = [];
      this.gridX = new Grid([this.options.offset.left]);
      this.gridY = new Grid([this.options.offset.top]);
      this.timer = {
        resize: null
      };

      this.frame.css({
        display: 'block',
        position: 'relative'
      });
      this.css = {};
    }
    Frame.prototype = {

      init: function() {
        var _this = this,
            options = this.options;

        var tiles = [], tilesLeft = [], tilesRight = [];
        this.children.each(function(i) {
          var tile = new Tile($(this), _this.options);
          if ($(this).hasClass('tile-left')) {
            tile.isFixedLeft = true;
            tilesLeft.push(tile);
          } else if ($(this).hasClass('tile-right')) {
            tile.isFixedRight = true;
            tilesRight.push(tile);
          } else {
            tiles.push(tile);
          }
        });
        this.tiles = ((tilesLeft.concat(tilesRight)).concat(tiles));

        this.layout();

        this.render(options.intervalInit, function() {
          options.initAnimation = true;
          if (typeof options.initCallback == 'function') options.initCallback();
        });

        if (options.resize) {
          $(window).on('resize orientationchange', function(e) {
            clearTimeout(_this.timer.resize);
            _this.timer.resize = setTimeout(function() {
              var width = _this.width = _this.frame.width();
              if (options.resizeStop(width)) return;
              _this.refresh(options.intervalResize);
            }, 0);
          });
        }
      },

      refresh: function(interval) {
        var _this = this;

        this.gridX.clear();
        this.gridY.clear();        
        $.each(this.tiles, function(i, tile) {
          tile.isSet = false;       
        });

        this.css = {};
        this.layout();        

        this.render(interval);
      },

      layout: function() {
        var _this = this;

        var height = 0;
        $.each(this.tiles, function(i, tile) {
          _this.put(tile);
          if (height < tile.point.rb.y) height = tile.point.rb.y;  
        });
        $.extend(true, this.css, {
          height: height
        });
      },

      put: function(tile) {
        var options = this.options;

        this.gridX.sort();
        this.gridY.sort();
        if (tile.isFixedRight) {
          this.gridX
            .add(this.width - tile.width, options.offset.left)
            .reverse();
        }

        if (tile.isFixedLeft || tile.isFixedRight) {
          var l1 = this.gridX.length(),
              l2 = this.gridY.length();
        } else {
          var l1 = this.gridY.length(),
              l2 = this.gridX.length();
        }

        for (var i = 0; i < l1; i++) {
          if (tile.isSet) break;

          for (var j = 0; j < l2; j++) {
            if (tile.isFixedLeft || tile.isFixedRight) {
              var pointX = this.gridX.get(i),
                  pointY = this.gridY.get(j);
            } else {
              var pointX = this.gridX.get(j),
                  pointY = this.gridY.get(i);
            }

            if (! this.isCd(pointX, pointY, tile) && (! this.isOver(pointX, pointY, tile) || this.isMin(pointX, pointY, tile) )) {              
              tile.update({
                x: pointX,
                y: pointY
              }).isSet = true;

              this.gridX.add(tile.point.rt.x + options.margin.right, options.offset.left, this.width)
              this.gridY.add(tile.point.lb.y + options.margin.bottom, options.offset.top);
              break;
            }
          }
        }
      },

      isCd: function(x, y, tile) {//interfere with other tile
        var options = this.options,
            o1 = {
              lt: {
                x: x,
                y: y
              },
              rb: {
                x: x + tile.width + (tile.isFixedRight ? 0 : options.margin.right),
                y: y + tile.height + options.margin.bottom
              }
            };

        for (var i = 0, l = this.tiles.length; i < l; i ++) {
          var target = this.tiles[i];
          if (! target.isSet) continue;

          var o2 = {
                lt: {
                  x: target.point.lt.x,
                  y: target.point.lt.y
                },
                rb: {
                  x: target.point.rb.x + (target.isFixedRight ? 0 : (options.margin.right - 1) ),
                  y: target.point.rb.y + options.margin.bottom - 1
                }
              };    

          if (o2.lt.x <= o1.rb.x &&
              o1.lt.x <= o2.rb.x &&
              o2.lt.y <= o1.rb.y &&
              o1.lt.y <= o2.rb.y ) return true;
        }
        return false;
      },

      isOver: function(x, y, tile) {//over frame width
        if (this.width < x + tile.width || x < this.options.offset.left) return true;
        return false;
      },

      isMin: function(x, y, tile) {
        if (x == this.options.offset.left && this.width < x + tile.width) return true;
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
      this.isFixedLeft = false;
      this.isFixedRight = false;  

      this.isSetTransition = false;

      this.element.css({
        position: 'absolute',
        left: 'auto',
        right: 'auto'
      });
      this.css = {};      
    }
    Tile.prototype = {

      resize: function() {
        this.width = element.outerWidth();
        this.height = element.outerHeight();
        return this;
      },

      update: function(lt) {
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

        if (this.options.origin == 'right-top') {
          var update = {
            right: this.point.lt.x,
            top: this.point.lt.y
          };
        } else {
          var update = {
            left: this.point.lt.x,
            top: this.point.lt.y
          };
        }
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
            delay = this.options.delay,
            origins = this.options.origin.split('-');

        var value = '';
        $.each(origins, function(i, origin) {
          if (i > 0) {
            value += ', ';
          }
          value += origin + ' ' + duration + 'ms ' + ease + ' ' + delay + 'ms';
        });
        this.element.css({
          transition: value
        });

        this.isSetTransition = true;
      }

    }

    var Grid = function(initial) {
      this.initial = initial || [];
      this.point = $.extend([], this.initial);
    }
    Grid.prototype = {

      length: function() {
        return this.point.length;
      },

      get: function(i) {
        return this.point[i];
      },

      set: function(i, point) {
        this.point[i] = point;
        return this;
      },      

      add: function(point, min, max) {
        if (this.inspect(point, min, max)) this.point.push(point);
        return this;
      },

      inspect: function(point, min, max) {
        var _this = this;
        if (point < min || point > max) return false;
        for (var i = 0, l = this.point.length; i < l; i ++) {        
          if (_this.point[i] == point) return false;
        }
        return true;
      },      

      remove: function(i) {
        this.point.splice(i, 1);
        return this;
      },

      clear: function() {
        this.point = $.extend([], this.initial);
        return this;
      },

      sort: function() {
        this.point.sort(function(a,b){return a - b;});
        return this;
      },

      reverse: function() {
        this.point.sort(function(a,b){return b - a;});
        return this;
      }

    }

    _export = function(frame, options) {
      return new Frame(frame, options);
    }

  })(window, document, jQuery);

  // export
  window._l.cpt.tile = _export;

})(window, document, jQuery);