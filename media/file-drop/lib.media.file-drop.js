/* version: 1.0.0 */
/* require: none */
;(function(document, window) {

  window._l = window._l || {};
  _l.media = _l.media || {};

  var FileDrop = function(options){
    var options = options || {};
    this.elements = options.elements || document.getElementById('file_drop');
    this.callbackLoadStart = options.callbackLoadStart;
    this.callbackLoadComplete = options.callbackLoadComplete;
    this.fallback = options.fallback || function() {
      alert('お使いのブラウザは対応していません。');
    }
    
    this.reader;
    this.isSupport = this.testSupport();

    this.fn = FileDrop.prototype;
  };
  FileDrop.prototype = {

    init : function() {
      var self = this;
      this.elements.addEventListener('dragover',function(e) {
        e.preventDefault();
      },false);

      this.elements.addEventListener('drop',function(e) {
        e.preventDefault();
        if (!self.isSupport) self.fallback();
        self.droped.call(self, e);
      },false);
    },
    
    droped: function(e) {
      var self = this;

      if(typeof this.callbackLoadStart == 'function') this.callbackLoadStart();

      var file = e.dataTransfer.files[0];
      this.reader = new FileReader();

      if(!/^image/.test(file.type)) {
        alert('画像ファイルをドロップしてください。');
      }
      
      this.reader.addEventListener('load', function(e) {
        var img = document.createElement('img');        

        img.addEventListener('load', function() {
          var w = parseInt(img.width);
          var h = parseInt(img.height);
          
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          var imageData = ctx.getImageData(0, 0, w, h);
          if(typeof self.callbackLoadComplete == 'function') self.callbackLoadComplete(img, imageData);

        },false);
        img.src = self.reader.result;
      }, false);

      this.reader.readAsDataURL(file);
    },

    testSupport: function() {
      try {
        new FileReader();
      } catch(e) {
        return false;
      }
      return true;
    }

  }

  _l.media.fileDrop = function(options) {
    return new FileDrop(options);
  }
  
})(document, window);
