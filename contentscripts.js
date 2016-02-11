// GPG4Browsers - An OpenPGP implementation in javascript
// Copyright (C) 2011 Recurity Labs GmbH
// 
// This library is free software; you can redistribute it and/or
// modify it under the terms of the GNU Lesser General Public
// License as published by the Free Software Foundation; either
// version 2.1 of the License, or (at your option) any later version.
// 
// This library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
// Lesser General Public License for more details.
// 
// You should have received a copy of the GNU Lesser General Public
// License along with this library; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA

var msg;
chrome.storage.local.get(['testmsg', 'privkey', 'pubkey', 'name'], function(k) {
  msg = openpgp.read_message(k.testmsg);
  chrome.runtime.sendMessage({action:'decrypt', message: k.testmsg
  }, function(response) {
    //console.log('response', response);
  });
});

var current_message_type = -1;
var current_message = null;

/**
 * searches the given text for a pgp message. If a message is available the openpgp message dialog is shown
 * @param text text to be searched
 */
function find_openpgp(text, obj) {
	text = text.replace(/\r\n/g,"\n");
		if (/-----BEGIN PGP MESSAGE-----/.test(text) && /-----END PGP MESSAGE-----/.test(text)) {
      //var splittedtext = text.split('-----');
      //var block = splittedtext[2].split('\n\n')[1];
			//if (pgp_verifyCheckSum(block))
        return text;
				
		} else if (/-----BEGIN PGP SIGNED MESSAGE-----/.test(text) && /-----END PGP SIGNATURE-----/.test(text)) {
      //var splittedtext = text.split('-----');
      //var block = splittedtext[2].split('\n\n')[1];
			//if (pgp_verifyCheckSum(block))
        return text;
		} else if (/-----BEGIN PGP PUBLIC KEY BLOCK-----/.test(text) && /-----END PGP PUBLIC KEY BLOCK-----/.test(text)) {
      var key = text;
      var title = $(obj).parents('.fbNubFlyoutInner').find('a.titlebarText');
      if (title.length) {
        var name = title[0].href.match(/facebook.com\/(.*)/)[1];
        pubKeys[name] = key;
        var store = {};
        store['pubkey_' + name] = key;
        
        chrome.storage.local.set(store, function(k) {
          if (!enabled[name]) {
            toggle(obj);
          }
        });
        obj.html('Recevied Public Key');
      }
		//	hide_pgp_alert();
		}
}

var doc = null;

/**
 * call routine to open the openpgp.html page for handling a message
 * @return null
 */
function hide_pgp_alert() {
	if (document.getElementById("gpg4browsers_alert") != null) {
		document.getElementById("gpg4browsers_alert").parentNode.removeChild(document.getElementById("gpg4browsers_alert"));
	}
}
function decryptMessage(obj) {
  obj = $(obj);
  var body = obj.html();
  var regex = /(<([^>]+)>)/ig;
  var result = body.replace(/\<br\>/g, '\n')

  result = result.replace(regex, "");
  var pgp_block = find_openpgp(result, obj);


  if (pgp_block) {
    chrome.runtime.sendMessage({action:'decrypt', message: pgp_block
    }, function(response) {
      obj.html("Decrypted: " + response);
      obj.parent().attr('title', pgp_block);
    });
  }
};

/**
 * background process timer to constantly check the displayed page for pgp messages
 */
window.setInterval(function() {
  $('._1nc7 ._5w1r ._5yl5').each(function(i, obj) {
    decryptMessage(obj);
   });
}, 500);

