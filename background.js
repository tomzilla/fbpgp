$(function() {

openpgp.init();
function rfn(result) {
	if (result == -2)
		util.print_warning("unable to decrypt message: no private key available");
	else if (result == -1)
		util.print_error("No valid passphrase supplied");
	else if (result == -3)
		util.print_error("unable to decrypt message: error during decryption");
	else {
    console.log(result);
	}		
}
var privKey;
chrome.storage.local.get('privkey', function(k) {
  if (k) {
    privKey = k.privkey;
  } 
  if (!k.priv) {
    chrome.tabs.create({url: "options.html"});
  }
});
openpgp.init();
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action === 'encrypt') {
      sendResponse(openpgp.write_encrypted_message(openpgp.read_publicKey(request.pub_key), request.message));
    } else if (request.action === 'decrypt') {
      if (privKey) {
        var priv_key = openpgp.read_privateKey(privKey);
        var msg = openpgp.read_message(request.message);
        var keymat = null;
        var sesskey = null;
        // Find the private (sub)key for the session key of the message
        for (var i = 0; i< msg[0].sessionKeys.length; i++) {
          if (priv_key[0].privateKeyPacket.publicKey.getKeyId() == msg[0].sessionKeys[i].keyId.bytes) {
            keymat = { key: priv_key[0], keymaterial: priv_key[0].privateKeyPacket};
            sesskey = msg[0].sessionKeys[i];
            break;
          }
          for (var j = 0; j < priv_key[0].subKeys.length; j++) {
            if (priv_key[0].subKeys[j].publicKey.getKeyId() == msg[0].sessionKeys[i].keyId.bytes) {
              keymat = { key: priv_key[0], keymaterial: priv_key[0].subKeys[j]};
              sesskey = msg[0].sessionKeys[i];
              break;
            }
          }
        }
        if (keymat != null) {
          console.log('key found', keymat);
          if (!keymat.keymaterial.decryptSecretMPIs('')) {
            alert("Password for secrect key was incorrect!");
            return;

          }

          sendResponse(msg[0].decrypt(keymat, sesskey));
        } else {
          console.log("No private key found!");
        }
        
        return false;
      }
    } else if (request.action === 'options') {
      chrome.tabs.create({url: "options.html"});
    }
  });

});
