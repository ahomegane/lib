/* version: 1.0.0 */
/* require: jquery */
;(function(window, document, $, undefined) {

	window._l = window._l || {};
	_l.debug = _l.debug || {};

  if(!window.console){
    window.console = {};
    window.console.log = function(c){
      return c;
      //alert(c);
    };
  }

	var Dom = function() {
		this.fn = Dom.prototype;
	}
	Dom.prototype = {

		/**
		* オブジェクトのプロパティ名を表示
		* @param {Object} obj 対象のオブジェクト
		* @return {void}
		*/
	  member: function(obj, txt) {
			if(!txt) { txt = ''; }
			
	    var properties = '';
			var count = 0;
	    for (var prop in obj){
				if(typeof obj[prop] == 'function') {
	        properties += 'function: ' + prop + "\n";
				} else {
					 properties += 'property: ' + prop + ' = '+ obj[prop] + "\n";
				}
				count++;
	    }
			if(console.log) {
				console.log('************************************************************');
				console.log(txt + '\n\n' + properties);
				console.log('******prop length: ' + count);
				console.log('************************************************************');
			} else {
	    	alert(txt + '\n\n' + properties);
				alert('******prop length: ' + count);
			}
	  },
		
		/**
		* 指定した属性の値をcssから取得
		* @param {String} prop プロパティ名
		* @return {void}
		*/
	  cssStyle: function(prop) {
			var printData = '************ cssに記述されている ' + prop + ' の値 ************' + '\n';
			
			$('html *').each(function() {
				var idName = $(this).attr('id');
				var className = $(this).attr('class');
				var propVal = $(this).css(prop);
				if(typeof idName != 'undefined') {
					printData +=  propVal+ ':  #' + idName + '\n';
				} else if(typeof className != 'undefined') {
					printData +=  propVal+ ':  .' + className + '\n';
				}
			});
			console.log(printData);
	  },
		
		/**
		* 指定した属性の値をstyle属性から取得
		* @param {String} prop プロパティ名
		* @return {void}
		*/
	  attrStyle: function(prop) {
			var printData = '************ styleに記述されている ' + prop + ' の値 ************' + '\n';
			var ex = new RegExp(prop);
			
			$('html *').each(function() {
				var style = $(this).attr('style');
				
				if(typeof style != 'undefined') {
					var nodeName = $(this)[0].nodeName;
					var className = $(this).attr('class');
					var idName = $(this).attr('id');
					
					if(style.match(ex)) {
						printData += nodeName;
						if(typeof idName != 'undefined') {
							printData += '#' + idName;
						}
						if(typeof className != 'undefined') {
							printData += '.' + className;
						}
						printData +=  ' - ' + style + '\n';
					}
				}
			});			
			console.log(printData);
	  }		
	}

	_l.debug.dom = new Dom();

})(window, document, jQuery);