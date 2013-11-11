//初期かは指定してあるプロパティのみ
//レスポンシブのwidthの取得がおかしい
//レスポンシブの制御。largeが固定幅の場合など
//画像のロード待ちで高さがわからない場合
//jqueryオブジェクトの取り出しとの兼ね合い

/* version: 1.0.0 */
/* require: jquery, _l.ui.simpleAnimation */
;(function(window, document, $, undefined) {

  window._l = window._l || {};

  var _export;
  var simpleAnimation = _l.ui.simpleAnimation;

  ;(function(window, document, $, undefined) {

    var Layer = function(stage, options) {
      this.el = stage;
      this.options = {
        x: 0,
        y: 0,
        z: 0,
        position: 'relative'
      }
      options = options || {};
      $.extend(true, this.options, options);
    }
    Layer.prototype = {

      init: function() {
        this.layers = {};
        this.count = -1;
        this.timer = {
          resize: null
        };
        this.maxH = 0;
        this.stage = this.add(this.el, this.options, '_stage');
        return this;
      },

      add: function(el, options, name) {
        options = $.extend({
          duration: 300,
          position: 'absolute'
        }, options);
        var layer = simpleAnimation(el, options).init();
        if (name) {
          this.layers[name] = layer;
        } else {
          this.layers[++this.count] = layer;
        }
        this.alignHeight(layer);
        return layer;
      },

      remove: function(name) {
        if (! name) return this;
        this.layers[name].remove();
        return this;
      },

      alignHeight: function(layer) {
        var _this = this;
        if (! this.stage) return;
        function render() {
          var h = layer.point.h;
          if (_this.maxH > h) return;
          _this.maxH = h;
          _this.stage.css({
            h: _this.maxH
          });
        };
        render();
        layer.el.on('saAnimate saCss', render);
      },

      each: function(callback) {
        $.each(this.layers, function(key, layer) {
          callback(key, layer);
        });
      }

    }

    _export = function(stage, options) {
      return new Layer(stage, options);
    }

  })(window, document, jQuery);

  // export
  _l.cpt = _l.cpt || {};
  _l.cpt.layer = _export;

})(window, document, jQuery);