pxcan.instances = [];

//preloading module
(function() {
  var waitingOn = {};
  var numReqs = {};
  var numReqsGlobal = 0;
  
  var imgBank = {};
  
  pxcan.isPreloading = function(pxc) {
    return !!numReqs[pxc.id] || numReqsGlobal > 0;
  }
  
  pxcan.preload = function(src, pxc) {
    //validate
    if(!src) throw new Error("missing source image");
    //only preload something once
    if(pxc) {
      numReqs[pxc.id] |= 0;
    }
    //ignore if already preloaded
    if(imgBank[src]) {
      console.log("note: "+src+" was already preloaded.");
      return;
    }
    //ignore if already preloading
    if(waitingOn[src]) {
      if(!pxc) {
        console.log("note: "+src+" was already requested to be preloaded");
      }
      if(waitingOn[src].indexOf(pxc.id)>=0) {
        console.log("note: "+src+" was already requested to be preloaded by this pxcan");
      }
      else {
        // if requested by second canvas, track that
        console.log("note: "+src+" was already requested to be preloaded by a different pxcan");
        waitingOn[src].push(pxc.id);
        ++numReqs[pxc.id];
      }
      return;
    }
    
    //keep track of who's loading it
    if(pxc) {
      waitingOn[src] = [pxc.id];
      ++numReqs[pxc.id];
    }
    else {
      ++numReqsGlobal;
    }
    //load
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
      if(waitingOn[src]) {
        for(var i = 0; i < waitingOn[src].length; ++i) {
          var pid = waitingOn[src][i];
          var p = pxcan.instances[pid];
          --numReqs[pid];
          if(numReqsGlobal === 0 && !numReqs[pid] && p.onReady) {
            p.onReady.call(p);
            p.onReady = null;
          }
        }
        delete waitingOn[src];
      }
      else if(!pxc) {
        --numReqsGlobal;
        if(numReqsGlobal === 0) {
          for(var pid = 0; pid < pxcan.instances.length; ++pid) {
            var p = pxcan.instances[pid];
            if(!numReqs[pid] && p.onReady) {
              p.onReady.call(p);
              p.onReady = null;
            }
          }
        }
      }
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
  };
})();
