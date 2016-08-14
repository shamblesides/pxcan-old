var pxcan = function(element) {
  // vars
  var self = this;
  element = element || window;
  if(typeof(element) === 'string') element = document.querySelector(element);
  var mode = { name: 'adapt' };
  var width = element.clientWidth || element.innerWidth;
  var height = element.clientHeight || element.innerWidth;
  var scale = 1;
  var needsRepaint = true;
  var prevDims = null;
  var font = "pxcan-ascii";
  var sheets = {};
  var _origin = { x: 0, y: 0 };
  var _offset = { x: 0, y: 0 };
  var binds = {};
  var buttons = {};
  var touch = {
    changed: false,
    isDown: false,
    isMouse: undefined,
    isRightClick: undefined,
    wasStarted: false,
    moved: false,
    isDrag: false,
    wasReleased: false,
    wasInterrupted: false,
    cur: undefined,
    last: undefined,
    start: undefined,
    x: null,
    y: null,
    inBounds: null,
    rel: null,
    bounded: null,
    unbounded: null
  };
  var frameskipCounter = 0;
  var clock = 0;
  
  // add to list of pxcan instances
  pxcan.instances.push(this);
  
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
  function DEF(name, attr) {
    Object.defineProperty(self, name, attr);
  }
  var _id = pxcan.generateId();
  DEF('id', { get: function() { return _id; } })
  DEF('element', { get: function() { return element; } });
  DEF('canvas', { get: function() { return canvas; } });
  DEF('context', { get: function() { return context; } });
  DEF('canvasOffX', { get: function() { return 0; } });
  DEF('canvasOffY', { get: function() { return 0; } });
  DEF('left', { get: function() {
    return Math.round(-_offset.x - (width * (_origin.x + 1) / 2));
  } });
  DEF('top', { get: function() {
    return Math.round(-_offset.y - (height * (_origin.y + 1) / 2));
  } });
  DEF('right', { get: function() { return this.left + width; } });
  DEF('bottom', { get: function() { return this.top + height; } });
  DEF('width', { get: function() { return width; } });
  DEF('height', { get: function() { return height; } });
  DEF('drawScale', { get: function() { return scale; } });
  DEF('wasResized', { get: function() { return needsRepaint; } });
  DEF('clock', { get: function() { return clock; } });
  DEF('frameskip', { value: 0, writable: true });
  DEF('contextMenu', { value: true, writable: true });
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
  DEF('font', {
    set: function(x) {
      if(!this.hasSheet(x)) throw new Error('invalid font: ' + x);
      font = x;
    },
    get: function() {
      if(!font) throw new Error('font has not been set.');
      return font;
    }
  });
  DEF('touch', { get: function() { return touch; } });
  
  // screen mode/sizing components
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
  
  // sheet loading
  this.preload = function(src, alias, w, h) {
    if(!alias && alias !== 0) throw new Error("missing alias");
    if(sheets[alias]) throw new Error("sheet already exists with alias " + alias);
    if(pxcan.globalSheets[alias]) throw new Error("global sheet already exists with alias " + alias);
    if(!pxcan.hasImage(src)) {
      pxcan.preload(src, this);
    }
    sheets[alias] = new pxcan.Sheet(alias, src, w, h);
  };
  
  this.sheet = function(src) {
    if(sheets[src]) return sheets[src];
    if(pxcan.globalSheets[src]) return pxcan.globalSheets[src];
    throw new Error("invalid sheet: " + src);
  };
  
  this.hasSheet = function(src) {
    return !!(sheets[src] || pxcan.globalSheets[src]);
  };
  
  // onReady and onFrame events
  DEF('isPreloading', { get: function() { return pxcan.isPreloading(this); } });
  var _onready = null;
  DEF('onReady', {
    get: function() { return _onready; },
    set: function(x) {
      if(x && !this.isPreloading) x.call(this);
      else _onready = x;
    }
  });
  DEF('onFrame', { writable: true });
  
  var raf = window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.oRequestAnimationFrame;
  function rafFunc() {
    ++frameskipCounter;
    if(frameskipCounter > self.frameskip) {
      frameskipCounter = 0;
      // call frame function
      if(self.onFrame && !self.isPreloading) self.onFrame.call(self, self);
      // update input state
      updateButtons();
      updateTouch();
      // update clock
      ++clock;
    }
    // queue next call
    raf(rafFunc);
  }
  raf(rafFunc);
  
  // built-in button functions 
  this.bind = function(button /*, key1, [key2, [...]] */) {
    for(var i = 1; i < arguments.length; ++i) {
      var code = arguments[i];
      if(typeof(code) === 'string') code = code.toUpperCase().charCodeAt(0);
      binds[code] = button;
    }
    buttons[button] = {
      wasPressed: false,
      wasReleased: false,
      isDown: false,
      framesDown: 0
    };
  };
  
  this.button = function(b) { return buttons[b]; };
  
  function keyevt(evt) {
    if(binds[evt.keyCode] === undefined) {
      evt.preventDefault();
      return true;
    }
    var button = buttons[binds[evt.keyCode]];
    if(evt.type === 'keydown' && button.framesDown === 0) {
      button.wasPressed = button.isDown = true;
      button.framesDown = 0;
    }
    else if(evt.type === 'keyup' && button.isDown) {
      button.wasReleased = true;
      button.isDown = false;
    }
  }
  element.addEventListener("keydown", keyevt, false);
  element.addEventListener("keyup", keyevt, false);

  function updateButtons() {
    for (var b in buttons) {
      if(buttons[b].wasPressed) buttons[b].wasPressed = false;
      if(buttons[b].wasReleased) buttons[b].wasReleased = false;
      if(buttons[b].isDown) ++buttons[b].framesDown;
      else buttons[b].framesDown = 0;
    }
  }

  // touch/mouse events
  function touchPointFromEvt(mouseEvt, ref) {
    // raw coordinates relative to screen top left
    var xOnScreen = mouseEvt.clientX - (element.clientLeft || 0) - (element.offsetLeft || 0);
    var yOnScreen = mouseEvt.clientY - (element.clientTop || 0) - (element.offsetTop || 0);

    // pixel based coordinates relative to screen top left
    var fromLeft = Math.floor(xOnScreen / (element.clientWidth || element.innerWidth) * screen.width);
    var fromTop = Math.floor(yOnScreen / (element.clientHeight || element.innerHeight) * screen.height);

    // ok.
    return new TouchPoint(fromLeft, fromTop, ref || self);
  }

  function TouchPoint(fromLeft, fromTop, ref, bounded) {
    Object.defineProperty(this, 'x', { get: function() {
      if(bounded) return pxMath.clamp(fromLeft, 0, ref.width) + ref.left;
      return fromLeft + ref.left;
    } });
    Object.defineProperty(this, 'y', { get: function() {
      if(bounded) return pxMath.clamp(fromTop, 0, ref.height) + ref.top;
      return fromTop + ref.top;
    } });
    Object.defineProperty(this, 'inBounds', { get: function() {
      return (fromLeft >= 0 && fromLeft <= ref.width && fromTop >= 0 && fromTop <= ref.height);
    } });
    this.rel = function(ref, bounded) {
      if(['bounded','b','unbounded','u',undefined].indexOf(bounded) === -1) {
        throw new Error('bad value for "bounded" parameter.');
      }
      return new TouchPoint(fromLeft, fromTop, ref, bounded && bounded.startsWith('b'));
    };
    (function(self) {
      self.bounded = function() { self.rel(ref, 'bounded'); };
      self.unbounded = function() { self.rel(ref, 'unbounded'); };
    })(this);
  }
  
  ['x','y','inBounds','rel','bounded','unbounded'].forEach(function(attr) {
    Object.defineProperty(touch, attr, { get: function() {
      if(touch.cur === undefined) throw new Error('No touch events happening.');
      return touch.cur[attr];
    } });
  });

  function gotMouseDown(mouseEvt) {
    if(touch.isDown && touch.isMouse) return;
    touch.cur = touch.start = touchPointFromEvt(mouseEvt);
    touch.changed = true;
    touch.isDown = true;
    touch.isMouse = true;
    touch.isRightClick = (mouseEvt.button === 2);
    touch.wasStarted = true;
  }
  function gotMouseMove(mouseEvt) {
    if(!touch.isDown || !touch.isMouse) return;
    touch.cur = touchPointFromEvt(mouseEvt);
    
    if(touch.last && touch.x === touch.last.x && touch.y === touch.last.y) return;
    touch.changed = true;
    touch.moved = true;
    touch.isDrag = true;
  }
  function gotMouseUp(mouseEvt) {
    if(!touch.isDown || !touch.isMouse) return;
    touch.changed = true;
    touch.isDown = false;
    touch.wasReleased = true;
  }
  function updateTouch() {
    touch.changed = false;
    touch.wasStarted = false;
    touch.moved = false;
    touch.wasReleased = false;
    touch.wasInterrupted = false;
    if(touch.isDown) {
      touch.last = touch.cur;
    }
    else {
      touch.cur = touch.last = touch.start = undefined;
      touch.isMouse = undefined;
      touch.isRightClick = undefined;
      touch.isDrag = false;
    }
  }
  element.addEventListener("mousedown", gotMouseDown, false);
  window.addEventListener("mousemove", gotMouseMove, false);
  window.addEventListener("mouseup", gotMouseUp, false);
  
  element.addEventListener("contextmenu", function(e) {
    if(!self.contextMenu) e.preventDefault();
  });
};

pxcan.generateId = (function() {
  var lastId = -1;
  return function() { return ++lastId; };
})();