/* version: 1.0.0 */
/* require: lib.env.js */
;(function(document, window) {

  window._l = window._l || {};
  _l.media = _l.media || {};

  var ImageLoader = function(srcList, options){
    this.src = srcList; 

    options = options || {};
    this.options = options;
    this.options.timeoutTime = options.timeoutTime || 6000;

    this.all;
    this.progress;

    this.doVirtual = this.options.minTime ? true : false;
    this.isComplete = false;

    this.mode = {
      append: _l.browser.lteIe9
    }
    this.timer = {
      virtual: null
    }

    this.init();
    this.fn = ImageLoader.prototype;
  }
  ImageLoader.prototype = {

    init: function() {
      var _this = this;

      // cleanup
      for (var i = 0, l = this.src.length; i < l; i++) {
        if (this.isDuplicate(this.src[i], i)) {
          this.src.splice(i, 1);
          l--;
        }
      }

      if (this.src.length == 0) {
        this.all = 1;
        this.complete();
        return;
      }
      
      this.all = this.src.length;
      this.progress = 0;

      if (this.mode.append) {
        //create wrap element for append
        this.cacheElement = document.createElement('div');
        this.cacheElement.style.display = 'none';
        document.body.appendChild(this.cacheElement);
      }      

      this.load();
      if (this.doVirtual) {
        this.virtualProgress = 0;
        this.virtual();
      }      
      this.timeout();    
    },

    load: function() {
      var _this = this;

      for (var i=0; i < this.all; i++) {
        var img = new Image();
        img.onload = function() {
          _this.progress++;

          if (_this.doVirtual && _this.virtualProgress <= _this.progress) return;

          if (_this.progress == _this.all) {
            _this.complete();
            return;
          }
          if (typeof _this.options.progress == 'function' && ! _this.isComplete) {
            _this.options.progress(_this.progress, _this.all);
          }
        };
        img.onerror = function() {
          _this.all--;

          //ie6で複数回実行される場合があるため
          img.onerror = null;
          
          if (_this.doVirtual && _this.virtualProgress <= _this.progress) return;

          if (_this.progress == _this.all) {//最後の1つがerrorの場合
            _this.complete();
            return;
          }

        }
        if (this.mode.append) this.cacheElement.appendChild(img);

        //append後にsrcをsetしなければieでonloadが発生しない場合がある(キャッシュが原因)
        img.src = this.src[i];
      }

    },

    virtual: function() {
      var _this = this;

      var min = this.options.minTime,
          interval = 10,
          plus = this.all / (min / interval);

      function loop() {
        clearTimeout(_this.timer.virtual);

        if (_this.doVirtual && _this.virtualProgress > _this.progress) {
          _this.timer.virtual = setTimeout(loop, interval);
          return;
        }

        _this.virtualProgress += plus;
        if (_this.virtualProgress >= _this.all) {
          _this.complete();
          return;
        }
        if (typeof _this.options.progress == 'function' && ! _this.isComplete) {
          _this.options.progress(_this.virtualProgress, _this.all);
        }

        _this.timer.virtual = setTimeout(loop, interval); 
      };
      this.timer.virtual = setTimeout(loop, interval);
    },

    complete: function() {
      if (this.isComplete) return;
      this.isComplete = true;
      if (typeof this.options.progress == 'function') this.options.progress(this.all, this.all);
      if (typeof this.options.complete == 'function') this.options.complete();
      //remove wrapper
      if (this.mode.append) this.cacheElement.parentNode.removeChild(this.cacheElement);
    },   

    timeout: function() {
      var _this = this;

      if (! this.options.timeoutTime || ! typeof this.options.complete == 'function') return;
      var start = +new Date;
      setInterval(function(){
        if (+new Date - start < _this.options.timeoutTime || _this.isComplete) return;          
        console.log('image: timeout');
        if (typeof _this.options.timeout == 'function') {
          _this.options.timeout();
        } else {
          _this.complete();
        }
      }, 100);
    },

    isDuplicate: function(src, index) {
      for (var i = 0, l = this.src.length; i < l; i++) {
        if (i == index) continue;
        if (this.src[i] == src) return true;
      }
      return false;
    }

  }

  _l.media.imageLoader = function(src, options) {
    return new ImageLoader(src, options);
  }
  
})(document, window);
