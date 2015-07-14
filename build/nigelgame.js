function nigelgame(element) {
  var resourceReqs = 0;
  var resourceCallback = null;
  
  // setup screen
  var screen = new nigelgame.Screen(element);
  this.setScreenMode = function() { screen.mode.apply(screen, arguments); };
  this.setScreenSize = function() { screen.setSize.apply(screen, arguments); };
  this.setScreenScale = function() { screen.setScale.apply(screen, arguments); };
  
  this.addSheet = function(src, alias, w, h) {
    if(!src) throw "missing source image";
    if(!alias) throw "missing alias";
    if(nigelgame.sheets[alias]) {
      var oldsheet = nigelgame.sheets[alias];
      if(oldsheet.src === src) return;
      else throw "Sheet already defined with alias " + oldsheet.alias + "(" + oldsheet.src + ", " + src + ")";
    }
    ++resourceReqs;
    var img = new Image();
    img.onload = onLoadedFile;
    img.onerror = function() { throw "Failed to load image " + src; };
    img.src = src;
    
    function onLoadedFile() {
      nigelgame.sheets[alias] = new nigelgame.Sheet(alias, img, src, w, h);
      --resourceReqs;
      if(resourceReqs === 0 && resourceCallback) {
        resourceCallback();
        resourceCallback = null;
      }
    }
  };
  
  this.addJSON = function(src, alias) {
    if(!src) throw "missing json source filename";
    if(!alias) throw "missing alias";
    if(nigelgame.json[alias]) {
      var oldobj = nigelgame.json[alias];
      if(oldobj.src === src) return;
      else throw "Duplicate alias for " + oldobj.alias + "(" + oldobj.src + ", " + src + ")";
    }
    ++resourceReqs;
    var xht = new XMLHttpRequest();
    xht.open('GET', src);
    xht.overrideMimeType('application/json');
    xht.onloadend = onLoadedFile;
    xht.onerror = function() { throw "Error loading JSON file: " + src; };
    xht.ontimeout = function() { throw "Request timed out: " + src; };
    xht.send();
    
    function onLoadedFile() {
      nigelgame.json[alias] = JSON.parse(xht.response);
      --resourceReqs;
      if(resourceReqs === 0 && resourceCallback) {
        resourceCallback();
        resourceCallback = null;
      }
    }
  };
  
  var binds = null;
  this.bind = function(name /*, key1, key2, ... */ ) {
    if(!binds) binds = {};
    for(var i = 1; i < arguments.length; ++i) {
      binds[arguments[i]] = name;
    }
  };
  
  var useTouch = false;
  this.activateTouch = function() { useTouch = true; };
  
  var useKeyboard = false;
  this.activateKeyboard = function() { useKeyboard = true; };
  
  var frameskip = 0;
  this.setFrameSkip = function(x) { frameskip = x; };
  
  var started = false;
  this.start = function(view) {
    if(started) throw new Error('game is already started!');
    started = true;
    if(resourceReqs > 0) {
      resourceCallback = function() { reallyStart(view); };
    }
    else {
      reallyStart(view);
    }
  };
  
  function reallyStart(view) {
    //initialize some things
    var buttons = {};
    var mouseState = {
      startPoint: null,
      lastPoint: null,
      button: null
    };
    var touchState = {
      id: null,
      startPoint: null,
      lastPoint: null
    };
    var doingFrame = false;
    var totalClock = 0;
    var viewClock = 0;
    var skippedFrames = 0;
    
    // key listeners
    if(binds) {
      element.addEventListener("keydown", gotKeyDown, false);
      element.addEventListener("keyup", gotKeyUp, false);
    }
    if(useKeyboard) {
      element.addEventListener("keypress", gotKeyPress, false);
    }
    // mouse/touch listeners
    if(useTouch) {
      element.addEventListener("mousedown", gotMouseDown, false);
      element.addEventListener("mouseup", gotMouseUp, false);
      element.addEventListener("mousemove", gotMouseMove, false);
      element.addEventListener("touchstart", gotTouchStart, false);
      element.addEventListener("touchmove", gotTouchMove, false);
      element.addEventListener("touchend", gotTouchEnd, false);
      // disable context menu on right click
      element.addEventListener("contextmenu", function(evt) { evt.preventDefault(); return false; }, false);
    }
    // begin doing frame actions
    window.requestAnimationFrame(reqAnim);
    
    function reqAnim() {
      // don't accidentally call this method twice at once
      if(doingFrame) return;
      doingFrame = true;
      if(frameskip) {
        ++skippedFrames;
        if(skippedFrames > frameskip) {
          skippedFrames = 0;
          doFrame();
        }
      }
      else {
        doFrame();
      }
      // done. unlock method
      doingFrame = false;
      window.requestAnimationFrame(reqAnim);
    }
    
    function doFrame() {
      if(view.nextView) {
        var next = view.nextView;
        view.nextView = null;
        view = next;
        viewClock = 0;
      }
      screen.fitElement();
      if(view.update) view.update({
        viewClock: viewClock,
        gameClock: totalClock,
        screen: screen,
        buttons: buttons
      });
      ++viewClock;
      ++totalClock;
      for(var key in buttons) {
        if(buttons.hasOwnProperty(key)) {
          ++buttons[key].length;
        }
      }
    }
    
    // game button event handlers
    function gotKeyDown(evt) {
      if(!useKeyboard) evt.preventDefault();
      var key = binds[evt.keyCode];
      if(key === undefined) return true;
      
      if(!buttons[key]) {
        buttons[key] = { length: 0 };
        if(view.buttondown) return view.buttondown(key);
      }
    }
    function gotKeyUp(evt) {
      var key = binds[evt.keyCode];
      if(key === undefined) return true;
      
      if(buttons[key]) {
        buttons[key] = false;
        if(view.buttonup) return view.buttonup(key);
      }
    }
    
    //manual keyboard event handlers
    function gotKeyPress(evt) {
      if(view.keypress)
        if(view.keypress(evt))
          evt.preventDefault();
    }
    
    //mouse event handlers
    function gotMouseDown(evt) {
      var point = mousePoint(evt);
      mouseState.startPoint = point;
      mouseState.lastPoint = point;
      mouseState.button = mouseWhich(evt);
      if(view.touch) view.touch({
        point: point,
        type: mouseState.button,
        screenRect: screen.getRect()
      });
    }
    function gotMouseMove(evt) {
      if(!mouseState.startPoint) return;
      var point = mousePoint(evt);
      if(point.equals(mouseState.lastPoint)) return;
      if(view.drag) view.drag({
        point: point,
        lastPoint: mouseState.lastPoint,
        startPoint: mouseState.startPoint,
        type: mouseState.button,
        screenRect: screen.getRect()
      });
      mouseState.lastPoint = point;
    }
    function gotMouseUp(evt) {
      if(view.release && mouseState.startPoint && mouseState.button === mouseWhich(evt)) {
        view.release({
          point: mousePoint(evt),
          startPoint: mouseState.startPoint,
          type: mouseState.button,
          screenRect: screen.getRect()
        });
      }
      mouseState.startPoint = null;
      mouseState.lastPoint = null;
    }
    function mousePoint(evt) {
      var x = evt.clientX - (element.clientLeft || 0) - (element.offsetLeft || 0);
      var y = evt.clientY - (element.clientTop || 0) - (element.offsetTop || 0);
      var elw = element.clientWidth || element.innerWidth;
      var elh = element.clientHeight || element.innerHeight;
      return {
        x: Math.floor(x/elw*screen.width - screen.width/2),
        y: Math.floor(y/elh*screen.height - screen.height/2)
      };
    }
    function mouseWhich(evt) {
      return (evt.button === 2)? "rightmouse": "mouse";
    }
    
    //touch events handlers
    function gotTouchStart(evt) {
      // prevent default
      evt.preventDefault();
      // if this isn't the first touch, ignore it
      if(evt.touches.length !== evt.changedTouches.length) return;
      // get point
      var point = touchPoint(evt.changedTouches[0]);
      // register touchState
      touchState = {
        id: evt.changedTouches[0].identifier,
        startPoint: point,
        lastPoint: point
      };
      //do action if any
      if(view.touch) view.touch({
        point: point,
        type: "touch",
        screenRect: screen.getRect()
      });
    }
    function gotTouchMove(evt) {
      // prevent default
      evt.preventDefault();
      //ignore if we didn't get the start
      if(!touchState.startPoint) return;
      //look at all moved touches
      for(var i = 0; i < evt.changedTouches.length; ++i) {
        //if one of them is the current touch, ok!
        if(evt.changedTouches[i].identifier === touchState.id) {
          var point = touchPoint(evt.changedTouches[i]);
          if(point.equals(touchState.lastPoint)) return;
          if(view.drag) view.drag({
            point: point,
            lastPoint: touchState.lastPoint,
            startPoint: touchState.startPoint,
            type: "touch",
            screenRect: screen.getRect()
          });
          touchState.lastPoint = point;
          return;
        }
      }
    }
    function gotTouchEnd(evt) {
      // prevent default
      evt.preventDefault();
      //ignore if we didn't get the start
      if(!touchState.startPoint) return;
      //look at all released touches
      for(var i = 0; i < evt.changedTouches.length; ++i) {
        //if one of them is the current touch, ok!
        if(evt.changedTouches[i].identifier === touchState.id) {
          //no more touches: release
          if(evt.targetTouches.length===0) {
            if(view.release) view.release({
              point: touchPoint(evt.changedTouches[i]),
              startPoint: touchState.startPoint,
              type: "touch",
              screenRect: screen.getRect()
            });
            touchState.id = null;
            touchState.startPoint = null;
            touchState.lastPoint = null;
          }
          //there are still other touches; drag to it
          else {
            var nextTouch = evt.targetTouches[evt.targetTouches.length-1];
            var point = touchPoint(nextTouch);
            if(view.drag) view.drag({
              point: point,
              lastPoint: touchState.lastPoint,
              startPoint: touchState.startPoint,
              type: "touch",
              screenRect: screen.getRect()
            });
            touchState.id = nextTouch.identifier;
            touchState.lastPoint = point;
          }
          //done.
          return;
        }
      }
      //if it wasn't our touch, just ignore it. done.
    }
    function touchPoint(touch) { //TODO the same?????
      var x = touch.clientX - (element.clientLeft || 0) - (element.offsetLeft || 0);
      var y = touch.clientY - (element.clientTop || 0) - (element.offsetTop || 0);
      var elw = element.clientWidth || element.innerWidth;
      var elh = element.clientHeight || element.innerHeight;
      return {
        x: Math.floor(x/elw*screen.width - screen.width/2),
        y: Math.floor(y/elh*screen.height - screen.height/2)
      };
    }
  };
}

