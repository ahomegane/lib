/* version: 1.0.0 */
/* require: lib.util.js, lib.util.event.js */
;(function(window, document, undefined){

  window._l = window._l || {};
  _l.util = _l.util || {};

  var Selectors = function(selector, context) {
    this.fn = Selectors.prototype;
    return this.find(selector, context);
  }
  Selectors.prototype = {

    0: null,//dom element {Array}

    context: null,

    selector: null,
    
    find: function(selector, context) {
      //selector string cleanup
      if(typeof selector == 'string') {
        selector = selector.replace(/(?:\s)+$/,'').replace(/^(?:\s)+/,'');
      }

      //override context for method chain
      if(this[0]) context = this;
      //override properties
      this.context = context;
      this.selector = selector;

      //documentオブジェクト(new Selectors(document)の前に処理を行うと無限ループになる)
      if(typeof selector == 'object' && (selector.nodeType || selector[0].nodeType)) {
        this[0] = [selector];
        return this;
      }

      context = context instanceof Selectors ? context : new Selectors(document);

      //browser test
      var isStandard = document.querySelectorAll,
      elArr = [];

      //standard
      if(isStandard) {
        context.each(function() {
          elArr = elArr.concat(_l.util.toArray(this.querySelectorAll(selector)));
        });

      //legacy
      } else {
        selector = selector.split(' ');
        
        if(selector.length > 1) {//ij('.foo .bar');
        
          //#から始まる文字列からをfindの対象とする
          for(var i=selector.length-1,l=-1; i>l; i--) {
            if(/^#/.test(selector[i])) {
              selector = selector.slice(i);
              break;
            }
          }
          //find loop
          for(var i=0,l=selector.length; i<l; i++) {
            this.find(selector[i]);
          }
          return true;
          
        } else {//ij('.foo');
          selector = selector[0];
          
          if(/^#/.test(selector)) {//id
            selector = selector.replace(/^#/, '');
            elArr = elArr.concat([document.getElementById(selector)]);
            
          } else if(/^\./.test(selector)) {//class
            context.each(function() {
              var all = this.getElementsByTagName('*'), arr = [];
              selector = selector.replace(/^\./, '');
              var rClassName = new RegExp('\\b' + selector + '\\b');
              for (var i = 0, l = all.length; i < l; i++) {
                if (rClassName.test(all[i].className)) {
                  arr.push(all[i]);
                }
              }
              elArr = elArr.concat(arr);
            });
            
          } else {//tagname
            context.each(function() {
              elArr = elArr.concat(_l.util.toArray(this.getElementsByTagName(selector)));
            });
          }

        }
      }
      this[0] = elArr;
      return this;
    },
    
    //function内のthisはdom element,第１引数にindex番号
    each: function(func) {
      if(this[0]) {
        for(var i=0,l=this[0].length; i<l; i++) {
          if(typeof func == 'function') func.call(this[0][i],i);
        }
      }
    },
    
    on: function(ev, listenerFunc) {
      if(this[0]) {
        this.each(function(i) {
          _l.util.event.addEventListener(this, ev, listenerFunc);
        });
      }
    },
    
    off: function(ev, listenerFunc) {
      if(this[0]) {
        this.each(function() {
          _l.util.event.removeEventListener(this, ev, listenerFunc);
        });
      }
    },

    addClass: function(el, className) {
      el.className += ' ' + className;
    },

    removeClass: function(el, className) {
      var rClassName = new RegExp(' ?\\b' + className + '\\b ?', 'g');
      el.className = el.className.replace(rClassName, '');
    }
  }

  _l.util.selector = function(selector, context){
    if(selector) {
      return new Selectors(selector, context);      
    }  else {
      return null;
    }
  }

})(window, document);