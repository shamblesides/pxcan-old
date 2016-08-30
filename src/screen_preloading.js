//preloading module
(function() {
  var instances = [];
  var waitingOn = {};
  var numReqsFrom = {};
  var numGlobalReqs = 0;
  
  var imgBank = {};

  pxcan.assignId = (function() {
    var lastId = -1;
    return function(inst) {
      instances.push(inst);
      numReqsFrom[lastId+1] = 0;
      return ++lastId;
    };
  })();
  
  pxcan.isPreloading = function(pxc) {
    return !!numReqsFrom[pxc.id] || numGlobalReqs > 0;
  }
  
  pxcan.preload = function(src, pxc) {
    var globalCall = !pxc;
    //validate
    if(!src) throw new Error("missing source image");
    //ignore if already preloaded
    if(imgBank[src]) {
      console.log("note: "+src+" was already preloaded.");
      return;
    }
    //ignore if already preloading
    if(waitingOn[src]) {
      if(globalCall) {
        console.log("note: "+src+" was already requested to be preloaded");
        return;
      }
      if(waitingOn[src].indexOf(pxc)>=0) {
        console.log("note: "+src+" was already requested to be preloaded by this pxcan");
        return;
      }

      // if requested by second canvas, track that
      console.log("note: "+src+" was already requested to be preloaded by a different pxcan");
      waitingOn[src].push(pxc);
      ++numReqsFrom[pxc.id];
      return;
    }
    
    //keep track of who's loading it
    if(globalCall) {
      ++numGlobalReqs;
    }
    else {
      waitingOn[src] = [pxc];
      ++numReqsFrom[pxc.id];
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
        scaledImages: { 1: document.createElement("canvas") }
      };
      imgBank[src].scaledImages[1].width = img.width;
      imgBank[src].scaledImages[1].height = img.height;
      imgBank[src].scaledImages[1].getContext('2d').drawImage(img, 0, 0);

      //launch onReady for any ready pxcans
      if(globalCall) --numGlobalReqs;
      else waitingOn[src].forEach(p => --numReqsFrom[p.id]);

      if(numGlobalReqs > 0) return;
      if(waitingOn[src] && waitingOn[src].every(p => numReqsFrom[p.id])) return;

      var affectedInstances = (globalCall? instances : waitingOn[src]);

      affectedInstances.filter(p => !numReqsFrom[p.id]).forEach(function(p) {
        if(p.onReady) p.onReady.call(p);
        p.onReady = null;
      });
      delete waitingOn[src];
    }
  };
  pxcan.hasImage = function(src) {
    return !!(imgBank[src]);
  };
  pxcan.image = function(src) {
    if(!pxcan.hasImage(src)) throw new Error("invalid image src: "+src);
    return imgBank[src].image;
  };
  //helper to retrieve and create recolored sheets
  pxcan.recolorImage = function(src, colors) {
    if(!imgBank[src]) throw new Error("invalid image src: "+src);
    //id
    var id = src + '@' + colors.join(',');
    //if cached, return its id
    if(imgBank[id]) return id;

    //otherwise let's make it.
    var c = document.createElement("canvas");
    var img = imgBank[src].scaledImages[1];
    c.width = img.width;
    c.height = img.height;
    var ctx = c.getContext('2d');
    
    //0x[alpha][blue][green][red]
    let imgRaw = new Uint32Array(img.getContext('2d').getImageData(0,0,img.width,img.height).data.buffer);
    //indexed color
    let imgColors = [];
    let imgIdx = Array.prototype.map.call(imgRaw, function(x) {
      if((x&0xff000000) === 0) return 0;
      let idx = imgColors.indexOf(x);
      if(idx !== -1) return idx+1;
      imgColors.push(x);
      return imgColors.length;
    });
    //sort indexes
    imgColors = imgColors.map((x,i)=>({ oldIdx: i, brightness: (x & 0xff) + ((x & 0xff00)>>8) + ((x & 0xff0000)>>16) }))
      .sort((a,b)=>a.brightness-b.brightness)
    imgColors.forEach((x,i)=>x.bIdx=i+1);
    imgColors.sort((a,b)=>a.oldIdx-b.oldIdx);

    imgIdx = Array.prototype.map.call(imgIdx, x=>(x===0)?0:(imgColors[x-1].bIdx));
    // imgColors = imgColors.map(x=>x.brightness).sort();

    //TODO reduce color map to fewer colors

    //create sprite
    let i = 0;
    for(let y = 0; y < img.height; ++y) {
      for(let x = 0; x < img.width; ++x) {
        if(imgIdx[i] !== 0) {
          ctx.fillStyle = colors[imgIdx[i]-1];
          ctx.fillRect(x, y, 1, 1);
        }
        ++i;
      }
    }
    
    //cache and return the id
    imgBank[id] = { scaledImages: {1:c} };
    return id;
  }
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
    var ctx = c.getContext('2d');
    
    var data = img.getContext('2d').getImageData(0,0,img.width,img.height).data;
    var i = 0;
    for(var y = 0; y < img.height; ++y) {
      for(var x = 0; x < img.width; ++x) {
        ctx.fillStyle = 'rgba('+data[i]+','+data[i+1]+','+data[i+2]+','+data[i+3]+')';
        ctx.fillRect(x*scale, y*scale, scale, scale);
        i+=4;
      }
    }
    
    //cache and return
    imgBank[src].scaledImages[scale] = c;
    return c;
  };
})();
