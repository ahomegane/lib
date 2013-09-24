/**
* @fileOverview
* @name suteki.pjax.js
* @version 1.0.0 2012.10.01 Creating New File
*/

/* OBJECT PJAX ******************************************************************************************/

/**
* Pjaxオブジェクト
* @param {String} pushContentAreaId XHRでロードするコンテンツのエレメントID ex)'CONTENT_BODY'
* @param {String} pullContentAreaId XHRでロードしたコンテンツをappendするエレメントID ex)'CONTENT_BODY'
* @constructor
------------------------------------------------------------------------------------------ */
var Pjax = function(pullContentAreaId,pushContentAreaId){

	/**
	* XHRでロードしたコンテンツをappendするエレメントID。self.setContentAreaId()で変更可能
	* @return {String}
	*/
	this.pullContentAreaId = pullContentAreaId;
	/**
	* XHRでロードするコンテンツのエレメントID。self.setContentAreaId()で変更可能
	* @return {String}
	*/
	this.pushContentAreaId = pushContentAreaId;
	
	/**
	* Deviceオブジェクト インスタンス
	*/
	this.de = new Device();
	this.deviceUa = this.de.getDevTypeFromUa();
	this.browser = this.de.getBrowTypeFromUa();
	
	/**
	* aタグのhrefでpjaxを発動しない拡張子
	* @return {Array}
	*/
	this.exceptExt = [];
	
	/**
	* 現在のページのパス。(XHR実行直前に更新)
	* @return {String}
	*/
	this.currentPage = null;
	
	/**
	* XHRの実行フラグ。self.setLoadPageFlag()でパス別に指定可能
	* @return {Boolean}
	*/
	this.loadPageFlag = true;
	
	/**
	* 同一ページの場合も強制的にloadContentを実行するフラグ
	* @return {Boolean}
	*/
	this.fireloadContentFlag = false;
	
	/**
	* history.pushStateの機能テスト
	* @return {Boolean}
	*/
	this.isPushState = (history.pushState) ? true : false;

	/**
	* Pjaxオブジェクト全体で仕様するTimerID配列
	* @return {Array}
	*/
	this.timerId = [];
	
	/**
	* 初回の遷移かどうかを判定するフラグ
	* @return {String}
	*/
	this.isLanding = true;

	/**
	* hashchangeの実行判定フラグ
	* @return {Boolean}
	*/
	this.doChangeHistoryFlag = false;
		
	/**
	* ホスト
	* @return {String}
	*/
	this.host = location.host;
	
	/**
	* トップページのjqueryオブジェクト格納用
	* @return {Hash}
	*/
	this.$obj = {};

	/**
	* 解析用にリファラーを格納
	* @return {String}
	*/
	this.referrerPage = 'landing';
	/**
	* 解析用にブラウザバックでの遷移かを判定するフラグ
	* @return {Boolean}
	*/
	this.isBrowserBack = false;

}

