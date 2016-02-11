$(function() {
  chrome.storage.local.get(['testmsg', 'privkey', 'pubkey', 'name'], function(k) {
    openpgp.init();
    $('#priv').text(k.privkey);
    $('#pub').text(k.pubkey);
    $('#fb_name').val(k.name)
  });
  $('.success').hide();
  $('#upload').click(function() {
    $.post('https://pgp.mit.edu/pks/add', {
      keytext: $('#pub').text()
    }, function(data) {
      if (data.indexOf('successfully') != -1) {
        $('.success').show();
        setTimeout(function() {
          $('.success').slideUp();
        }, 5000);
      }
    }
    );
  });
$('#generate').click(function() {
    openpgp.init();
    var keys = openpgp.generate_key_pair(1, 512, 'fbpgp_' + $('#fb_name').val() + ' <' + $('#fb_name').val() + '@facebook.com>', '');
    $('#priv').text(keys.privateKeyArmored);
    $('#pub').text(keys.publicKeyArmored);
    var pub_key = openpgp.read_publicKey($('#pub').text());
    var testmsg = openpgp.write_encrypted_message(pub_key, 'hello');
    chrome.storage.local.set({'privkey': $('#priv').text(), pubkey: $('#pub').text(), name: $('#fb_name').val(), testmsg: testmsg}, function() {
    });
    return false;
});

  


});


