
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
CryptBro.server = (CryptBro.server || {});

(function(){

    var _this = this;

    SSRPC.onError(function(error) {
	    console.log('error: ', error.name, error.message);
	});

    SSRPC.onInfo(function(info) {
	    console.log('info: ', info.name, info.message);
	});

    SSRPC.onWarn(function(warn) {
	    console.log('warn: ', warn.name, warn.message);
	});

    SSRPC.onData(function(data) {
	    console.log('data: ', data.name, data.message);
	});    

    _this._serverUrl = 'cryptbro.server.php';

    CryptBro.server.url = function(url) {
	if (url !== undefined) {
	    _this._serverUrl = url;
	}
	return _this._serverUrl;
    };

    CryptBro.server.hello = function() {
	SSRPC.cmd('hello', {info: 'CryptBro, v0.8 beta (embryo build)'}, _this._serverUrl);
    };

    CryptBro.server.login = function(user, pass) {
	SSRPC.cmd('login', {user: user, pass: pass}, _this._serverUrl);
    };

    CryptBro.server.logout = function() {
	SSRPC.cmd('logout', '', _this._serverUrl);
    };

    CryptBro.server.register = function(user, pass, email) {
	SSRPC.cmd('register', {user: user, pass: pass, email: email}, _this._serverUrl);
    };

    CryptBro.server.updateInfo = function(pass, email) {
	SSRPC.cmd('updateInfo', {pass: pass, email: email}, _this._serverUrl);
    };

    CryptBro.server.save = function(message, expires, to) {
	SSRPC.cmd('save', {message: message, expires: expires, to: to}, _this._serverUrl);
    };

    CryptBro.server.retrieve = function(id, progress) {
	SSRPC.cmd('retrieve', {id: id}, _this._serverUrl, undefined, progress);
    };

    CryptBro.server.inbox = function() {
	SSRPC.cmd('inbox', '', _this._serverUrl);
    };

})();
