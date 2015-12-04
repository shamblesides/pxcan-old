var pxcan = function(element) {
  // vars
  element = element || window;
  if(typeof(element) === 'string') element = document.querySelector(element);
  var screen = this;
  var mode = { name: 'adapt' };
  var width = element.clientWidth || element.innerWidth;
  var height = element.clientHeight || element.innerWidth;
  var scale = 1;
  var needsRepaint = true;
  var prevDims = null;
  var font = "pxcan-ascii";
  var sheets = {};
  var resourceReqs = 0;
  var _origin = { x: 0, y: 0 };
  var _offset = { x: 0, y: 0 };
  var onReadyFunc = null;
  var onFrameFunc = null;
  
  // create canvas element
  var canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.margin = 'auto';
  // drawing context
  var context = canvas.getContext('2d');
  // if we're adding it to the WINDOW then make sure it is fullscreeny
  if(element == window) {
    var body = document.querySelector('body');
    body.style.padding = 0;
    body.style.margin = 0;
    body.style.overflow = 'hidden';
  }
  // put canvas on page
  ((element !== window)? element: document.getElementsByTagName('body')[0]).appendChild(canvas);
  // make it selectable (if it's not just in the window)
  if(element !== window && element.tabIndex < 0) element.tabIndex = 0;
  
  // public properties
  Object.defineProperty(this, 'element', { get: function() { return element; } });
  Object.defineProperty(this, 'canvas', { get: function() { return canvas; } });
  Object.defineProperty(this, 'context', { get: function() { return context; } });
  Object.defineProperty(this, 'canvasOffX', { get: function() { return 0; } });
  Object.defineProperty(this, 'canvasOffY', { get: function() { return 0; } });
  Object.defineProperty(this, 'left', { get: function() {
    return Math.round(_offset.x - (width * (_origin.x + 1) / 2));
  } });
  Object.defineProperty(this, 'top', { get: function() {
    return Math.round(_offset.y - (height * (_origin.y + 1) / 2));
  } });
  Object.defineProperty(this, 'right', { get: function() { return this.left + width; } });
  Object.defineProperty(this, 'bottom', { get: function() { return this.top + height; } });
  Object.defineProperty(this, 'width', { get: function() { return width; } });
  Object.defineProperty(this, 'height', { get: function() { return height; } });
  Object.defineProperty(this, 'sheets', { get: function() { return sheets; } });
  Object.defineProperty(this, 'drawScale', { get: function() { return scale; } });
  Object.defineProperty(this, 'wasResized', { get: function() { return needsRepaint; } });
  Object.defineProperty(this, 'font', {
    set: function(x) {
      if(!sheets[x]) throw new Error('invalid font: ' + x);
      font = x;
    },
    get: function() {
      if(!font) throw new Error('font has not been set.');
      return font;
    }
  });
  
  this.preload = function(src, alias, w, h) {
    if(!src) throw "missing source image";
    if(!alias) throw "missing alias";
    if(sheets[alias]) throw "sheet already exists with alias " + alias;
    if(pxcan.images[src]) {
      sheets[alias] = new pxcan.Sheet(alias, src, w, h);
      return;
    }
    var img = new Image();
    var imgScales = { 1:document.createElement("canvas") };
    ++resourceReqs;
    img.onload = onLoadedFile;
    img.onerror = function() { throw "Failed to load image " + src; };
    img.src = src;
    
    function onLoadedFile() {
      imgScales[1].width = img.width;
      imgScales[1].height = img.height;
      imgScales[1].getContext('2d').drawImage(img, 0, 0);
      pxcan.images[src] = {
        image: img,
        scaledImage: function(scale) {
          if(imgScales[scale]) return imgScales[scale];
      
          var c = document.createElement("canvas");
          c.width = img.width * scale;
          c.height = img.height * scale;
          var con = c.getContext('2d');
          
          var data = imgScales[1].getContext('2d').getImageData(0,0,img.width,img.height).data;
          var i = 0;
          for(var y = 0; y < img.height; ++y) {
            for(var x = 0; x < img.width; ++x) {
              con.fillStyle = 'rgba('+data[i]+','+data[i+1]+','+data[i+2]+','+data[i+3]+')';
              con.fillRect(x*scale, y*scale, scale, scale);
              i+=4;
            }
          }
          
          imgScales[scale] = c;
          return c;
        }
      };
      sheets[alias] = new pxcan.Sheet(alias, src, w, h);
      --resourceReqs;
      if(resourceReqs === 0 && onReadyFunc) {
        onReadyFunc.call(screen);
        onReadyFunc = null;
      }
    }
  };
  this.preload("data:image/png;base64,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", "pxcan-ascii", 8, 8);
  this.preload("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAhElEQVRIie2WwQrAIAxDU/H/fzk7CdHVwdYWdjCXipQX04NqJIlCdVkbAG5q2EAh3NSQgUJCJxaeAaAm+DqONaEpp22a3mgCrrwmTVG5jIwEj8pM4HKa15WpY3AM/m3AagOrNrglyLouJp4aZF1400u4vmhZJmMa7IiPxvsojH1Y9bflAvhRIjH91XRBAAAAAElFTkSuQmCC", "pxcan-border", 8, 8);
  
  this.onReady = function(func) {
    if(resourceReqs === 0) func.call(screen);
    else onReadyFunc = func;
  }
  
  this.origin = function(x, y) {
    if(arguments.length === 0) return { x: _origin.x, y: _origin.y };
    if(arguments.length === 2) _origin = { x: x, y: y };
    else throw new Error('invalid arguments for origin');
  };
  this.offset = function(x, y) {
    if(arguments.length === 0) return { x: _offset.x, y: _offset.y };
    if(arguments.length === 2) _offset = { x: x, y: y };
    else throw new Error('invalid arguments for offset');
  };
  
  this.mode = function(newMode) {
    // if no arguments are given, treat as getter function
    if(arguments.length === 0) return mode.name;
    // otherwise set appropriately
    if(newMode === 'adapt') {
      mode = { name: 'adapt' };
      scale = arguments[1] || 1;
      canvas.style.width = '';
      canvas.style.height = '';
    }
    else if(newMode === 'fixed') {
      mode = { name: 'fixed' };
      if(arguments.length <= 2) {
        scale = arguments[1] || 1;
        width = Math.floor((element.clientWidth || element.innerWidth) / scale);
        height = Math.floor((element.clientHeight || element.innerHeight) / scale);
      }
      else {
        width = arguments[1];
        height = arguments[2];
        scale = arguments[3] || 1;
      }
      canvas.style.width = '';
      canvas.style.height = '';
    }
    else if(newMode === 'scale-overflow') {
      mode = {
        name: 'scale-overflow',
        minWidth: arguments[1] || element.clientWidth || element.innerWidth,
        minHeight: arguments[2] || element.clientHeight || element.innerHeight
      };
      canvas.style.width = '100%';
      canvas.style.height = '100%';
    }
    else if(newMode === 'scale') {
      throw new Error('not yet supported.');
    }
    else {
      throw new Error('unknown mode type.');
    }
    // reset these
    needsRepaint = true;
    prevDims = null;
    this.fitElement();
  };
  
  this.setSize = function(w, h) {
    if(mode.name === 'fixed' || mode.name === 'scale') {
      width = w;
      height = h;
    }
    else if(mode.name === 'scale-overflow') {
      mode.minWidth = w;
      mode.minHeight = h;
    }
    else {
      throw new Error('screen mode does not support setSize: ' + mode.name);
    }
    this.fitElement();
  };
  
  this.setScale = function(s) {
    if(mode.name === 'adapt' || mode.name === 'fixed') {
      scale = s;
    }
    else {
      throw new Error('screen mode does not support setScale: ' + mode.name);
    }
    this.fitElement();
  };
  
  // screen fitting
  this.fitElement = function() {
    // get the current width/height of the elemnt
    var w = element.clientWidth || element.innerWidth;
    var h = element.clientHeight || element.innerHeight;
    // has it actually changed? if not, no need to fit it.
    needsRepaint = !prevDims || (prevDims.w !== w) || (prevDims.h !== h);
    if(!needsRepaint) return;
    // otherwise, do the correct resize function for the mode
    if(mode.name === 'adapt') fitAdapt(w, h);
    else if(mode.name === 'fixed') fitFixed(w, h);
    else if(mode.name === 'scale-overflow') fitScaleOverflow(w, h);
    // if the view is the whole window, then keep it at the right location
    if(element === window) {
      window.scrollTo(0, 0);
    }
    // record previous dimensions
    prevDims = { w: w, h: h };
  };
  
  function fitAdapt(w, h) {
    // resize canvas to fill window
    canvas.width = (width = Math.floor(w/scale)) * scale;
    canvas.height = (height = Math.floor(h/scale)) * scale;
  }
  
  function fitFixed(w, h) {
    // just resize to the expected dimensions if it's not already that
    if(canvas.width !== width * scale) canvas.width = width * scale;
    if(canvas.height !== height * scale) canvas.height = height * scale;
  }
  
  function fitScaleOverflow(w, h) {
    // if the desired aspect ratio is equal
    if(mode.minWidth * h === mode.minHeight * w) {
      width = mode.minWidth;
      height = mode.minHeight;
    }
    // if it needs to be WIDER
    else if(mode.minWidth * h < mode.minHeight * w) {
      width = Math.floor(w / h * mode.minHeight);
      height = mode.minHeight;
    }
    // if it needs to be TALLER
    else {
      width = mode.minWidth;
      height = Math.floor(h / w * mode.minWidth);
    }
    // draw at a lower scale...
    scale = Math.floor(Math.min(h/height, w/width));
    if(scale < 1) scale = 1; //unless it's smaller than minimum
    canvas.width = width * scale;
    canvas.height = height * scale;
  }
  
  this.fitElement();
};