Pjax.prototype = {

	/**
	* start
	*/
	start: function() {
		var self = this;
		self.redirectToTop();
	},

	/**
	* トップページにリダイレクトさせる
	* ページ遷移を挟み処理を継続できないため、hashを付けてリダイレクトする
	*/
	redirectToTop: function(){
		var self = this;
		var parseUrl = self.parseUrl(location.href);
		
		//下層ページに遷移したらトップページにリダイレクト　ex) http://aaa.com/bbb/ → http://aaa.com/#/bbb/
		if(parseUrl.path != '/') {
			
			//一瞬チラ見えするのでbodyを非表示(document.readyになった場合のみ有効)
			$('html, body').css('display','none');
			
			var redirectUrl = location.protocol + '//' + self.host + '#' + parseUrl.path;
			if(parseUrl.hashAnchor != '') { redirectUrl = redirectUrl + '#' + parseUrl.hashAnchor; }
			if(parseUrl.query != '') { redirectUrl = redirectUrl + '?' + parseUrl.query; }
			
			//計測用にreferrerをcookieに保存
			$.cookie('stk_referrer', document.referrer, {path: '/', expires: 1});

			location.replace(redirectUrl);
			return false;
		}
		
		//トップページにリダイレクトor直接トップページに遷移したら処理スタート
		if(parseUrl.path == '/') {
			
			//保存したリファラーを取得
			if($.cookie('stk_referrer')) {
				self.referrerPage = $.cookie('stk_referrer');
				$.cookie('stk_referrer', null);
			}			
			
			//#hashを書き換え(historyに#hashが残るためreplaceState)
			if(self.isPushState) {
				var historyPath = parseUrl.hashPath;
				if(parseUrl.hashAnchor != '') { historyPath = historyPath + '#' + parseUrl.hashAnchor;}
				if(parseUrl.query != '') { historyPath = historyPath + '?' + parseUrl.query; }
				history.replaceState(null,null,historyPath);
			}
			
			$(function(){
				//parseUrl解析時点では全ブラウザ /#/aaa/のため、pathを更新
				parseUrl.path = parseUrl.hashPath;
				self.setupTopPage(parseUrl, self);
			});
			return false;
		}

	},
	
	/**
	* トップページをセットアップ
	* XHRで表示するエレメントを呼び出す
	* aタグにイベントをアタッチ
	* @param {Object} parseUrl self.parseUrl()実行結果
	* @param {Object} self Pjaxオブジェクト	
	*/
	setupTopPage: function(parseUrl, self) {
		self.callbackSetupTopPage(parseUrl, self);

		//historyおよびhashの変更を監視(ブラウザバック対応)
		self.changeHistory();

		self.loadContent(parseUrl);
		//イベントをアタッチ
		self.attachEventTopPage(self);		
	},

	/**
	* [set instance] トップページセットアップ時のコールバック
	* @param {Object} parseUrl self.parseUrl()実行結果
	* @param {Object} self Pjaxオブジェクト	
	*/
	callbackSetupTopPage: function(parseUrl,self) {
	},

	/**
	* トップページにイベントをアタッチ
	* @param {Object} self Pjaxオブジェクト
	*/
	attachEventTopPage: function(self) {
		
		//aタグにイベントをセット
		$(document).on('click','a',function(e) {
			var parseUrl = self.parseUrl($(this).attr('href'));
			var target = $(this).attr('target');
			
			//parseUrl.pathの拡張子をチェック
			if(self.exceptExt.length > 0) {
				for(var i=0; i<self.exceptExt.length; i++) {
					var ex = new RegExp(self.exceptExt[i]);
					if(parseUrl.path.match(ex)) {
						parseUrl.path = 'noPjax';
						break;
					}
				}
			}

			//pjax遷移除外:外部サイト
			if(parseUrl.href.match(/^(http|https):\/\//)){
				return true;
			}
			
			//pjax遷移除外
			if(target == '_blank' || $(this).hasClass('noPjax') || $(this).hasClass('noAnchorLink') || parseUrl.path == 'noPjax' || parseUrl.href.match(/mailto\:/) != null) {
				return true;
			}
			
			/* ページ内リンク **/
			if(parseUrl.path =='' && parseUrl.hashAnchor != '' || $(this).hasClass('anchorLink')) {
					
				//history・hashの書き換え
				var parseLocationUrl = self.parseUrl(location.href);
				var historyPath = (self.isPushState) ? parseLocationUrl.path : parseLocationUrl.hashPath;
				if(parseUrl.hashAnchor != '' && self.deviceUa != 'android') { historyPath = historyPath + '#' + parseUrl.hashAnchor; }
		
				self.doChangeHistoryFlag = false;//changeHistoryが発動しないように
				if(self.isPushState) {
					history.pushState(null,null,historyPath);
				} else {
						location.hash = historyPath;
				}
				
				//moveAnchorLink
				self.moveAnchorLink(parseUrl,self);
				self.doChangeHistoryFlag = true;
				return false;
				
			/* 通常の遷移 **/
			} else {
				//history・hashの書き換え
				var historyPath = parseUrl.path;
				if(parseUrl.hashAnchor !=  '' && self.deviceUa != 'android' ) { historyPath = historyPath + '#' + parseUrl.hashAnchor; }
				if(parseUrl.query != '') { historyPath = historyPath + '?' + parseUrl.query; }
		
				self.doChangeHistoryFlag = false;//changeHistoryが発動しないように
				if(self.isPushState) {
					history.pushState(null,null,historyPath);
				} else {
						location.hash = historyPath;
				}
				
				//loadContent
				self.isBrowserBack = false;	 //ブラウザバックではない
				self.loadContent(parseUrl);
				return false;
			}
		});
		
		self.callbackAttachEventTopPage(self);
		
	},
	
	/**
	* [set instance]	トップページにその他のイベントをアタッチする場合も使用するcallback
	* @param {Object} self Pjaxオブジェクト
	*/
	callbackAttachEventTopPage: function(self){
	},

	/**
	* historyおよびhashの変更を監視(ブラウザバック対応)
	*/	
	changeHistory: function() {
		var self = this;
		
		if(self.isPushState) {
			//イベントセット時にchorome/safariでposstateが実行される
			_gr.addListener(window,'popstate',function(e) {
				if(self.doChangeHistoryFlag) {
					var parseUrl = self.parseUrl(location.href);
					self.loadContent(parseUrl);
				}
			});

		} else {

			$(window).hashchange(function() {
				if(self.doChangeHistoryFlag) {
					var parseUrl = self.parseUrl(location.href);
					parseUrl.path = parseUrl.hashPath;
					self.loadContent(parseUrl);
				}
			});
		}
	},
		
	/**
	* XHRを実行し、コンテンツをロード
	* attachEventTopPageおよびchangeHistoryでhistory・hashを書き換えた後に実行される
	* @param {Object} parseUrl self.parseUrl()実行結果
	*/
	loadContent: function(parseUrl) {
		var self = this;

		//urlが前いたページと違う場合のみ実行(anchorリンクは実行されない)
		if(self.currentPage != parseUrl.path || self.fireloadContentFlag){
			//currentPage更新
			self.currentPage = parseUrl.path;
	
			self.setContentAreaId(parseUrl, self);
			self.setLoadPageFlag(parseUrl, self);
			self.callbackBeforeLoadContent(parseUrl, self);
			
			if(parseUrl.hashAnchor == '') {
				$('html, body').stop(true).scrollTop(0);
			}
			
			if(self.loadPageFlag) {
				//XHRを実行
				self.doXhr({
					parseUrl:parseUrl,
					type:'html',
					fnSuc:self.sucXhr,
					fnErr:self.errXhr,
					fnLoading:self.loadingXhr,
					thisObj:self
				});
			} else {
				self.callbackLoadPageFlagFalse(parseUrl, self);

			}
			
		}
	},

	/**
	* [set instance] ページ内リンクのアニメーション処理
	* @param {Object} parseUrl self.parseUrl()実行結果
	* @param {Object} self Pjaxオブジェクト
	*/
	moveAnchorLink: function(parseUrl, self) {
		if(parseUrl.hashAnchor != '' ) {
			var scrollTopVal = $('#' + parseUrl.hashAnchor).offset().top;
			$('html, body').stop(true).scrollTop(scrollTopVal);
		}
	},
	
	/**
	* ページ遷移完了時の処理
	* @param {Object} parseUrl self.parseUrl()実行結果
	* @param {Object} self Pjaxオブジェクト
	*/
	pjaxTransitionFixed: function(parseUrl, self) {		
		self.callbackPjaxTransitionFixed(parseUrl, self);
		self.moveAnchorLink(parseUrl, self);
		self.onload(parseUrl, self);

		//referrerを更新
		self.referrerPage = self.currentPage;
		if(self.fireloadContentFlag) { self.fireloadContentFlag = false; }
		if(!self.doChangeHistoryFlag) { self.doChangeHistoryFlag = true; }
		if(!self.isBrowserBack) { self.isBrowserBack = true; }
		if(self.isLanding) { self.isLanding = false; }
	},

	/**
	* [set instance] ページ遷移完了時の処理
	* @param {Object} parseUrl self.parseUrl()実行結果
	* @param {Object} self Pjaxオブジェクト
	*/
	callbackPjaxTransitionFixed: function(parseUrl, self) {
	},
	
	/**
	* [set instance] loadContentのcallbackメソッド
	* @param {Object} parseUrl self.parseUrl()実行結果
	* @param {Object} self Pjaxオブジェクト
	*/
	callbackBeforeLoadContent: function(parseUrl, self){
		self.destructorTransitionFixed(parseUrl, self);
		self.onunload(parseUrl, self);
		/*delete pjax.onload;
		delete pjax.onunload;*/
	},
	
	/**
	* [set instance] 次のページをロードする直前に実行するDestructor
	* @param {Object} parseUrl self.parseUrl()実行結果
	* @param {Object} self Pjaxオブジェクト
	*/
	destructorTransitionFixed: function(parseUrl, self) {
		do{clearTimeout(self.timerId.shift());}while(self.timerId.length > 0);
	},
	
	/**
	* XHRで取得するコンテンツエリアのトップページのエレメントID(self.pullContentAreaId)/
	* 取得したデータをappendするトップページのエレメントID(self.pushContentAreaId)を変更(インスタンス別に設定を想定)
	* @param {Object} parseUrl self.parseUrl()実行結果
	* @param {Object} self Pjaxオブジェクト
	*/
	setContentAreaId: function(parseUrl, self){
	},

	/**
	* [set instance] loadPageFlag(XHRを実行するorしない)を変更
	* @param {Object} parseUrl self.parseUrl()実行結果
	* @param {Object} self Pjaxオブジェクト
	*/
	setLoadPageFlag: function(parseUrl, self){
	},
	
	/**
	* [set instance] loadPageFlag(XHRを実行するorしない)がfalseの場合の処理
	* @param {Object} parseUrl self.parseUrl()実行結果
	* @param {Object} self Pjaxオブジェクト
	*/
	callbackLoadPageFlagFalse: function(parseUrl, self){
		self.pjaxTransitionFixed(parseUrl, self);
	},
	
	/**
	* XHRで読み込んだコンテンツからデータを抽出
	* @param {Object} outerDocument XHRで取得したドキュメントテキスト
	* @param {Object} parseUrl self.parseUrl()実行結果
	* @param {Object} self Pjaxオブジェクト
	*/
	sucXhr: function(outerDocument, parseUrl, self) {
		
		//titleの書き換え
		var titleTmp = outerDocument.match(/<title>.*<\/title>/);
		var title = titleTmp[0].replace('<title>','').replace('</title>','');
		document.title= title;

		//localScriptをトップページにappend
		//トップページにすでにあれば削除
		var idPre = 'localScript';
		var scriptAppended = document.getElementsByTagName('script');
		if(scriptAppended) {
			for(var i=0; i < scriptAppended.length; i++) {
				var idName = scriptAppended[i].id;
				var ex = new RegExp(idPre + '.*');
				if(idName.match(ex)) {
					scriptAppended[i].parentNode.removeChild(scriptAppended[i]);
					i--;
				}
			}
		}
		var scriptAppend = outerDocument.match(/<script.*id=(\'|\")localScript.*<\/script>/g);
		if(scriptAppend) {
			for(var i=0; i < scriptAppend.length; i++) {
				var id = scriptAppend[i].match(/id=(\'|\")(.*?)(\'|\")/);
				id = RegExp.$2;
				var src = scriptAppend[i].match(/src=(\'|\")(.*?)(\'|\")/);
				src = RegExp.$2;
	
				var ls = document.createElement('script');
				ls.type = 'text/javascript';
				ls.id = id;
				ls.src = src;
				var s = document.getElementsByTagName('head')[0];
				s.appendChild(ls);
			}
		}
		
		//ナビゲーションのカレント表示変更
		self.changeNaviCurrent(outerDocument, parseUrl, self);
		self.callbackSucXhr(outerDocument, parseUrl, self);
		
	},
	
	/**
	* [set instance] ナビゲーションのカレント表示変更
	* @param {Object} outerDocument XHRで取得したドキュメントテキスト
	* @param {Object} parseUrl self.parseUrl()実行結果
	* @param {Object} self Pjaxオブジェクト
	*/
	changeNaviCurrent: function(outerDocument, parseUrl, self) {
		
		var contentId = $('h1',outerDocument).attr('id');
		var naviId = 'NAV' + String(contentId.replace('ID',''));
		
		$('#NAV li').removeClass('cur');
		$('#' + naviId).addClass('cur');
	
	},
	
	/**
	* [set instance] XHR成功時のコールバックメソッド
	* @param {Object} outerDocument XHRで取得したドキュメントテキスト
	* @param {Object} parseUrl self.parseUrl()実行結果
	* @param {Object} self Pjaxオブジェクト
	*/
	callbackSucXhr: function(outerDocument, parseUrl, self) {		
		var outerContent = $('#' + self.pullContentAreaId,outerDocument).html();
		
		$('#' + self.pushContentAreaId).stop(true,true).fadeOut(300).html('');
		self.timerId.push(setTimeout(function(){
			$('#' + self.pushContentAreaId).stop(true,true).append(outerContent).fadeIn(400,function(){
	
				self.callbackSucXhrDispFixed(outerDocument, parseUrl, self);
				self.pjaxTransitionFixed(parseUrl, self);
			
			});
			
		},300));
	},
	
	/**
	* [set instance] XHR成功→コンテンツの表示が完了後に実行するコールバックメソッド
	* @param {Object} outerDocument XHRで取得したドキュメントテキスト
	* @param {Object} parseUrl self.parseUrl()実行結果
	* @param {Object} self Pjaxオブジェクト
	*/
	callbackSucXhrDispFixed: function(outerDocument, parseUrl, self) {
	},
	
	/**
	* [set instance] XHRの通信中に実行するローディング用メソッド
	*/
	loadingXhr: function(){
	},
	
	/**
	* [set instance] XHR用エラー出力
	* @param {Object} errObj XHRのエラーオブジェクト(doXhrメソッド参照)
	*/
	errXhr: function(errObj, parseUrl, self) {
		$('#' + self.pushContentAreaId).css('display','block');
		$('#' + self.pushContentAreaId).html("<p>ERROR<br />" + errObj.status + "</p>");
		document.title= errObj.status;
	},

	
	/**
	* [set instance] ページ遷移完了時に実行するローカルJS用onloadメソッド
	* @param {Object} parseUrl self.parseUrl()実行結果
	* @param {Object} self Pjaxオブジェクト
	*/
	onload: function(parseUrl, self) {
	},
	
	/**
	* [set instance] 次のページをロードする直前に実行するローカルJS用onunloadメソッド
	* @param {Object} parseUrl self.parseUrl()実行結果
	* @param {Object} self Pjaxオブジェクト
	*/
	onunload: function(parseUrl, self) {
	},

	/**
	* XHRメソッド
	* @param {Object} reqObj
	* @param {String} reqObj.parseUrl parseUrl()参照
	* @param {String} reqObj.type json | xml | html | text
	* @param {Function} reqObj.fnSuc function for success
	* @param {Function} [reqObj.fnErr] function for error
	* @param {Function} [reqObj.fnLoading] selector name for loading
	* @param {String} [reqObj.thisObj]
	*/
	doXhr: function(reqObj) {
		if(!reqObj.method) reqObj.method = "get";
		if(!reqObj.thisObj) reqObj.thisObj = null;
		$.ajax({
			url	 : reqObj.parseUrl.path,
			type	: reqObj.method,
			data	: reqObj.parseUrl.query,
			dataType: reqObj.type,
			timeout : 15000,
			cache   : false,
			async   : true,
			beforeSend: function() {
				if (reqObj.fnLoading) {
					reqObj.fnLoading();
				}
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				if (reqObj.fnErr) {
					reqObj.fnErr({
						'status':XMLHttpRequest.status,
						'text'  :textStatus,
						'thrown':errorThrown
					}, reqObj.parseUrl, reqObj.thisObj);
				}
			},
			success: function(data) {
				reqObj.fnSuc(data, reqObj.parseUrl, reqObj.thisObj);
			}
		});
	},
	
	/**
	* URLを解析
	* @param url ex) http://aaa.com/bbb/#/ccc.html#ddd?eee=1&fff=1
	* @return {String} parseUrl.url urlの文字列全体 ex) http://aaa.com/bbb/#/ccc.html#ddd?eee=1&fff=1
	* @return {String} parseUrl.href ルートまでのurlを除去(外部の場合はhttpから) ex) /bbb/#/ccc.html#ddd?eee=1&fff=1
	* @return {String} parseUrl.path /bbb/。index.htmlは除去。トップページの場合は'/'。空の場合は''。 ex) /bbb/
	* @return {String} parseUrl.hashPath #/以降の文字列(#は含まない)。空の場合は'/'。 ex) /ccc.html
	* @return {String} parseUrl.hashAnchor #以降の文字列(#は含まない)。空の場合は''。 ex) ddd
	* @return {String} parseUrl.query ?以降の文字列。空の場合は''。 ex) eee=1&fff=1
	*/
	parseUrl: function(url) {
		var self = this;
		var parseUrl = {};//戻り値を格納
		var host = location.host;
		
		//ルートまでのurlを除去
		var href = url.replace('http://' + host,'').replace('https://' + host,'');
		
		//hashPath:#/から始まる最初の文字列を抜き出す
		var hashPathTmp = href.match(/\#\/[^\?#]*/g);
		var hashPath = (hashPathTmp != null) ? hashPathTmp[0] : '';
		
		//hashAnchor:#から始まる最初の文字列を抜き出す
		var hashAnchorTmp = (href.replace(hashPath,'')).match(/\#[^\?#]*/g);		
		var hashAnchor = (hashAnchorTmp != null) ? hashAnchorTmp[0] : '';
		
		//query:?から始まる最初の文字列を抜き出す
		var queryTmp = href.match(/\?[^\?#]*/g);
		var query = (queryTmp != null) ? queryTmp[0] : '';
		
		//path:/から始まる最初の文字列を抜き出す
		var pathTmp = href.match(/\/[^\?#]*/g);
		var path = (pathTmp != null) ? pathTmp[0] : '';
		
		//成形
		hashPath = hashPath.replace('#/','/');
		hashAnchor = hashAnchor.replace('#','');
		query = query.replace('?','');
		
		//index.html除去
		hashPath = hashPath.replace('/index.html','/');
		path = path.replace('/index.html','/');
		
		if(hashPath == '') { hashPath = '/'; }
		
		parseUrl = {
			host:host,
			url:url,
			href:href,
			path:path,
			hashPath:hashPath,
			hashAnchor:hashAnchor,
			query:query
		};
		
		return parseUrl;
	}

}
