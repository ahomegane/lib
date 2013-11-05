/* version: 1.0.0 */
/* require: jquery, lib.env, lib.ui.css3, lib.ui.touches, lib.media.image-loader */
;(function(window, document, $, undefined){

  window._l = window._l || {};
  _l.cpt = _l.cpt || {};

  var _slider,
      _lib = window._l || {};

  ;(function(window, document, $, undefined){

    var Slider = function(options) {
      options = options || {};

      var _this = this;
      this.canTouch = 'ontouchstart' in window || 'onmspointerover' in window;

      /* options */
      this.options = {
        context: null,
        loop: false,
        repeat: options.loop ? 3 : 1,
        center: null,
        step: 1,
        swipe: true,
        mouseSwipe: true,
        interval: false,
        intervalTime: 5000,
        bulletClick: true,
        resize: false,
        mode: {
          plain: {
            detect: (function() {
              return false;
            })(),
            animation: {
              stepMove: (function() {
                return ! _this.canTouch && _lib.browser.chrome;
              })(),
              slide: {
                time: 300,
                ease: 'ease-in-out',
                delay: 0
              }
            },
            margin: 10
          },
          coverFlow: {
            detect: (function() {
              return false;
            })(),
            animation: {
              stepMove: (function() {
                return ! _this.canTouch && _lib.browser.chrome;
              })(),
              slide: {
                time: 300,
                ease: 'ease-in-out',
                delay: 0
              },
              image: {
                time: 200,
                ease: 'linear',
                delay: 20
              }
            },
            margin: -60
          }
        },
        initStart: null,
        initEnd: null,
        slideStart: null,
        slideEnd: null,
        loading: false,
        loadingTimeoutTime: 4000,
        loadingMinTime: null,
        loadingStart: null,
        loadingProgress: null,
        loadingEnd: null
      };
      $.extend(true, this.options, options);

      /* options　→ mode */
      for (var i in this.options.mode) {
        if (! this.options.mode[i].detect) continue;
        this.mode = $.extend(true, {}, this.options.mode[i]);
        this.mode[i] = true;
      }
      if (! this.mode) {
        this.mode = $.extend(true, {}, this.options.mode.plain);
        this.mode.plain = true;        
      }

      this.fn = Slider.prototype;
    }
    Slider.prototype = {

      init: function() {
        var _this = this;

        /* element */
        this.context = this.options.context || $('.slider');
        this.main = this.context.find('.main');
        this.frame = this.context.find('.images');
        this.all = this.frame.find('> ul');
        this.images = this.all.find('> li');
        this.clones = this.makeClone(this.images, this.options.repeat);
        this.btn = this.context.find('.prev, .next');      
        this.bullet = this.context.find('.bullet');
        
        if (this.btn.length > 0) this.options.btnClick = true;
        if (this.bullet.length > 0) this.options.bullet = true;

        /* flag */
        this.isInit = true;
        this.isInitEnd = false;
        this.isLoadingEnd = true;

        this.initStart();

        /* size */
        this.frameSize = this.getSize(this.frame);
        this.imagesSize = this.getSize(this.images);
        this.imagesSize.w += this.mode.margin;
        this.clonesSize = $.extend({}, this.imagesSize);
        this.clonesSize.l *= this.options.repeat;

        /* deta */
        this.startC = 0;
        this.endC = this.clonesSize.l - 1; 
        this.diffC = 0;
        this.c = (function() {
            if (_this.options.center) {
              var c = _this.options.center - 1;
            } else {
              var c = Math.floor((_this.imagesSize.l - 1) / 2);
            }
            if (_this.options.loop) c +=  _this.imagesSize.l * Math.floor((_this.options.repeat - 1) / 2);

            if (c < this.startC) {
              c = this.startC;
            } else if (c > this.endC) {
              c = this.endC;
            }
            return c;
          })();
        this.loopCopyDiff = 0;
        this.bulletC = this.c;

        this.startX = this.calcX(this.startC);
        this.endX = this.calcX(this.endC);
        this.x = this.startX;
        
        this.timer = {
          interval: [],
          resize: null,
          setDefaultAnimation: null,
          setFreeMoveAnimation: null,
          setFreeEndAnimation: null,
          setFreeBounceAnimation: null
        }

        /* rendering */
        this.render();
      },

      refresh: function() {
        /* size */
        this.frameSize = this.getSize(this.frame);
        this.clonesSize = this.getSize(this.clones);
        this.clonesSize.w += this.mode.margin;
        this.imagesSize = $.extend({}, this.clonesSize);
        this.imagesSize.l /= this.options.repeat;

        /* deta */
        this.startC = 0;
        this.endC = this.clonesSize.l - 1;

        this.startX = this.calcX(this.startC);
        this.endX = this.calcX(this.endC);

        /* rendering */
        this.render();
      },

      render: function() {
        var _this = this;

        if (this.isInit) {
          if (this.mode.plain) this.main.addClass('plain');
          if (this.mode.coverFlow) this.main.addClass('cover_flow');
        }

        this.clones.each(function(i) {
          $(this).css({
            left: _this.imagesSize.w * i
          });
        });
        if (this.isInit) {
          this.all.find('li').remove();
          this.all.append(this.clones);
        }

        if (this.options.bullet) {
          var original = this.bullet.find('> ul > li').eq(0);
          if (this.isInit) {
            this.bullets = this.makeClone(original, this.imagesSize.l);
            this.bullets.find('.number').each(function(i) {
              $(this).text(i + 1);
            });
          }

          var w = original.outerWidth(),
              m = +original.css('margin-left').replace('px', '') + +original.css('margin-right').replace('px', '');
          w = (w + m) * this.imagesSize.l - m;
          w = this.frameSize.w - 2 * m >= w ? w : this.frameSize.w - 2 * m;
          this.bullet.css({
            width: w,
            marginLeft: -w / 2
          });

          if (this.isInit) {
            this.bullet.find('> ul > li').remove();
            this.bullet.find('> ul').append(this.bullets);
          }
        }

        this.x = this.calcX(this.c);
        this.move(this.x);
        this.updateCenter(this.clones, this.c);

        if (this.isInit) {
          this.bind();        
          this.setDefaultAnimation();
          this.isInitEnd = true;
          this.initEnd();
        }        
      },

      bind: function() {
        var _this = this;

        if (this.options.btnClick) {
          this.btn.on('click', $.proxy(this.slideOnClick, this));
          if (this.options.interval) {
            this.btn.on('mouseenter', $.proxy(this.clearInterval, this));
            this.btn.on('mouseleave', $.proxy(this.setInterval, this));
          }
        }

        if (this.options.bulletClick && this.options.bullet) {
          this.bullets.on('click', function(e) {
            $.proxy(_this.slideOnbulletClick, _this)(e, $(this));
          });
          if (this.options.interval) {
            this.bullets.on('mouseenter', $.proxy(this.clearInterval, this));
            this.bullets.on('mouseleave', $.proxy(this.setInterval, this));
          }
        }

        if (this.options.interval) {
          this.setInterval();
        }

        if (this.options.swipe) {
          var touch = _lib.ui.touches({
            context: this.frame,
            mouse: this.options.mouseSwipe
          });
          touch.bind({
            touchstart: function(e, initial) {
              _this.freeSlideOnStart();
            },
            touchmove: function(e, total, current, move, before) {
              _this.freeSlideOnMove(move.x);
            },
            touchend: function(e, total, current, move, touchTime) {
              _this.freeSlideOnEnd(e, total.x, move.x, touchTime, false);
            },
            touchcancel: function(e, total, current, move, touchTime) {
              _this.freeSlideOnEnd(e, total.x, move.x, touchTime, true);
            }
          });

          /* custom event (trigger) */
          this.all.on('click', function(e) {
            e.preventDefault();
            return false;
          });
          this.all.on('sliderclick', function(e) {
            if (e.isDefaultPrevented()) return false;// delegate
            e.preventDefault();
            // link
            var a = $(this).find('a'), url = a.attr('href'), target = a.attr('target');
            if (target == '_blank') {
              window.open(url);
            } else {
              location.href = url;
            }
            return false;         
          });
        }

        if (this.options.resize) {
          $(window).on('resize', function() {
            clearTimeout(_this.timer.resize);
            _this.timer.resize = setTimeout($.proxy(_this.refresh, _this), 100);
          });
        }
      },

      setDefaultAnimation: function(callback) {
        var _this = this;

        clearTimeout(this.timer.setDefaultAnimation);
        this.timer.setDefaultAnimation = setTimeout(function() {
          _this.all.addTransition({
            target: 'transform',
            time: _this.mode.animation.slide.time,
            ease: _this.mode.animation.slide.ease
          });
          if (_this.mode.animation.image) {
            _this.clones.addTransition({
              target: 'transform',
              time: _this.mode.animation.image.time,
              ease: _this.mode.animation.image.ease
            });
          }
          setTimeout(function() {
            if (typeof callback == 'function') callback();
          }, 0);          
        }, 0);
      },

      setFreeMoveAnimation: function(callback) {
        var _this = this;

        clearTimeout(this.timer.setFreeMoveAnimation);
        this.timer.setFreeMoveAnimation = setTimeout(function() {
          _this.all.removeTransition();
          if (_this.mode.animation.image) {
            _this.clones.addTransition({
              target: 'transform',
              time: 200,
              delay: 0
            });
          }
          setTimeout(function() {
            if (typeof callback == 'function') callback();
          }, 0);
        }, 0);
      },

      setFreeEndAnimation: function(time, callback) {
        var _this = this;

        clearTimeout(this.timer.setFreeEndAnimation);
        this.timer.setFreeEndAnimation = setTimeout(function() {
          _this.all.addTransition({
            target: 'transform',
            ease: 'ease-out',
            time: time            
          });
          if (_this.mode.animation.image) {
            _this.clones.addTransition({
              target: 'transform',
              time: 200,
              delay: 0
            });
          }
          setTimeout(function() {
            if (typeof callback == 'function') callback();
          }, 0);
        }, 0);
      },

      setFreeBounceAnimation: function(callback) {
        var _this = this;

        clearTimeout(this.timer.setFreeEndAnimation);
        this.timer.setFreeEndAnimation = setTimeout(function() {
          _this.all.addTransition({
            target: 'transform',
            ease: 'ease-out',
            time: 300
          });
          setTimeout(function() {
            if (typeof callback == 'function') callback();
          }, 0);
        }, 0);
      }, 

      slideOnClick: function(e) {
        e.preventDefault();
        if (e.currentTarget.className == 'next') {
          this.fixSlide(-this.options.step);
        } else {
          this.fixSlide(this.options.step);
        }
        return false;
      },

      slideOnInterval: function() {      
        this.fixSlide(-this.options.step);
      },

      setInterval: function() {
        var _this = this;
        function interval() {
          _this.clearInterval();
          _this.slideOnInterval();
        };
        this.timer.interval.push(setTimeout(interval, this.options.intervalTime));
      },

      clearInterval: function() {
        do {
          clearTimeout(this.timer.interval.shift());
        } while (this.timer.interval.length > 0);        
      },

      slideOnbulletClick: function(e, target) {
        e.preventDefault();
        var i = this.bullets.index(target),
            diff = this.bulletC - i;
        this.fixSlide(diff);
        return false;
      },

      fixSlide: function(diff) {
        if (diff == 0) return;

        this.slideStart();

        if (! this.options.loop) {
          if (this.c - diff < this.startC) {
            diff = this.c - this.startC;
          } else if (this.c - diff > this.endC) {
            diff = this.c - this.endC;
          }
        }

        if (diff < 0) {//next
          if (! this.options.loop && this.c >= this.endC) return;
          if (this.options.loop) this.clones = this.loopCopy(this.clones, diff);
          this.x -= this.imagesSize.w * Math.abs(diff);

        } else {//prev
          if (! this.options.loop && this.c <= this.startC) return;
          if (this.options.loop) this.clones = this.loopCopy(this.clones, diff);
          this.x += this.imagesSize.w * Math.abs(diff);
        
        }

        var beforeC = this.c;
        this.c = this.calcC(this.x);
        this.x = this.calcX(this.c);

        this.move(this.x);
        this.updateCenter(this.clones, this.c, diff);

        this.all.oneTransitionEnd('transform', $.proxy(this.slideEnd, this));
      },

      freeSlideOnStart: function() {
        this.slideStart();

        this.diffC = 0;
        this.setFreeMoveAnimation();
      },

      freeSlideOnMove: function(moveX) {
        var beforeC = this.c;
        this.x += moveX;
        this.c = this.calcC(this.x);

        var moveDiff = beforeC - this.c;
        this.diffC += moveDiff;

        this.move(this.x);
        this.updateCenter(this.clones, this.c, moveDiff);
      },

      freeSlideOnEnd: function(e, totalX, moveX, touchTime, isCancel) {
        var _this = this;
        if (this.triggerClickEvent(e, totalX, moveX, touchTime, isCancel)) return false;        

        var time = this.mode.animation.slide.time;
        if (Math.abs(moveX) > 2) { 
          var isShortMoveGesture = ! isCancel && Math.abs(totalX) > 30 && touchTime < 150;         
          if (isShortMoveGesture) {
            moveX = moveX < 0 ? -400 : 400;
            time += Math.floor(Math.abs(moveX * 0.7));
          } else {//normal
            moveX = moveX * 4;
            time += Math.floor(Math.abs(moveX * 0.8));
          }
        }

        var beforeC = this.c;
        this.x += moveX;

        var endDiff = beforeC - this.calcC(this.x);
        this.diffC += endDiff;

        // loopCopy
        if (this.options.loop) {
          if (this.diffC > 0) {
            this.clones = this.loopCopy(this.clones, this.diffC);
          } else {
            this.clones = this.loopCopy(this.clones, this.diffC);
          }
        }

        this.c = this.calcC(this.x);

        // bounce
        var tempC = this.c,
            isBounce = false,
            overX = 0;
        if (! this.options.loop) {
          if (this.x > this.startX && (moveX >= 0 || this.c < this.startC)) {
            isBounce = true;
            this.c = this.startC;
            overX = this.x - this.startX;
          } else if (this.x < this.endX && (moveX <= 0 || this.c > this.endC)) {
            isBounce = true;
            this.c = this.endC;        
            overX = this.x - this.endX;
          }
        }

        if (isBounce) {
          this.x -= overX * 0.6;
          time -= Math.floor(Math.abs(overX * 0.5));

          // set bounce
          setTimeout(function () {
            _this.setFreeBounceAnimation(function() {
              _this.x = _this.calcX(_this.c);
              _this.move(_this.x);
              _this.setDefaultAnimation();
              _this.all.oneTransitionEnd('transform', $.proxy(_this.slideEnd, _this));              
            });
          }, time);
        } else {
          _this.x = _this.calcX(_this.c);
        }      

        this.setFreeEndAnimation(time, function() {
          _this.move(_this.x);
          _this.updateCenter(_this.clones, tempC, endDiff, time);
          if (! isBounce) {
            _this.setDefaultAnimation();
            _this.all.oneTransitionEnd('transform', $.proxy(_this.slideEnd, _this));
          }
        });
      },

      triggerClickEvent: function(e, totalX, moveX, touchTime, isCancel) {
        var isClickGesture = ! isCancel && Math.abs(totalX) < 1 && touchTime < 400;
        if (! isClickGesture) return false;

        var target = $(e.target),
            parent = target.parents('.images li.center');        
        if (! target.hasClass('center') && parent.length == 0) return false;

        target = parent.length > 0 ? parent : target;        

        var anchor = target.find('a');
        anchor.trigger('sliderclick');//tirgger custom event

        this.slideEnd();
        return true;
      },

      move: function(x) {
        this.all.css({
          transform: 'translateZ(0px) translateX(' + x + 'px)'
        });
      },

      updateCenter: function(images, c, diff, time) {
        var _this = this;

        var isStep = diff && time && this.mode.animation.stepMove;
        if (isStep) var interval = time / Math.abs(diff);

        if (! this.options.loop) {
          if (c < this.startC) {
            diff += c - this.startC;
            diff = diff > 0 ? diff : 0;
            c = this.startC;

          } else if (c > this.endC) {
            diff += c - this.endC;
            diff = diff < 0 ? diff : 0;
            c = this.endC;
          }
        }

        if (diff == 0) return;

        if (isStep && Math.abs(diff) > 1) {
          var current = diff < 0 ? c + diff - 1 : c + diff + 1,
              i = diff < 0 ? 1 : -1;
          function loop() {
            current += i;
            requestAnimationFrame(function() {
              update(current);
            });
            if (c == current) return;
            setTimeout(loop, interval * 0.5);
          };
          setTimeout(loop, interval * 0.3);
        } else {
          update(c);
        }
        return;

        function update(c) {
          images.each(function(i) {
            $(this).removeClass('center');
            if (i < c) {
              $(this).css({zIndex: i});
            } else if (i == c) {
              $(this).addClass('center').css({zIndex: i});
            } else {
              $(this).css({zIndex: c*2 -i});
            }
          });

          if (! _this.options.loop) _this.bulletC = c;
          if (_this.options.loop) _this.bulletC = c - _this.loopCopyDiff;

          if (_this.bulletC < 0) {
            _this.bulletC = Math.abs(_this.imagesSize.l + _this.bulletC % _this.imagesSize.l);
            if (_this.bulletC == _this.imagesSize.l) _this.bulletC = 0;
          } else {
            _this.bulletC = _this.bulletC % _this.imagesSize.l;
          }

          if (_this.options.bullet) {
            _this.bullets.removeClass('current');
            _this.bullets.eq(_this.bulletC).addClass('current');
          }
        }

      },

      loopCopy: function(images, diff) {
        if (diff == 0) return images;

        for (var i = 0; i < Math.abs(diff); i++) {
          var first = images.eq(0),
              last = images.eq(images.length - 1);
          
          if (diff < 0) {//next    
            var copy = first.clone();
            copy.css({
              left: +last.css('left').replace('px', '') + this.imagesSize.w
            });
            first.remove();
            this.all.append(copy);
            this.loopCopyDiff -= 1;

          } else {//prev
            var copy = last.clone();
            copy.css({
              left: +first.css('left').replace('px', '') - this.imagesSize.w
            });
            last.remove();
            this.all.prepend(copy);
            this.loopCopyDiff += 1;

          }
          //update
          images = this.all.find('li');
        }        
        return images;
      },

      makeClone: function(original, repeat) {
        for (var i = 0; i < repeat; i++) {
          if (i == 0) {
            var $o = original.clone();
            continue;
          }
          $o = $o.add(original.clone());
        }
        return $o;
      },

      calcX: function(c) {
        var x = this.imagesSize.w * (c + 1 - this.loopCopyDiff) - (this.frameSize.w / 2 + this.imagesSize.w / 2) - this.mode.margin / 2;
        return -x;
      },

      calcC: function(x) {
        x = -x;
        var c = Math.floor((x + (this.frameSize.w / 2 + this.imagesSize.w / 2) + this.mode.margin / 2) / this.imagesSize.w) - 1 + this.loopCopyDiff,
            r = (x + (this.frameSize.w / 2 + this.imagesSize.w / 2) + this.mode.margin / 2) % this.imagesSize.w;
        if (r > this.imagesSize.w / 2) c++;
        return c;
      },

      getSize: function(el) {
        return {
          l: el.length,
          w: el.outerWidth()
        };
      },

      slideStart: function() {
        if (this.options.interval) this.clearInterval();
        if (typeof this.options.slideStart == 'function') this.options.slideStart();
      },

      slideEnd: function() {
        if (this.options.interval) this.setInterval();
        if (typeof this.options.slideEnd == 'function') this.options.slideEnd();
      },

      initStart: function() {
        var _this = this;

        if (this.options.loading) {
          var src = [],
              imgs = this.images.find('img');
          imgs.each(function(i) {
            src[i] = $(this).attr('src');
          });

          this.loadingStart();
          this.isLoadingEnd = false;

          _lib.media.imageLoader(src, {
            progress: function(progress, all) {
              _this.loadingProgress(progress, all);
            },
            complete: function() {
              _this.loadingEnd();
              _this.isLoadingEnd = true;
              _this.initEnd();
            },
            timeout: function() {
              _this.loadingEnd();
              _this.isLoadingEnd = true;
              _this.initEnd();
            },
            timeoutTime: this.options.loadingTimeoutTime,
            minTime: this.options.loadingMinTime
          });
        }

        if (typeof this.options.initStart == 'function') this.options.initStart();
      },

      initEnd: function() {
        if (! this.isInitEnd || ! this.isLoadingEnd || this.isExecuteInitEnd) return;
        this.isExecuteInitEnd = true;
        this.isInit = false;
        if (typeof this.options.initEnd == 'function') this.options.initEnd();
      },

      loadingStart: function () {
        if (typeof this.options.loadingStart == 'function') this.options.loadingStart();
      },

      loadingProgress: function (progress, all) {
        if (typeof this.options.loadingProgress == 'function') this.options.loadingProgress(progress, all);
      },

      loadingEnd: function () {
        if (typeof this.options.loadingEnd == 'function') this.options.loadingEnd();
      }

    }

    _slider = function(options) {
      return new Slider(options);
    }

  })(window, document, jQuery);

  // export
  window._l.cpt.slider = _slider;

})(window, document, jQuery);