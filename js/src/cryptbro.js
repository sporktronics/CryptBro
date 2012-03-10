
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

(function() {

    var _this = this;

    CryptBro.version = "1.0 Release Candidate 1 (2012030901)";
    
    // Encrypts a message.
    // Takes the key and the plaintext, returns the ciphertext. Runs
    //    asynchronously if a handler function is given.
    CryptBro.encrypt = function(key, message, handler, progress) { 

	if (!handler) {
	    var stretched = _this._stretchKey(key);
	    return doEnc(stretched.key, message, stretched.salt);
	} else {
	    _this._stretchKey(key, undefined,
			function(result) {
			    handler(doEnc(result.key, message, result.salt));
			}, progress);
	    return true;
	}
	
	// Actually performs the encryption. Returned string is a
	// stringified object, base64-encoded.
	function doEnc(key, message, salt) {

	    var enc  = Crypto.AES.encrypt(message, key);
	    var hmac = _this._hmac(key, enc);

	    var result = {
		m: enc,
		s: salt,
		h: hmac
	    };

	    return _this._encode(result);		
	}

    };

    // Takes an object, returns a stringified, base64-encoded version.
    _this._encode = function(dec) {
	// return btoa(JSON.stringify(dec));
	return window.btoa(Deflate.deflate(JSON.stringify(dec)));
    };

    // Takes the output of _encode, returns an object.
    _this._decode = function(enc) {
	try {
	    // return JSON.parse(atob(enc));
	    return JSON.parse(Deflate.inflate(window.atob(enc)));
	} catch (e) {
	    throw new Error("Input is in wrong format");
	    return JSON.parse('{}');
	}
    };

    // Decrypts a message.
    // Takes the key and the ciphertext, returns the plaintext. Runs
    //    asynchronously if a handler function is given.
    CryptBro.decrypt = function(key, message, handler, progress) {

	try {
	    var dec = _this._decode(message);
	    var message = dec.m;
	    var salt = dec.s;
	    
	    // Actually does the decryption. Returns the plaintext, or
	    // false if HMAC is wrong.
	    var doDec = function(key, message) {
		var hmac = _this._hmac(key, message); 
		
		if (hmac != dec.h) {
		    return false;
		}
		
		return Crypto.AES.decrypt(message, key);
	    }

	    if (!handler) {
		var stretched = _this._stretchKey(key, salt);
		return doDec(stretched.key, message, salt);
	    } else {
		_this._stretchKey(key, salt,
				  function(result) {
				      handler(doDec(result.key, message));
				  }, progress);
	    }
	    
	} catch(e) {
	    throw e;
	}
    };

    // Takes a key and a message, returns an HMAC hash.
    _this._hmac = function(key, message) {
	return Crypto.util.bytesToBase64(Crypto.HMAC(Crypto.SHA1, message, key, {
		    asBytes: true}));
    };

    // Stretches a key using PBKDF2.
    // Takes the key and an optional salt, returns an object
    //    containing the stretched key and the salt. Runs
    //    asynchronously if a handler function is given, and
    //    optionally takes a function to handle progress updates.
    _this._stretchKey = function(key, salt, handler, progress) {
	
	var iterations = 20;

	if (!salt) {
	    salt = Crypto.util.randomBytes(16);
	} else {
	    salt = Crypto.util.base64ToBytes(salt);
	}

	if (!handler) {	
	    key = Crypto.PBKDF2(key, salt, 64, { iterations: iterations });
	    key = Crypto.util.bytesToBase64(Crypto.util.hexToBytes(key));
	    return { "key": key, "salt": Crypto.util.bytesToBase64(salt) };
	} else {
	    Crypto.PBKDF2Async(key, salt, 64,
			       function(result) {
				   result = Crypto.util.bytesToBase64(
						          Crypto.util.hexToBytes(result));
				   handler({
					   "key": result,
					   "salt": Crypto.util.bytesToBase64(salt)
				       });
			       }, { iterations: iterations, onProgressChange: progress });
	    return true;
	};
	
    };
    
    CryptBro.util = {
	encode: _this._encode,
	decode: _this._decode
    };

})();