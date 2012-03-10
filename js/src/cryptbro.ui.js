
/*

  #### #### #  # #### ##### ###  #### ####
  #    #  # #  # #  #   #   #  # #  # #  #
  #    #  # #### #  #   #   ###  #  # #  #
  #    ###     # ####   #   #  # ###  #  #
  #### # ## #### #      #   ###  # ## ####

  (c) 2012 Sporktronics, LLC
  http://www.sporktronics.com/

  Licensed under the GNU GPL, version 2
  http://www.gnu.org/licenses/gpl-2.0.html

*/

var CryptBro = (CryptBro || {});
CryptBro.ui = (CryptBro.ui || {});

(function(){
    
    var _this = this;

    CryptBro.server.hello();	    

    _this._loggedInUser = undefined;
    _this._hash = window.location.hash;
    _this._lastHash = null;
    _this._ignoreNextHash = false;
    _this._messageHash = (window.location.hash || '');

    if ((_this._messageHash.substr(0,3) !== '#l!') &&
	(_this._messageHash.substr(0,3) !== '#b!')) {
	
	_this._messageHash = undefined;
	window.location.hash = '';
    }

    $.mobile.ajaxEnabled = false;
    $.mobile.hashListeningEnabled = false;

    CryptBro.ui.page = function(page) {
	$.mobile.changePage('#'+page, { changeHash: false });
	$('input#key').val('');
	if (page === 'message') {
	    window.location.hash = _this._messageHash || '';
	} else {
	    window.location.hash = '#'+page;
	    if (page == 'inbox') {
		CryptBro.ui.loadingMsg('loading');
		CryptBro.server.inbox();
	    }
	}
    };

    CryptBro.ui.getCryptMethod = function() {
	return $('button#encrypt[data-theme="b"], button#decrypt[data-theme="b"]').first().attr('id');
    };

    CryptBro.ui.setCryptMethod = function(method) {
	if (CryptBro.ui.getCryptMethod() !== method) {
	    CryptBro.ui.cryptToggle();
	}
    };

    CryptBro.ui.cryptToggle = function() {

	$('div#cryptmethod div[data-theme="a"]').attr('data-theme','c')
	.removeClass('ui-btn-up-a').addClass('ui-btn-up-b');

	$('div#cryptmethod div[data-theme="b"]').attr('data-theme','a')
	.removeClass('ui-btn-up-b').addClass('ui-btn-up-a');

	$('div#cryptmethod div[data-theme="c"]').attr('data-theme','b');

	$('div#cryptmethod button[data-theme="a"]').attr('data-theme','c');
	$('div#cryptmethod button[data-theme="b"]').attr('data-theme','a');
	$('div#cryptmethod button[data-theme="c"]').attr('data-theme','b');

	$('div#cryptmethod button').off('click');
	$('div#cryptmethod button[data-theme="a"]').click(CryptBro.ui.cryptToggle);

    };
    
    CryptBro.ui.loadingMsg = function(msg) {
	$.mobile.showPageLoadingMsg('a', msg, true);
	$('.ui-loader-textonly').removeClass('ui-loader-textonly');
    };

    CryptBro.ui.doRetrieve = function() {
	if (_this._hash.substr(0,3) === '#l!') {
	    _this._messageHash = _this._hash;
	    if (_this._loggedInUser === undefined) {
		CryptBro.ui.page('login');
	    } else {
		_this._retrieve(_this._hash.substr(3));
	    }
	} else if (_this._hash.substr(0,3) === '#b!') {
	    _this._retrieve(_this._hash.substr(3));
	}
    };

    _this._retrieve = function(id) {
	_this._messageHash = _this._hash;
	CryptBro.ui.loadingMsg('retrieving');
	CryptBro.server.retrieve(_this._hash.substr(3), function(progress){
		pct = Math.round((progress.loaded / progress.total)*100);
		$.mobile.loadingMessage = 'retrieving ('+pct+'%)';
		$('.ui-loader.ui-body-a h1').text($.mobile.loadingMessage);
	    });
    };

    CryptBro.ui.doSave = function() {

	var message = CryptBro.ui.getMessage();
	var options = CryptBro.ui.getOptions();

	if (message.message && options.save) {
	    CryptBro.ui.loadingMsg('saving');
	    CryptBro.server.save(message.message, options.expires, message.to);
	}
    };

    CryptBro.ui.doCrypt = function() {

	var method = CryptBro.ui.getCryptMethod();
	var message = CryptBro.ui.getMessage();

	if (message.key && message.message) {
	    
	    CryptBro.ui.loadingMsg(method+'ing');
	    
	    try {
		CryptBro[method](message.key, message.message,
				 function(crypted) {
				     $.mobile.hidePageLoadingMsg();

				     if (crypted) {
					 $('textarea#message').val(crypted);
					 $('textarea#message').keyup();
					 
					 if (method === 'encrypt') {
					     CryptBro.ui.doSave();
					 }
					 
					 CryptBro.ui.cryptToggle();
				     } else {
					 CryptBro.ui.error('Wrong key');
				     }
				 }, function(pct) {
				     $.mobile.loadingMessage = method+'ing ('+pct+'%)';
				     $('.ui-loader.ui-body-a h1').text($.mobile.loadingMessage);
				 });
	    } catch(e) {
		$.mobile.hidePageLoadingMsg();
		CryptBro.ui.error(e);
	    }
	} else {
	    CryptBro.ui.error('Need a key and a message to '+method);
	}

	return false;

    };

    CryptBro.ui.doReset = function() {
	$('input[type="text"], input[type="password"], textarea').val('');
	$.mobile.changePage('#message', { changeHash: false });
	window.location.hash = '';
	_this._messageHash = undefined;
	CryptBro.ui.setCryptMethod('encrypt');
    };

    CryptBro.ui.getMessage = function() {
	return {
	    key: ($('input#key').val() === '' ? undefined : $('input#key').val()),
	    to: ($('input#to').val() === '' ? undefined : $('input#to').val()),
	    message: ($('textarea#message').val() === '' ? undefined : $('textarea#message').val())
	};
    };

    CryptBro.ui.getOptions = function() {
	return {
	    save: ($('select#save').val() === 'yes'),
	    expires: parseInt($('select#expire').val())
	};
    };

    window.setInterval(function(){
	    if (_this._hash !== _this._lastHash) {
		console.log('New hash: "'+_this._hash+'"');
		if (_this._ignoreNextHash) {
		    _this._ignoreNextHash = false;
		    console.log('Ignoring this hash');
		} else {
		    CryptBro.ui.doRetrieve();		
		}
	    }
	    _this._lastHash = _this._hash;
	    _this._hash = window.location.hash;
	    
	}, 100);
    
    head.ready(function() {
	    $("[data-role=footer]").fixedtoolbar({ tapToggle: false });
	    $('input#loginbutton').click(CryptBro.ui.login);
	    $('input#registerbutton').click(CryptBro.ui.register);
	    $('div#cryptmethod button[data-theme="a"]').click(CryptBro.ui.cryptToggle);
	    $('button#crypt').click(CryptBro.ui.doCrypt);
	    $('button#reset').click(CryptBro.ui.doReset);
	    $('form#crypt').submit(CryptBro.ui.doCrypt);
	    $('body.loading').removeClass('loading').addClass('ui-body-a');
	    $('div#version').text("CryptBro "+CryptBro.version);
	});
    
    CryptBro.ui.getLoggedInUser = function() {
	return _this._loggedInUser;
    };

    CryptBro.ui.error = function(message) {
	
	$( "<div class='ui-loader ui-corner-all ui-body-d ui-loader-verbose ui-loader-textonly error'><h1>"+ message +"</h1></div>" )
	.css({ "display": "block", "opacity": 0.96, "top": $(window).scrollTop() + 100 })
	.appendTo('body')
	.delay( 2500 )
	.fadeOut( 400, function() {
		$(this).remove();
	    });
    };

    CryptBro.ui.info = function(message) {
	
	$( "<div class='ui-loader ui-corner-all ui-body-e ui-loader-verbose ui-loader-textonly info'><h1>"+ message +"</h1></div>" )
	.css({ "display": "block", "opacity": 0.96, "top": $(window).scrollTop() + 100 })
	.appendTo('body')
	.delay( 2500 )
	.fadeOut( 400, function() {
		$(this).remove();
	    });
    };

    CryptBro.ui.login = function() {
	CryptBro.server.login($('input#username').val(), $('input#password').val());
	return false;
    };

    CryptBro.ui.register = function() {
	if ($('input#rusername').val() && $('input#rusername').val() && $('input#rusername').val()) {
	    if ($('input#password1').val() === $('input#password2').val()) {
		CryptBro.server.register($('input#rusername').val(), $('input#password1').val(), $('input#email').val());
	    } else {
		CryptBro.ui.error('Passwords must match');
	    }
	} else {
	    CryptBro.ui.error('Fill in all fields');
	}
	return false;
    };

    CryptBro.ui.logout = function() {
	CryptBro.server.logout();
	return false;
    };

    CryptBro.ui.onLogin = function(username) {
	_this._loggedInUser = username;

	CryptBro.ui.page('message');

	$('.loggedout').hide();
	$('.loggedin').show();
	$('span.loginbutton').text('Logout');
	$('a.login').click(CryptBro.ui.logout);
	$('input[type="text"], input[type="password"], textarea').val('');
    };

    CryptBro.ui.onLogout = function(reset) {

	reset = (reset === undefined ? true : reset);

	_this._loggedInUser = undefined;
	$('.loggedin').hide();
	$('.loggedout').show();
	$('span.loginbutton').text('Login');
	$('a.login').off('click');

	if (reset) {
	    CryptBro.ui.doReset();
	}
    };

    CryptBro.ui.msg = function(msg) {

	window.location.hash = msg;
	CryptBro.ui.doRetrieve();

    };

    CryptBro.ui.createInbox = function(data) {	

	var list = $('<ul data-role="listview" data-theme="a" data-divider-theme="d"></ul>');
	
	var keys = new Array();
	
	for (id in data) {
	    keys.push(id);
	};

	var keysSorted = keys.sort(function(a,b){
		return (data[a].date > data[b].date);
	    });

	for (id in keysSorted) {

	    var date = new Date(data[keysSorted[id]].date*1000);
	    var dateString =  date.toLocaleDateString() + ' &mdash; '+((((date.getHours()) % 12) > 0) ? ((date.getHours()) % 12) : 12)
		+':'+(date.getMinutes()<10 ? '0'+date.getMinutes() : date.getMinutes())+' '+((date.getHours()-12) < 0 ? 'AM' : 'PM');

	    if (data[keysSorted[id]].to === undefined) {
		list.prepend('<li><a href="javascript:CryptBro.ui.msg(\'#b!'+keysSorted[id]+'\')"><h3>'+dateString+'</h3><p>From: <b>'+data[keysSorted[id]].from+'</b> &#9654; <i>Anonymous</i></p></a></li>');
	    } else {
		list.prepend('<li><a href="javascript:CryptBro.ui.msg(\'#l!'+keysSorted[id]+'\')"><h3>'+dateString+'</h3><p>From: <b>'+data[keysSorted[id]].from+'</b> &#9654; To: <b>'+data[keysSorted[id]].to+'</b></p></a></li>');
	    }
	}
	return list;

    };

    SSRPC.onData(function(data) {
	    
            $.mobile.hidePageLoadingMsg();

	    switch(data.name) {

	    case 'login':
		CryptBro.ui.onLogin(data.message);
		break;
	    case 'logout':
		if (data.message == 'notLoggedIn') {
		    CryptBro.ui.onLogout(false);
		} else {
		    CryptBro.ui.onLogout();
		}
		break;
	    case 'register':
		CryptBro.ui.page('login');
		break;
	    case 'retrieve':
		CryptBro.ui.setCryptMethod('decrypt');
		$('textarea#message').val(data.message.message);
		$('textarea#message').keyup();
		if (_this._loggedInUser !== undefined) {
		    if ((data.message.to !== undefined) && (data.message.to !== _this._loggedInUser)) {
			$('input#to').val(data.message.to);
		    } else if((data.message.from !== undefined) && (data.message.from !== _this._loggedInUser)) {
			$('input#to').val(data.message.from);
		    }
		}
		$.mobile.changePage('#message', { changeHash: false });
		break;
	    case 'save':
		var message = CryptBro.ui.getMessage();
		_this._ignoreNextHash = true;
		if (message.to) {
		    window.location.hash = '#l!'+data.message;
		} else {
		    window.location.hash = '#b!'+data.message;
		}
		break;
	    case 'inbox':
		$('div#inboxmessages').html(CryptBro.ui.createInbox(data.message));
		$('div#inboxmessages ul').listview()
		break;
	    case 'hello':
		break;
	    default:
		CryptBro.ui.info('Unhandled data: '+data.name);
		break;		
	    }

	});

    SSRPC.onError(function(error) {
            $.mobile.hidePageLoadingMsg();
	    CryptBro.ui.error(error.message);
	});

    SSRPC.onWarn(function(error) {
            $.mobile.hidePageLoadingMsg();
	    CryptBro.ui.error(error.message);
	});

    SSRPC.onInfo(function(info) {
            $.mobile.hidePageLoadingMsg();
	    CryptBro.ui.info(info.message);
	});

})();