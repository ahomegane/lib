/* version: 1.0.0 */
/* require: none */
;(function(window, document, undefined) {

  window._l = window._l || {};

  _l.device = (function () {
    var userAgent = window.navigator.userAgent.toLowerCase();
    var deviceType = {
      iphone:       false,
      android:      false,
      android23:    false,
      windowsphone: false,
      ipad:         false,
      androidtab:   false,
      windows8:     false,
      sp:           false,
      tb:           false,
      pc:           false
    }
    
    if ((userAgent.indexOf('iphone') > -1 && userAgent.indexOf('ipad') == -1) || userAgent.indexOf('ipod') > -1) {
      deviceType.iphone = true; //iPhone&iPod
      deviceType.sp = true;
    } else if (userAgent.search(/android 2.[123]/) > -1 && userAgent.indexOf('mobile') > -1) {
        deviceType.android23 = true; //AndroidMobile2.3以下// (一部のタブレット型アンドロイドを含む)
        deviceType.sp = true;
    } else if (userAgent.indexOf('android') > -1 && userAgent.indexOf('mobile') > -1) {
      deviceType.android = true; //AndroidMobile(一部のタブレット型アンドロイドを含む)
      deviceType.sp = true;
    } else if (userAgent.indexOf('windows phone') > -1) {
      deviceType.windowsphone = true; //WindowsPhone
      deviceType.sp = true;    
    } else if (userAgent.indexOf('ipad') > -1) {
      deviceType.ipad = true; //iPad
      deviceType.tb = true;
    } else if (userAgent.indexOf('android') > -1) {
      deviceType.androidtab = true; //AndroidTablet
      deviceType.tb = true;
    } else if (/win(dows )?nt 6\.2/.test(userAgent)) {
      deviceType.windows8 = true; //windows8
      deviceType.pc = true; //PC
    } else {
      deviceType.pc = true; //PC
    }
    return deviceType;
  })();

  _l.browser = (function () {
    var userAgent = window.navigator.userAgent.toLowerCase();
    var browserType = {
      lteIe6:  false,
      lteIe7:  false,
      lteIe8:  false,
      lteIe9:  false,
      ie:      false,
      ie6:     false,
      ie7:     false,
      ie8:     false,
      ie9:     false,
      ie10:    false,
      gtIe10:  false,
      firefox: false,
      opera:   false,
      chrome:  false,
      safari:  false,
      other:   false
    }

    if (userAgent.indexOf('msie') > -1 || userAgent.indexOf('trident') > -1) {
      browserType.ie = true;

      var ieVersion = userAgent.match(/(msie\s|rv:)([\d\.]+)/)[2];
      
      if (ieVersion == 6) {
        browserType.ie6 = true;
      } else if (ieVersion == 7) {
        browserType.ie7 = true;
      } else if (ieVersion == 8) {
        browserType.ie8 = true;
      } else if (ieVersion == 9) {
        browserType.ie9 = true;
      } else if (ieVersion == 10) {
        browserType.ie10 = true;
      } else if (ieVersion == 11) {
        browserType.ie11 = true;
      } else if (ieVersion > 11) {
        browserType.gtIe11 = true;
      }

      if (ieVersion < 7) {
        browserType.lteIe6 = true;
        browserType.lteIe7 = true;
        browserType.lteIe8 = true;
        browserType.lteIe9 = true;
      } else if (ieVersion < 8) {
        browserType.lteIe7 = true;
        browserType.lteIe8 = true;
        browserType.lteIe9 = true;
      } else if (ieVersion < 9) {
        browserType.lteIe8 = true;
        browserType.lteIe9 = true;
      } else if (ieVersion < 10) {
        browserType.lteIe9 = true;
      }

    } else if (userAgent.indexOf('firefox') > -1) {
      browserType.firefox = true;
    } else if (userAgent.indexOf('opera') > -1) {
      browserType.opera = true;
    } else if (userAgent.indexOf('chrome') > -1 || userAgent.indexOf('crios') > -1) {
      browserType.chrome = true;
    } else if (userAgent.indexOf('safari') > -1 && userAgent.indexOf('chrome') == -1) {
      browserType.safari = true;
    } else {
      browserType.other = true;
    }
    return browserType;
  })();

  _l.prefix = (function() {
    var prefix;
    if(_l.browser.safari || _l.browser.chrome) prefix = '-webkit-';      
    if(_l.browser.firefox) prefix = '-moz-';
    if(_l.browser.opera) prefix = '-o-';
    if(_l.browser.ie) prefix = '-ms-';
    return prefix;
  })();

  _l.support = {

    touch: 'ontouchstart' in window,

    canTouch: 'ontouchstart' in window || 'onmspointerover' in window,

    transition: (function() {
      if (_l.browser.ie) return false;
      var prop = [
        'webkitTransitionProperty',
        'MozTransitionProperty',
        'mozTransitionProperty',
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
    })(),

    standalone: navigator.standalone ? true : false

  };

})(window, document);