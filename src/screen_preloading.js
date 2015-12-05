//give pxcan a unique id
(function() {
  var nextId = 0;
  
  Object.defineProperty(pxcan.prototype, "__id", { writable: true })
  Object.defineProperty(pxcan.prototype, "id", { get: function() {
    if (this.__id == undefined) this.__id = nextId++;
    return this.__id;
  } });
})();

//preloading module
(function() {
  var waitingOn = {};
  var numReqs = {};
  var pxcans = {};
  
  var imgBank = {};
  
  pxcan.isPreloading = function(pxc) {
    return !!(numReqs[pxc.id]);
  }
  
  pxcan.preload = function(src, pxc) {
    //validate
    if(!src) throw new Error("missing source image");
    //only preload something once
    if(pxc) {
      numReqs[pxc.id] |= 0;
      pxcans[pxc.id] = pxc;
    }
    if(imgBank[src]) {
      console.log("note: "+src+" was already preloaded.");
      return;
    }
    if(waitingOn[src]) {
      if(!pxc) {
        console.log("note: "+src+" was already requested to be preloaded");
      }
      if(waitingOn[src].indexOf(pxc.id)>=0) {
        console.log("note: "+src+" was already requested to be preloaded by this pxcan");
      }
      else {
        console.log("note: "+src+" was already requested to be preloaded by a different pxcan");
        waitingOn[src].push(pxc.id);
        ++numReqs[pxc.id];
      }
      return;
    }
    else {
      waitingOn[src] = [pxc.id];
    }
    
    //load image
    if(pxc) ++numReqs[pxc.id];
    var img = new Image();
    img.onload = onLoadedFile;
    img.onerror = function() { throw new Error("Failed to load image " + src); };
    img.src = src;
    
    function onLoadedFile() {
      //populate imagebank
      imgBank[src] = {
        image: img,
        scaledImages: {
          1: document.createElement("canvas")
        }
      };
      imgBank[src].scaledImages[1] = document.createElement("canvas");
      imgBank[src].scaledImages[1].width = img.width;
      imgBank[src].scaledImages[1].height = img.height;
      imgBank[src].scaledImages[1].getContext('2d').drawImage(img, 0, 0);
      //alert pxcans
      for(var i = 0; i < waitingOn[src].length; ++i) {
        var pid = waitingOn[src][i];
        --numReqs[pid];
        if(numReqs[pid] === 0 && pxcans[pid].onReady) {
          var p = pxcans[pid];
          p.onReady.call(p);
          p.onReady = null;
          delete pxcans[pid];
        }
      }
      delete waitingOn[src];
    }
  };
  pxcan.hasImage = function(src) {
    return !!(imgBank[src]);
  };
  pxcan.image = function(src) {
    if(!imgBank[src]) throw new Error("invalid image src: "+src);
    return imgBank[src].image;
  };
  //helper to retrieve and create resized images
  pxcan.scaledImage = function(src, scale) {
    if(!imgBank[src]) throw new Error("invalid image src: "+src);
    //if cached, return it
    if(imgBank[src].scaledImages[scale]) return imgBank[src].scaledImages[scale];
  
    //otherwise here's how we make it
    var c = document.createElement("canvas");
    var img = imgBank[src].scaledImages[1];
    c.width = img.width * scale;
    c.height = img.height * scale;
    var con = c.getContext('2d');
    
    var data = img.getContext('2d').getImageData(0,0,img.width,img.height).data;
    var i = 0;
    for(var y = 0; y < img.height; ++y) {
      for(var x = 0; x < img.width; ++x) {
        con.fillStyle = 'rgba('+data[i]+','+data[i+1]+','+data[i+2]+','+data[i+3]+')';
        con.fillRect(x*scale, y*scale, scale, scale);
        i+=4;
      }
    }
    
    //cache and return
    imgBank[src].scaledImages[scale] = c;
    return c;
  }
})();
