/**
 * [fileOverview]
 * [namespace] window.SWVG, window.swvg
 * [version] 1.0.0
 */
(function(window, document, $, undefined) {

var $window = $(window);

////////////////////

/**
 * pjax handler
 */
window.SWVG.Pjax = function(args) {

  this.pullAreaId = args.pullAreaId;
  this.pushAreaId = args.pushAreaId;

  //@param (path, $pushArea, $content, title, isBrowserBack)
  this.replaceContent = args.replaceContent;
  //@param (path, XMLHttpRequest, textStatus, errorThrown)
  this.renderAjaxError = args.renderAjaxError;
  //@param (path, isBrowserBack)
  this.beforeRequestAjax = args.beforeRequestAjax;

  this.$pushArea = $('#' + this.pushAreaId);

  this.noPjaxClassName = 'no_pjax';
  this.noPjaxPagePath = ['/notfound/'];

  this.isPushState = history.pushState ? true : false;

  this.isFirstPush = false;

  this.currentHistory = 0;
  this.oldHistory = -1;
  this.firstHistory = 0;

}
SWVG.Pjax.prototype = {

  bind: function() {

    var self = this;

    var isNoPjaxPage = self.checkNoPjaxPage(this.noPjaxPagePath);

    if( this.isPushState && !isNoPjaxPage ) {
      
      var path = location.pathname;
      history.replaceState({count: this.oldHistory}, null, path);
      history.pushState({count: this.firstHistory}, null, path);

      $(document).on('click', 'a', function(e) {
        return self.clickAnchor($(this), e);

      });
      $window.on('popstate', function(e) {
        var path = location.pathname;
        var state = e.originalEvent.state;
        self.popStateListener(path, state);
      });

    }

  },

  checkNoPjaxPage: function(noPjaxPagePathList) {

    var path = location.pathname;

    for( var i = 0, l = noPjaxPagePathList.length; i < l; i++ ) {
      if( path ==  noPjaxPagePathList[i] ) {
        this.isPjaxBind = false;
        return true;

      }
    }

    return false;
  },

  clickAnchor: function($a, e) {

    //check className
    var rClassName = new RegExp('\\b' + this.noPjaxClassName + '\\b');
    var className = $a.attr('class');
    if( className && className.match(rClassName) ) {
      return true;
    }
    //check target
    var target = $a.attr('target');
    if( target && target.match(/_blank/) ) {
      return true;
    }
    //check href
    var href = $a.attr('href');
    href = href.replace(/(index.html)$/, '');
    if( !href.match(/(\/|\w+\.html)$/) ) {// '/$' or '.html$'
      
      if( href.match(/\.[^\/\.]+$/) ) {// .html 以外の拡張子
        return true;
      }　else {// '/'が抜けている
        href += '/';
      }
    
    }
    
    this.pushState(href);

    return false;
  },

  pushState: function(path) {

    this.currentHistory++;

    //第１引数でpathに紐づくsateObjectを渡せる
    history.pushState({count: this.currentHistory}, null, path);

    this.pushStateListener(path);

  },

  pushStateListener: function(path) {

    // console.log('push:' + path);
    // console.log('currentHistory:' + this.currentHistory);

    this.requestAsync(path, false);

    this.isFirstPush = true;

  },

  popStateListener: function(path, state) {

    if( this.isFirstPush ) {

      var next = state ? state.count : this.oldHistory;

      // console.log('pop:' + path);
      // console.log('next:' + next);
      // console.log('currentHistory:' + this.currentHistory);

      //prevent to oldHisotory && from oldHistory to firstHistory
      if( next == this.oldHistory && this.currentHistory == this.firstHistory ) {//ページ遷移前のhistory
        this.preventHistoryChange(this.firstHistory);
        return;
      } else if( next == this.firstHistory && this.currentHistory == this.firstHistory ) {//[0,0]
        this.preventHistoryChange(this.firstHistory);
        this.currentHistory = next;//update
        return;
      }

      //request async
      if( this.currentHistory > next ) {//back
        this.requestAsync(path, true);

      } else {//next
        this.requestAsync(path, false);

      }
      this.currentHistory = next;//update

    } else {
      this.preventHistoryChange(this.firstHistory);
      return;

    }

  },

  preventHistoryChange: function(count) {

    history.replaceState({count: count}, null, location.pathname);

  },

  requestAsync: function(path, isBrowserBack) {

    var self = this;

    if( typeof this.beforeRequestAjax == 'function' ) {
      this.beforeRequestAjax(path, isBrowserBack);
    }

    $.ajax({
      url: path,
      dataType: 'html',
      success: function(data) {
        self.ajaxSuccess.call(self, data, path, isBrowserBack);
      },
      error: function(XMLHttpRequest, textStatus, errorThrown) {
        self.ajaxError.call(self, XMLHttpRequest, textStatus, errorThrown, path);
      },
      timeout : 10000
    });

  },

  ajaxSuccess: function(data, path, isBrowserBack) {

    //get title string
    data.match(/<title>(.*?)<\/title>/);
    var title = RegExp.$1;

    var $data = $(data);
    var $content = $('#' + this.pullAreaId, $data).children();

    if( typeof this.replaceContent == 'function' ) {
      
      this.replaceContent(path, this.$pushArea, $content, title, isBrowserBack);

    } else {

      this.$pushArea.empty();
      this.$pushArea.append($content);
      document.title = title;

    }

  },

  ajaxError: function(XMLHttpRequest, textStatus, errorThrown, path) {

    if( typeof this.renderAjaxError == 'function' ) {
      
      this.renderAjaxError(path, XMLHttpRequest, textStatus, errorThrown);

    } else {
      
      this.$pushArea.empty();
      this.$pushArea.append('<div>' + textStatus + '</div>');

    }

  }

}

})(window, document, $);