pxcan.images = {};

pxcan.Panel = function(parent, x, y, w, h, xAnchor, yAnchor) {
  // verify arguments
  if([5,7].indexOf(arguments.length)===-1)
    throw new Error('invalid number of arguments.');
  // vars
  if(arguments.length === 5) {
    xAnchor = parent.origin().x;
    yAnchor = parent.origin().y;
  }
  var font = null;
  var _origin = parent.origin();
  var _offset = parent.offset();
  var screen = parent.screen || parent;
  
  // subcanvas size
  this.canvasOffX = Math.round(parent.canvasOffX + x + parent.width*(parent.origin().x+1)/2 - w*(xAnchor+1)/2);
  this.canvasOffY = Math.round(parent.canvasOffY + y + parent.height*(parent.origin().y+1)/2 - h*(yAnchor+1)/2);
  var width = Math.round(w);
  var height = Math.round(h);
  
  // public properties
  Object.defineProperty(this, 'screen', { get: function() { return screen; } });
  Object.defineProperty(this, 'element', { get: function() { return screen.element; } });
  Object.defineProperty(this, 'canvas', { get: function() { return screen.canvas; } });
  Object.defineProperty(this, 'context', { get: function() { return screen.context; } });
  Object.defineProperty(this, 'left', { get: function() {
    return Math.round(_offset.x - (width * (_origin.x + 1) / 2));
  } });
  Object.defineProperty(this, 'top', { get: function() {
    return Math.round(_offset.y - (height * (_origin.y + 1) / 2));
  } });
  Object.defineProperty(this, 'right', { get: function() { return this.left + width; } });
  Object.defineProperty(this, 'bottom', { get: function() { return this.top + height; } });
  Object.defineProperty(this, 'width', { get: function() { return width; } });
  Object.defineProperty(this, 'height', { get: function() { return height; } });
  Object.defineProperty(this, 'drawScale', { get: function() { return screen.drawScale; } });
  Object.defineProperty(this, 'font', {
    set: function(x) {
      if(!screen.sheets[x]) throw new Error('invalid font: ' + x);
      font = x;
    },
    get: function() { return font || parent.font; }
  });
  // methods
  this.origin = function(x, y) {
    if(arguments.length === 0) return { x: _origin.x, y: _origin.y };
    if(arguments.length === 2) _origin = { x: x, y: y };
    else throw new Error('invalid arguments for origin');
  };
  this.offset = function(x, y) {
    if(arguments.length === 0) return { x: _offset.x, y: _offset.y };
    if(arguments.length === 2) _offset = { x: x, y: y };
    else throw new Error('invalid arguments for offset');
  };
  
};

pxcan.prototype.panel =
pxcan.Panel.prototype.panel = function(x, y, w, h, xAnchor, yAnchor) {
  if(arguments.length === 4)
    return new pxcan.Panel(this, x, y, w, h);
  else if(arguments.length === 6)
    return new pxcan.Panel(this, x, y, w, h, xAnchor, yAnchor);
  else
    throw new Error('invalid number of arguments.');
};