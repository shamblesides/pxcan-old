nigelgame.json = {};

nigelgame.loadJSON = function(reqs, callback) {
  var numRequested = 0;
  var numLoaded = 0;
  
  for(var i = 0; i < reqs.length; ++i) {
    if(!reqs[i].src) throw "missing json source filename";
    if(!reqs[i].alias) throw "missing alias";
    if(nigelgame.json[reqs[i].alias]) {
      var oldobj = nigelgame.sheets[reqs[i].alias];
      throw "Duplicate alias for " + oldobj.alias + "(" + oldobj.src + ", " + reqs[i].src + ")";
    }
    doLoadJSON(reqs[i]);
  }
  if(numRequested === 0) {
    callback();
  }
  function doLoadJSON(req) {
    var xht = new XMLHttpRequest();
    xht.open('GET', req.src);
    xht.overrideMimeType('application/json');
    xht.onloadend = onLoadedFile;
    xht.onerror = function() {
      throw "Error loading JSON file: " + req.src;
    }
    xht.ontimeout = function() {
      throw "Request timed out: " + req.src;
    }
    xht.send();
    ++numRequested;
    
    function onLoadedFile() {
      nigelgame.json[req.alias] = JSON.parse(xht.response);
      ++numLoaded;
      if(numLoaded >= numRequested) {
        callback();
      }
    }

  }
};