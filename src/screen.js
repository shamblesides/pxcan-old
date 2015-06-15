nigelgame.Screen = function(element, mode, mw, mh, scale) {
  // robust arguments
  if(!element) throw new Error('provide element');
  mode = (mode && mode.toLowerCase()) || 'none';
  if(nigelgame.Screen.MODES.indexOf(mode) === -1)
    throw new Error('unsupported screen mode: ' + mode);
  mw = mw || element.clientWidth || element.innerWidth;
  mh = mh || element.clientHeight || element.innerWidth;
  if(scale < 1) throw new Error('invalid scale');
  
  // create canvas element
  var canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  // drawing context
  var context = canvas.getContext('2d');
  // put canvas on page
  ((element !== window)? element: document.getElementsByTagName('body')[0]).appendChild(canvas);
  // make it selectable (if it's not just in the window)
  if(element !== window && element.tabIndex < 0) element.tabIndex = 0;
  
  // public properties
  Object.defineProperty(this, 'element', { get: function() { return element; } });
  Object.defineProperty(this, 'canvas', { get: function() { return canvas; } });
  Object.defineProperty(this, 'context', { get: function() { return context; } });
  Object.defineProperty(this, 'mode', { get: function() { return mode; } });
  Object.defineProperty(this, 'minWidth', { get: function() { return mw; } });
  Object.defineProperty(this, 'minHeight', { get: function() { return mh; } });
  this.width = undefined;
  this.height = undefined;
  this.drawScale = scale || 1;
  this.wasResized = false;
  this.prevDims = null;
  Object.defineProperty(this, 'left', { get: function() {
    return Math.round(this.offset.x - (this.width * (this.origin.x + 1) / 2));
  } });
  Object.defineProperty(this, 'top', { get: function() {
    return Math.round(this.offset.y - (this.height * (this.origin.y + 1) / 2));
  } });
  Object.defineProperty(this, 'right', { get: function() { return this.left + this.width; } });
  Object.defineProperty(this, 'bottom', { get: function() { return this.top + this.height; } });
  this.font = null;
  
  // methods
  var _origin = { x: 0, y: 0 };
  var _offset = { x: 0, y: 0 };
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

nigelgame.Screen.MODES = [ 'none', 'adapt', 'scale-adapt' ];

nigelgame.Screen.prototype.fitElement = function() {
  // get the current width/height of the elemnt
  var w = this.element.clientWidth || this.element.innerWidth;
  var h = this.element.clientHeight || this.element.innerHeight;
  // if it hasn't changed, skip this step.
  this.wasResized =
    !this.prevDims ||
    this.prevDims.width !== w ||
    this.prevDims.height !== h;
  if(!this.wasResized) return;
  // otherwise, do the correct resize function for the mode
  if(this.mode === 'none')
    this.fitElementModeNone(w, h);
  else if(this.mode === 'adapt')
    this.fitElementModeAdapt(w, h);
  else if(this.mode === 'scale-adapt')
    this.fitElementModeScaleAdapt(w, h);
  // record previous dimensions
  this.prevDims = { height: h, width: w };
};

nigelgame.Screen.prototype.fitElementModeNone = function(w, h) {
  // only resize if the size hasnt yet been set
  if(this.prevDims) return;
  // set the sizes just once
  this.canvas.width = (this.width = this.minWidth) * this.drawScale;
  this.canvas.height = (this.height = this.minHeight) * this.drawScale;
  // crispy if scaled up
  if(this.drawScale > 1) this.crispy();
};

nigelgame.Screen.prototype.fitElementModeAdapt = function(w, h) {
  // resize
  this.canvas.width = (this.width = Math.floor(w/this.drawScale)) * this.drawScale;
  this.canvas.height = (this.height = Math.floor(h/this.drawScale)) * this.drawScale;
  // crispy if scaled up
  if(this.drawScale > 1) this.crispy();
};

nigelgame.Screen.prototype.fitElementModeScaleAdapt = function(w, h) {
  // if the desired aspect ratio is equal
  if(this.minWidth * h === this.minHeight * w) {
    this.width = this.minWidth;
    this.height = this.minHeight;
  }
  // if it needs to be WIDER
  else if(this.minWidth * h < this.minHeight * w) {
    this.width = Math.floor(w / h * this.minHeight);
    this.height = this.minHeight;
  }
  // if it needs to be TALLER
  else {
    this.width = this.minWidth;
    this.height = Math.floor(h / w * this.minWidth);
  }
  // draw at a lower scale...
  this.drawScale = Math.floor(Math.min(h/this.height, w/this.width));
  if(this.drawScale < 1) this.drawScale = 1; //unless it's smaller than minimum
  this.canvas.width = this.width * this.drawScale;
  this.canvas.height =  this.height * this.drawScale;
  // crispy
  this.crispy();
  // if the view is the whole window, then keep it at the right location
  if(this.element === window) {
    window.scrollTo(0, 0);
  }
};

nigelgame.Screen.prototype.crispy = function() {
  this.context.webkitImageSmoothingEnabled =
    this.context.imageSmoothingEnabled =
    this.context.mozImageSmoothingEnabled =
    this.context.oImageSmoothingEnabled = false;
};

nigelgame.Panel = function(parent, x, y, w, h, xAnchor, yAnchor) {
  /* TODO */
};

nigelgame.Screen.prototype.panel = function(x, y, w, h, xAnchor, yAnchor) {
  return new nigelgame.Panel(this, x, y, w, h, xAnchor, yAnchor);
};