// Temporary implementation of COWL's LWorkers atop iframes
//
// Rebasing firefox is taking a bit longer than expected, please come
// back soon for the actual implementation that can handle code that
// is not necessarily honest-but-curious.
//
// Unlike our actual LWorker implementation this can only be used at
// the top-level and while the current label is public.

(function() {
if (!window.LWorker) {
  function LWorker(url, privacy, trust) {
    if (!this instanceof LWorker) {
      return new LWorker(url, privacy,trust);
    }
    if (!url || !/^http[s]?:\/\//.test(url)) {
      throw new Error("Url must be a full path");
    }
    if (privacy && typeof privacy === 'string') {
      privacy = new Label(privacy);
    }
    if (trust && typeof trust === 'string') {
      trust = new Label(trust);
    }

    var self = this;

    self.id = id();
    self.src = lworkerBlobURI(self.id, url, privacy, trust);

    self._iframe         = document.createElement('iframe');
    self._iframe.sandbox = 'allow-scripts allow-forms';
    self._iframe.height  = 0;
    self._iframe.width   = 0;
    self._iframe.style   = 'visibility:hidden; display:none';
    self._iframe.src     = self.src;
    document.body.appendChild(self._iframe);


    window.addEventListener('message', function(event) {
      if (event.data.id && event.data.id == self.id && self._onmessage) {
        self._onmessage(event.data.message);
      }
    });

  }
  window.LWorker = LWorker;
}

LWorker.prototype.postMessage = function(obj) {
  this._iframe.contentWindow.postMessage({id: this.id, message: obj },'*');
}

LWorker.prototype.onmessage = function(obj) {
  this._iframe.postMessage(obj,'*');
}

Object.defineProperty(LWorker.prototype, 'onmessage', {
  get : function() { return this._onmessage; },
  set : function (cb)  { this._onmessage = cb; }
});

function id() {
  var array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0].toString();
};

// -- DO NOT EDIT --
function __workerCode() { /*
<html lang="en">
<head>
<meta charset="utf-8">
<script src="http://cowl.ws/cowl.js"></script>
<script>
COWL.enable();
COWL.privacyLabel = %privacyLabel;
COWL.trustLabel   = %trustLabel;
%clearance

postMessage = function(obj) {
  parent.postMessage({id:%id, message:obj},'*');
};

(function() {
  var _onmessage;
  window.addEventListener('message', function(event) {
    if (event.data.id && event.data.id == %id && _onmessage) {
      _onmessage(event.data.message);
    }
  });
  Object.defineProperty(window, 'onmessage', {
    get : function() { return _onmessage; },
    set : function (cb)  { _onmessage = cb; }
  });
})();

</script>
</head>
<body>
<script src="%src"></script>
</body>
</html>
*/ }
// -- DO NOT EDIT --

function lworkerBlobURI(id, src, privacyClearance, trustClearance) {
  COWL.enable();
  var privacyLabel = showLabel(COWL.privacyLabel);
  var trustLabel   = showLabel(COWL.trustLabel);
  var clearance    = "";

  if (privacyClearance) {
    clearance += 'COWL.privacyClearance = ' +
                  showLabel(opts.privacyClearance) + ';';
  }
  if (trustClearance) {
    clearance += 'COWL.trustClearance = ' +
                  showLabel(opts.trustClearance) + ';';
  }

  var src = __workerCode.toString().replace(/%privacyLabel/g,privacyLabel)
                                   .replace(/%trustLabel/g,trustLabel)
                                   .replace(/%clearance/g,clearance)
                                   .replace(/%id/g,id.toString())
                                   .replace(/%src/g,src)
                                   .split('\n');
  var blob = new Blob([src.splice(1,src.length-2).join('\n')], 
                      {type: 'text/html'});
  return URL.createObjectURL(blob);
}

function showLabel(label) {
  if (label.isEmpty) 
    return 'new Label()';
  label = label.toString();
  var roles = label.toString().replace(/^Label\((.*)\)/,"$1").split(").and(");
  roles.forEach(function(role, idx) {
    role = role.replace(/moz-role:/g,'');
    roles[idx] = "new Role('" +
      role.replace(/^Role\((.*)\)/,"$1").split(").or(").join("').or('") +
      "')";
  });
  return 'new Label('+roles.join(').and(')+')';
}

})();