var enabled = {};
function toggle(o) {
  var chat = $(o).parents('.fbNubFlyoutInner');
  var title = chat.find('a.titlebarText');
  if (title.length) {
    var name = title[0].href.match(/facebook.com\/(.*)/)[1];
  }
  if (!enabled[name]){
    chrome.storage.local.get(['pubkey'], function(k) {
    if (!k.pubkey) {
      chrome.runtime.sendMessage({action:'options'}, function(response) {
      });
    } else {
      chrome.storage.local.get(['pubkey_' + name], function(k) {
        console.log(k);
        if (!k['pubkey_' + name]) {
          return;
        } else {
          console.log('asdfa');
          enabled[name] = !enabled[name];
          console.log(chat.find('.pgpon'));
          chat.find('.pgpon').css('display', 'table');
          chat.find('.pgpoff').css('display', 'none');
        }
      });
      }
    });
  } else {
    console.log('off');
    enabled[name] = !enabled[name];
    chat.find('.pgpoff').css('display', 'table');
    chat.find('.pgpon').css('display', 'none');
  }
}
var chats = {}, pubKeys = {};
function init_chats() {
  var chats = $(".fbNubFlyoutInner");
  chats.each(function(i, c) {
    init_chat(c);
  });
}
function send_pub(e) {
  chrome.storage.local.get(['pubkey'], function(k) {
    if (!k.pubkey) {
      chrome.runtime.sendMessage({action:'options'}, function(response) {
      });
    } else {
      $(e).parents('.fbNubFlyoutFooter').find('._5rpu').focus().sendkeys(' {Backspace}');
      $(e).parents('.fbNubFlyoutFooter').find('[data-text=true]').parent().html('<span data-text=true>' + k.pubkey + '</span>');
      $(e).parents('.fbNubFlyoutFooter').find('._5rpu').focus().sendkeys(' {Backspace}');
    }
  });
}
function init_chat(c) {
  if ($(c).hasClass('pgp')) {
    return;
  }
  var title = $(c).find('a.titlebarText');
  if (title.length) {
    var name = title[0].href.match(/facebook.com\/(.*)/)[1];
      $(c).addClass('pgp');
      $(c).find('.fbNubFlyoutFooter').children().last().append($('<span style="cursor:pointer;display:table;" class="_552o"><img title="Share public key" style="cursor:pointer;vertical-align:middle;display:table-cell;padding-top: 4px;padding-left:10px;" src="'+chrome.extension.getURL("lock.png")+'" height ="15px" /></span>').click(function() {
        send_pub(this);
      }));
      $(c).find('.fbNubFlyoutFooter').children().last().append($('<span style="cursor:pointer;display:table;" class="pgpoff _552o"><img title="Enable encryption" style="cursor:pointer;vertical-align:middle;display:table-cell;     padding-top: 4px;padding-left:10px;" src="'+chrome.extension.getURL("lock_red.png")+'" height ="15px" /></span>').click(function() {
        toggle(this);
      }));
      $(c).find('.fbNubFlyoutFooter').children().last().append($('<span style="cursor:pointer;display:none;" class="pgpon _552o"><img title="Disable encryption" style="cursor:pointer;vertical-align:middle;display:table-cell;     padding-top: 4px;padding-left:10px;" src="'+chrome.extension.getURL("lock_green.png")+'" height ="15px" /></span>').click(function() {
        toggle(this);
      }));
    chrome.storage.local.get(['pubkey_' + name], function(k) {
      if (!k['pubkey_' + name]) {
        return;
      } else {
        if (!enabled[name]) {
          toggle($(c).children().first());
        }
      }

    });
    
  }
}
var fubAmount = 0;
$(document).ready(function() {
    setInterval(function(){
      init_chats();
    }, 1000);
});
var encrypted = false;
document.addEventListener('keydown', function(evt){
  var title = $(evt.target).parents('.fbNubFlyoutInner').find('a.titlebarText');
  if (title.length) {
    var name = title[0].href.match(/facebook.com\/(.*)/)[1];
  }
  if (!enabled[name]) {
    return true;
  }
  var input = $(evt.target);
  if (input.attr('role') == 'textbox' && evt.keyCode == 13) {
    if (!encrypted) {
      var plain = input.find('[data-text=true]').html();
      if (plain.length == 0) {
        return false;
      }
      if (pubKeys[name]) {
        chrome.runtime.sendMessage({action:'encrypt', pub_key: pubKeys[name], message: plain}, function(response) {
          input.find('[data-text=true]').parent().html(response);
          $(evt.target).parents('.fbNubFlyoutFooter').find('._5rpu').focus().sendkeys(' {Backspace}');
        });
        encrypted = true;
        evt.stopPropagation();
        evt.preventDefault();
        return false;
      } else {
        return true;
      }
    }
    else {
      encrypted = false;
      return true;
    }
  }

}, true);

/**
 * verifies the checksum of an base64 encrypted pgp block
 * @param text containing the base64 block and the base64 encoded checksum
 * @return true if the checksum was correct, false otherwise
 */
function pgp_verifyCheckSum(text) {	
  var split = text.split('=')
	var data = r2s(split[0]);
	var checksum = split[split.length-1].replace(/\n/g,"");
	var c = getCheckSum(data);
	var d = checksum;
	return c[0] == d[0] && c[1] == d[1] && c[2] == d[2];
}

/**
 * calculates the checksum over a given block of data
 * @param data block to be used
 * @return a string containing the base64 encoded checksum
 */
function getCheckSum(data) {
	var c = createcrc24(data);
	var str = "" + String.fromCharCode(c >> 16)+
				   String.fromCharCode((c >> 8) & 0xFF)+
				   String.fromCharCode(c & 0xFF);
	return s2r(str);
}


/**
 * calculation routine for a CRC-24 checksum
 * @param data
 * @return 
 */
function createcrc24 (data) {
	var crc = 0xB704CE;
	var i;
	var mypos = 0;
	var len = data.length;
	while (len--) {
		crc ^= (data[mypos++].charCodeAt()) << 16;
		for (i = 0; i < 8; i++) {
			crc <<= 1;
			if (crc & 0x1000000)
            	crc ^= 0x1864CFB;
        }
    }
    return crc & 0xFFFFFF;
}

// base64 implementation

var b64s = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Converting Base64 data to a string
 * @param t base64 encoded data string
 * @return data string
 */
function r2s(t) {
	var c, n;
	var r = '', s = 0, a = 0;
	var tl = t.length;

	for (n = 0; n < tl; n++) {
		c = b64s.indexOf(t.charAt(n));
		if (c >= 0) {
			if (s)
				r += String.fromCharCode(a | (c >> (6 - s)) & 255);
			s = (s + 2) & 7;
			a = (c << s) & 255;
		}
	}
	return r;
}

/**
 * Converting a data string to a base64 encoded string
 * @param t data string
 * @return base64 encoded data string
 */
function s2r(t) {
	var a, c, n;
	var r = '', l = 0, s = 0;
	var tl = t.length;

	for (n = 0; n < tl; n++) {
		c = t.charCodeAt(n);
		if (s == 0) {
			r += b64s.charAt((c >> 2) & 63);
			a = (c & 3) << 4;
		} else if (s == 1) {
			r += b64s.charAt((a | (c >> 4) & 15));
			a = (c & 15) << 2;
		} else if (s == 2) {
			r += b64s.charAt(a | ((c >> 6) & 3));
			l += 1;
			if ((l % 60) == 0)
				r += "\n";
			r += b64s.charAt(c & 63);
		}
		l += 1;
		if ((l % 60) == 0)
			r += "\n";

		s += 1;
		if (s == 3)
			s = 0;
	}
	if (s > 0) {
		r += b64s.charAt(a);
		l += 1;
		if ((l % 60) == 0)
			r += "\n";
		r += '=';
		l += 1;
	}
	if (s == 1) {
		if ((l % 60) == 0)
			r += "\n";
		r += '=';
	}

	return r;
}