nigelgame.sheets = {};
nigelgame.json = {};

// requestAnimationFrame
window.requestAnimationFrame =
  window.requestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.oRequestAnimationFrame;

// Math.sign polyfill
Math.sign = function sign(x) {
  return !(x= parseFloat(x)) ? x : x > 0 ? 1 : -1;
};

// Math extensions
//  Median
Math.mid = function() {
  var arr = [];
  for(var i = 0; i < arguments.length; ++i) arr.push(+arguments[i]);
  arr.sort(function(a, b) { return a-b; });
  if(arr.length%2 === 1) return arr[Math.floor(arr.length/2)];
  else return (arr[Math.floor(arr.length/2)] + arr[Math.floor(arr.length/2)-1]) / 2;
};
//  Cap!
//  returns val if it's between -max and max.
//  otherwise, returns the cap of them.
Math.cap = function(val, max) {
  return Math.mid(-max, val, max);
};

// Hashcode of strings.
// http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
String.prototype.hashCode = function() {
  var hash = 0, i, chr, len;
  if (this.length == 0) return hash;
  for (i = 0, len = this.length; i < len; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

// random objects
// it can just be called as a function, or it can be seeded
nigelgame.random = (function() {
  function getSeed(s) {
    if(typeof(s) === 'number') return s;
    else if(typeof(s) === 'string') return s.hashCode();
    else throw new Error('not sure what to do with seed: ' + s);
  }
  function SinRand(s) {
    var seed = getSeed(s);
    var obj = function() {
      var x = Math.sin(seed++) * 10000;
      x -= Math.floor(x);
      if(arguments.length === 0) return x;
      if(arguments.length === 1 && (arguments[0] instanceof Array)) return arguments[0][Math.floor(x*arguments[0].length)];
      if(arguments.length === 1) return Math.floor(x*arguments[0]);
      if(arguments.length === 2) return Math.floor(x*(arguments[1]+1-arguments[0]))+arguments[0];
      else throw new Error('invalid arguments for random generator.');
    };
    obj.seed = function(s) { seed = getSeed(s); };
    obj.create = function(s) {
      return SinRand((s !== undefined)? s: obj());
    };
    return obj;
  };
  return SinRand(Math.random());
})();

// word wrap function by james padolsey
// modified from original
// http://james.padolsey.com/javascript/wordwrap-for-javascript/
nigelgame.wrapString = function(str, width, maxLines) {
  if (!str) return str;
  var regex = '.{1,' +width+ '}(\\s|$)|.{' +width+ '}|.+$';
  var lines = str.match(RegExp(regex, 'g'));
  if(maxLines) lines = lines.slice(0, maxLines);
  for(var i = 0; i < lines.length; ++i) lines[i] = lines[i].trim();
  return lines.join('\n');
};

nigelgame.Screen = function(element) {
  // vars
  element = element || window;
  var mode = { name: 'adapt' };
  var width = element.clientWidth || element.innerWidth;
  var height = element.clientHeight || element.innerWidth;
  var scale = 1;
  var needsRepaint = true;
  var prevDims = null;
  var font = null;
  var _origin = { x: 0, y: 0 };
  var _offset = { x: 0, y: 0 };
  
  // create canvas element
  var canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.margin = 'auto';
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
  Object.defineProperty(this, 'drawScale', { get: function() { return scale; } });
  Object.defineProperty(this, 'font', {
    set: function(x) {
      if(!nigelgame.sheets[x]) throw new Error('invalid font: ' + x);
      font = x;
    },
    get: function() {
      if(!font) throw new Error('font has not been set.');
      return font;
    }
  });
  
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
  };
  
  this.setScale = function(s) {
    if(mode.name === 'adapt' || mode.name === 'fixed') {
      scale = s;
    }
    else {
      throw new Error('screen mode does not support setScale: ' + mode.name);
    }
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
    // make sure the pixels are crispy if it's scaled up
    if(scale > 1) {
      this.context.webkitImageSmoothingEnabled =
        this.context.imageSmoothingEnabled =
        this.context.mozImageSmoothingEnabled =
        this.context.oImageSmoothingEnabled = false;
    }
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
  
};

nigelgame.Panel = function(parent, x, y, w, h, xAnchor, yAnchor) {
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
  
  // subcanvas size
  this.canvasOffX = Math.round(parent.canvasOffX + x + parent.width*(parent.origin().x+1)/2 - w*(xAnchor+1)/2);
  this.canvasOffY = Math.round(parent.canvasOffY + y + parent.height*(parent.origin().y+1)/2 - h*(yAnchor+1)/2);
  var width = Math.round(w);
  var height = Math.round(h);
  // verify it fits within the parent
  if(this.canvasOffX < parent.canvasOffX) throw new Error('panel does not fit within its parent.');
  if(this.canvasOffY < parent.canvasOffY) throw new Error('panel does not fit within its parent.');
  if(this.canvasOffX + w > parent.canvasOffX + parent.width) throw new Error('panel does not fit within its parent.');
  if(this.canvasOffY + h > parent.canvasOffY + parent.height) throw new Error('panel does not fit within its parent.');
  
  // public properties
  Object.defineProperty(this, 'element', { get: function() { return parent.element; } });
  Object.defineProperty(this, 'canvas', { get: function() { return parent.canvas; } });
  Object.defineProperty(this, 'context', { get: function() { return parent.context; } });
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
  Object.defineProperty(this, 'drawScale', { get: function() { return parent.drawScale; } });
  Object.defineProperty(this, 'font', {
    set: function(x) {
      if(!nigelgame.sheets[x]) throw new Error('invalid font: ' + x);
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

nigelgame.Screen.prototype.panel =
nigelgame.Panel.prototype.panel = function(x, y, w, h, xAnchor, yAnchor) {
  if(arguments.length === 4)
    return new nigelgame.Panel(this, x, y, w, h);
  else if(arguments.length === 6)
    return new nigelgame.Panel(this, x, y, w, h, xAnchor, yAnchor);
  else
    throw new Error('invalid number of arguments.');
};

nigelgame.Screen.prototype.toCanvasCoords =
nigelgame.Panel.prototype.toCanvasCoords = function(x, y, w, h, xAnc, yAnc) {
  // make sure we got the right number of args
  if(arguments.length !== 6)
    throw new Error('toCanvasCoords requires 6 arguments');
  // define xAnc and yAnc if not defined
  if(xAnc === undefined || xAnc === null) xAnc = this.origin().x;
  if(yAnc === undefined || yAnc === null) yAnc = this.origin().y;
  // translate x and y into LEFT and TOP
  var l = Math.round(this.canvasOffX + x + this.offset().x + this.width * (this.origin().x+1)/2 - (w || 0) * (xAnc+1)/2);
  var t = Math.round(this.canvasOffY + y + this.offset().y + this.height * (this.origin().y+1)/2 - (h || 0) * (yAnc+1)/2);
  // how much may need to be cut off the sides for sprites
  var lcut = Math.max(0, this.canvasOffX-l);
  var tcut = Math.max(0, this.canvasOffY-t);
  var rcut = Math.max(0, (l+w)-(this.canvasOffX+this.width));
  var bcut = Math.max(0, (t+h)-(this.canvasOffY+this.height));
  // return null if the object didn't make it on the screen
  if(lcut+rcut >= w || tcut+bcut >= h) return null;
  // otherwise return a nice object
  return {
    x: l+lcut, y: t+tcut, width: w-lcut-rcut, height: h-tcut-bcut,
    lcut: lcut, tcut: tcut, rcut: rcut, bcut: bcut
  };
};

nigelgame.Screen.prototype.clear = 
nigelgame.Panel.prototype.clear = function(x, y, w, h, xAnc, yAnc) {
  // verify valid arguments
  if([0, 4, 6].indexOf(arguments.length) === -1)
    throw new Error('bad arguments for clear');
  // if no arguments are provided, clear the whole area
  if(arguments.length === 0) {
    if(this instanceof nigelgame.Screen) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    else {
      this.context.clearRect(
        this.canvasOffX * this.drawScale,
        this.canvasOffY * this.drawScale,
        this.width * this.drawScale,
        this.height * this.drawScale
      );
    }
    return;
  }
  // translate to coordinates on canvas element
  var coords = this.toCanvasCoords(x, y, w, h, xAnc, yAnc);
  if(!coords) return;
  // clear canvas
  this.context.clearRect(coords.x * this.drawScale, coords.y * this.drawScale, coords.width * this.drawScale, coords.height * this.drawScale);
};

nigelgame.Screen.prototype.reset = function() {
  this.clear();
  this.origin(0, 0);
  this.offset(0, 0);
};

nigelgame.Screen.prototype.fill =
nigelgame.Panel.prototype.fill = function(color, x, y, w, h, xAnc, yAnc) {
  // verify valid arguments
  if([1, 5, 7].indexOf(arguments.length) === -1)
    throw new Error('bad arguments for fill');
  // set color
  var temp = this.context.fillStyle;
  this.context.fillStyle = color;
  // if only the color is provided, fill the whole area
  if(arguments.length === 1) {
    if(this instanceof nigelgame.Screen) {
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    else {
      this.context.fillRect(
        this.canvasOffX * this.drawScale,
        this.canvasOffY * this.drawScale,
        this.width * this.drawScale,
        this.height * this.drawScale
      );
    }
    this.context.fillStyle = temp;
    return;
  }
  // translate to coordinates on canvas element
  var coords = this.toCanvasCoords(x, y, w, h, xAnc, yAnc);
  if(!coords) return;
  // do fill on canvas
  this.context.fillRect(coords.x * this.drawScale, coords.y * this.drawScale, coords.width * this.drawScale, coords.height * this.drawScale);
  // set color back
  this.context.fillStyle = temp;
};

nigelgame.Screen.prototype.blit =
nigelgame.Panel.prototype.blit = function(sheetName, frame /* [flip], x, y, [xAnc, yAnc] */) {
  // verify valid arguments
  if([4,5,6,7].indexOf(arguments.length) === -1)
    throw new Error('bad arguments for blit');
  // get variable arguments
  var flip = (arguments.length%2 === 1) && arguments[2] || '';
  var x = arguments[arguments.length%2===0? 2: 3];
  var y = arguments[arguments.length%2===0? 3: 4];
  var xAnc = arguments.length>=6? arguments[arguments.length-2]: null;
  var yAnc = arguments.length>=6? arguments[arguments.length-1]: null;
  // get the sheet
  var sheet = nigelgame.sheets[sheetName];
  if(!sheet) throw new Error('unknown sheet: ' + sheetName);
  // if a particular sprite is specified, get it
  var sprite = (frame !== undefined && frame !== null)?
    sheet.getSprite(frame): sheet;
  // coooordinates
  var coords = this.toCanvasCoords(x, y, sprite.width, sprite.height, xAnc, yAnc);
  if(!coords) return;
  // do canvas flipping
  var xflip = (flip.indexOf('h')!==-1)? 1:0;
  var yflip = (flip.indexOf('v')!==-1)? 1:0;
  if(flip) {
    this.context.translate(this.canvas.width*xflip, this.canvas.height*yflip);
    this.context.scale(xflip?-1:1, yflip?-1:1);
  }
  // draw it to the screen
  this.context.drawImage(
    // image
    sprite.img,
    // location on the spritesheet
    sprite.left + (xflip?coords.rcut:coords.lcut), sprite.top + (yflip?coords.bcut:coords.tcut),
    coords.width, coords.height,
    // location on screen
    this.canvas.width*xflip + (coords.x*(xflip?-1:1) - coords.width*xflip) * this.drawScale,
    this.canvas.height*yflip + (coords.y*(yflip?-1:1) - coords.height*yflip) * this.drawScale,
    coords.width * this.drawScale, coords.height * this.drawScale
  );
  // undo flipping
  if(flip) {
    this.context.translate(this.canvas.width*xflip, this.canvas.height*yflip);
    this.context.scale(xflip?-1:1, yflip?-1:1);
  }
};

nigelgame.Screen.prototype.write =
nigelgame.Panel.prototype.write = function(text, x, y, options) {
  // verify font
  var font = nigelgame.sheets[this.font];
  // options
  options = options || {};
  if(options.cols || options.rows)
    text = nigelgame.wrapString(text, options.cols, options.rows);
  var anchor = (options && options.anchor) || {};
  if(anchor.x === undefined) anchor.x = this.origin().x || 0;
  if(anchor.y === undefined) anchor.y = this.origin().y || 0;
  // format text into lines & get max column width
  var lines = text.split('\n');
  var maxcol = 0;
  for(var i = 0; i < lines.length; ++i) maxcol = Math.max(lines[i].length, maxcol);
  // how to align the text?
  var align = 0;
  if(!options || !options.align || options.align === "left") align = 0;
  else if(options.align === "center") align = 0.5;
  else if(options.align === "right") align = 1;
  else throw "unknown text alignment: " + options.align;
  // where the top left char at
  var coords = this.toCanvasCoords(x, y, font.spriteWidth * maxcol, font.spriteHeight * lines.length, null, null);
  if(!coords) return;
  var ltrWidth = font.spriteWidth;
  var ltrHeight = font.spriteHeight;
  // iterate
  for(var r = 0; r < lines.length; ++r) {
    var indent = Math.round((maxcol-lines[r].length)*align*font.spriteWidth);
    for(var c = 0; c < lines[r].length; ++c) {
      var ch = lines[r].charCodeAt(c) - 32;
      var sprite = font.getSprite(ch);
      // draw it to the screen
      this.context.drawImage(
        // image
        sprite.img,
        // location on the spritesheet
        sprite.left, sprite.top, sprite.width, sprite.height,
        // location on screen
        (coords.x + indent + (c * ltrWidth)) * this.drawScale,
        (coords.y + (r * ltrHeight)) * this.drawScale,
        ltrWidth * this.drawScale, ltrHeight * this.drawScale
      );
    }
  }
};

nigelgame.Screen.prototype.border =
nigelgame.Panel.prototype.border = function(sheet) {
  // temporarily store origin and offset, then set them
  var oldOrigin = this.origin();
  var oldOffset = this.offset();
  this.origin(-1,-1);
  this.offset(0,0);
  // horizontal edges
  var sw = nigelgame.sheets[sheet].spriteWidth;
  for(var x = sw; x < this.width - sw; x += sw) {
    this.blit(sheet, {col:1, row:0}, x, 0, -1, -1);
    this.blit(sheet, {col:1, row:2}, x, this.height, -1, 1);
  }
  // vertical edges
  var sh = nigelgame.sheets[sheet].spriteHeight;
  for(var y = sh; y < this.height - sh; y += sh) {
    this.blit(sheet, {col:0, row:1}, 0, y, -1, -1);
    this.blit(sheet, {col:2, row:1}, this.width, y, 1, -1);
  }
  // corners
  this.blit(sheet, {col:0, row:0}, 0,0, -1, -1);
  this.blit(sheet, {col:2, row:0}, this.width,0, 1, -1);
  this.blit(sheet, {col:0, row:2}, 0,this.height, -1, 1);
  this.blit(sheet, {col:2, row:2}, this.width,this.height, 1, 1);
  // return origin and offset to old values
  this.origin(oldOrigin.x, oldOrigin.y);
  this.offset(oldOffset.x, oldOffset.y);
};

nigelgame.Sheet = function(alias, img, src, spriteWidth, spriteHeight) {
  // calculate some defaults and extra values
  spriteWidth = spriteWidth || img.width;
  spriteHeight = spriteHeight || img.height;
  var numCols = Math.floor(img.width / spriteWidth);
  var numRows = Math.floor(img.height / spriteHeight);
  var numSprites = numCols * numRows;
  
  // properties
  Object.defineProperty(this, 'alias', { get: function() { return alias; } });
  Object.defineProperty(this, 'img', { get: function() { return img; } });
  Object.defineProperty(this, 'src', { get: function() { return src; } });
  Object.defineProperty(this, 'left', { get: function() { return 0; } });
  Object.defineProperty(this, 'top', { get: function() { return 0; } });
  Object.defineProperty(this, 'width', { get: function() { return img.width; } });
  Object.defineProperty(this, 'height', { get: function() { return img.height; } });
  Object.defineProperty(this, 'spriteWidth', { get: function() { return spriteWidth; } });
  Object.defineProperty(this, 'spriteHeight', { get: function() { return spriteHeight; } });
  Object.defineProperty(this, 'numCols', { get: function() { return numCols; } });
  Object.defineProperty(this, 'numRows', { get: function() { return numRows; } });
  Object.defineProperty(this, 'numSprites', { get: function() { return numSprites; } });
};

nigelgame.Sheet.prototype.getSprite = function(frame) {
  return new nigelgame.Sprite(this, frame);
};

nigelgame.Sprite = function(sheet, frame) {
  // validate frame
  if(frame === undefined || frame === null)
    throw new Error('bad frame while constructing sprite');
  // if frame is given as a number, get the column and row
  if((typeof frame === "number") && (frame%1)===0) {
    frame = { col: frame % sheet.numCols, row: Math.floor(frame / sheet.numCols) };
  }
  // calculate dimensions
  var fx = frame.x!==undefined? frame.x: frame.col? frame.col*sheet.spriteWidth: 0;
  var fy = frame.y!==undefined? frame.y: frame.row? frame.row*sheet.spriteHeight: 0;
  var fw = frame.width!==undefined? frame.width: (frame.col!==undefined? sheet.spriteWidth: sheet.width-fx);
  var fh = frame.height!==undefined? frame.height: (frame.row!==undefined? sheet.spriteHeight: sheet.height-fy);
  
  // properties
  Object.defineProperty(this, 'img', { get: function() { return sheet.img; } });
  Object.defineProperty(this, 'left', { get: function() { return fx; } });
  Object.defineProperty(this, 'top', { get: function() { return fy; } });
  Object.defineProperty(this, 'width', { get: function() { return fw; } });
  Object.defineProperty(this, 'height', { get: function() { return fh; } });
};