function nigelgame(element) {
  var resourceReqs = 0;
  var resourceCallback = null;
  
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
    var screen = null;
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
    
    // setup screen
    screen = new nigelgame.Screen(element, 'adapt');
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
      var clocks = {
        total: totalClock,
        view: viewClock
      };
      if(view.update) view.update(clocks);
      screen.fitElement();
      if(view.draw) view.draw(screen, clocks);
      ++viewClock;
      ++totalClock;
    }
    
    // game button event handlers
    function gotKeyDown(evt) {
      if(!useKeyboard) evt.preventDefault();
      var key = binds[evt.keyCode];
      if(key === undefined) return true;
      
      if(!buttons[key]) {
        buttons[key] = true;
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
        if(!view.keypress(evt)) return;
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
  var fontSheet = null;
  this.setFont = function(f) {
    fontSheet = nigelgame.sheets[f] || null;
    if(!fontSheet) throw new Error('invalid font: ' + f);
  };
  this.getFontSheet = function() {
    if(!fontSheet) throw new Error('font has not been set.');
    return fontSheet;
  };
  
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

/* global nigelgame */
nigelgame.Screen.prototype.toCanvasCoords = function(x, y, w, h) {
  // make sure we got the right number of args
  if(arguments.length !== 2 && arguments.length !== 4)
    throw new Error('bad number of arguments to toCanvasCoords');
  // translate x and y into LEFT and TOP
  var l = Math.round(x + this.offset().x + (this.width - (w || 0)) * (this.origin().x + 1)/2);
  var t = Math.round(y + this.offset().y + (this.height - (h || 0)) * (this.origin().y + 1)/2);
  // convenient drawScale alias
  var s = this.drawScale;
  // return width and height if it's 4 args. otherwise it's a point with 2
  if(arguments.length === 2) return { x: l*s, y: t*s };
  else return { x: l*s, y: t*s, width: w*s, height: h*s };
};

nigelgame.Screen.prototype.clear = 
nigelgame.Panel.prototype.clear = function(x, y, w, h) {
  // if no arguments are provided, clear the whole area
  if(arguments.length === 0) {
    if(this instanceof nigelgame.Screen) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    else {
      
    }
    return;
  }
  // make sure it's 4 arguments like it should be
  if(arguments.length !== 4) throw new Error('bad arguments for clear');
  // translate x and y into LEFT and TOP
  var coords = this.toCanvasCoords(x, y, w, h);
  //clear it
  this.context.clearRect(coords.x, coords.y, coords.width, coords.height);
};

nigelgame.Screen.prototype.reset = function() {
  this.clear();
  this.origin(0, 0);
  this.offset(0, 0);
};

nigelgame.Screen.prototype.fill =
nigelgame.Panel.prototype.fill = function(color, x, y, w, h) {
  // ensure valid arguments
  if(arguments.length !== 1 && arguments.length !== 5)
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
      
    }
    this.context.fillStyle = temp;
    return;
  }
  // translate x and y into LEFT and TOP
  var coords = this.toCanvasCoords(x, y, w, h);
  // clear it
  this.context.fillRect(coords.x, coords.y, coords.width, coords.height);
  // set color back
  this.context.fillStyle = temp;
};

nigelgame.Screen.prototype.blit =
nigelgame.Panel.prototype.blit = function(sheetName, frame, x, y) {
  // get the sheet
  var sheet = nigelgame.sheets[sheetName];
  if(!sheet) throw new Error('unknown sheet: ' + sheetName);
  // if a particular sprite is specified, get it
  var sprite = (frame !== undefined && frame !== null)?
    sheet.getSprite(frame): sheet;
  // coooordinates
  var coords = this.toCanvasCoords(x, y, sprite.width, sprite.height);
  // draw it to the screen
  this.context.drawImage(
    // image
    sprite.img,
    // location on the spritesheet
    sprite.left, sprite.top, sprite.width, sprite.height,
    // location on screen
    coords.x, coords.y, coords.width, coords.height
  );
};

nigelgame.Screen.prototype.write =
nigelgame.Panel.prototype.write = function(text, x, y, options) {
  // verify font
  var font = this.getFontSheet();
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
  var coords = this.toCanvasCoords(x, y, font.spriteWidth * maxcol, font.spriteHeight * lines.length);
  var ltrWidth = font.spriteWidth * this.drawScale;
  var ltrHeight = font.spriteHeight * this.drawScale;
  // iterate
  for(var r = 0; r < lines.length; ++r) {
    var indent = Math.round((maxcol-lines[r].length)*align*font.spriteWidth) * this.drawScale;
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
        coords.x + indent + (c * ltrWidth), coords.y + (r * ltrHeight),
        ltrWidth, ltrHeight
      );
    }
  }
};
/*
nigelgame.Screen.prototype.drawBox =
nigelgame.Panel.prototype.drawBox = function(box, rect, color) {
  //robust arguments
  if(!(rect instanceof nigelgame.Rect)) rect = new nigelgame.Rect(rect);
  //fill background first, maybe.
  if(color) {
    this.fill(color, rect);
  }
  //draw the sprites
  //position on screen
  var pt = rect.pointIn({ xAnchor: -1, yAnchor: -1 });
  //horizontal 
  for(var di = box.spriteWidth, i = di; i < rect.widthFor(this)-di; i += di) {
    //top
    this.drawSprite(box.getSprite(1), pt.translate({ x: i }), {anchor: {x:-1, y:-1}});
    //bottom
    this.drawSprite(box.getSprite(7), pt.translate({ x: i, y: rect.heightFor(this) }), {anchor:{x:-1, y:1}});
  }
  //vertical
  for(var di = box.spriteHeight, i = di; i < rect.heightFor(this)-di; i += di) {
    //left
    this.drawSprite(box.getSprite(3), pt.translate({ y: i }), {anchor:{x:-1,y:-1}});
    //right
    this.drawSprite(box.getSprite(5), pt.translate({ x: rect.widthFor(this), y: i }), {anchor:{x:1,y:-1}});
  }
  //corners
  this.drawSprite(box.getSprite(0), rect.pointIn({ xAnchor: -1, yAnchor: -1 }), { anchor: {x: -1, y: -1}});
  this.drawSprite(box.getSprite(2), rect.pointIn({ xAnchor: 1, yAnchor: -1 }), { anchor: {x: 1, y: -1}});
  this.drawSprite(box.getSprite(6), rect.pointIn({ xAnchor: -1, yAnchor: 1 }), { anchor: {x: -1, y: 1}});
  this.drawSprite(box.getSprite(8), rect.pointIn({ xAnchor: 1, yAnchor: 1 }), { anchor: {x: 1, y: 1}});
};

nigelgame.Screen.prototype.drawStringBox =
nigelgame.Panel.prototype.drawStringBox = function(text, font, box, point, options) {
  //robust args
  if(!(point instanceof nigelgame.Point)) point = new nigelgame.Point(point);
  options = options || {};
  var anchor = (options && options.anchor) || {};
  if(anchor.x === undefined) anchor.x = point.xAnchor || 0;
  if(anchor.y === undefined) anchor.y = point.yAnchor || 0;
  //format string
  var lines = text.split('\n');
  var maxcol = 0;
  for(var i = 0; i < lines.length; ++i) maxcol = Math.max(lines[i].length, maxcol);
  //figure out size of box
  var w = (options.cols || maxcol) * font.spriteWidth + 2 * box.spriteWidth;
  var h = (options.rows || lines.length) * font.spriteHeight + 2 * box.spriteHeight;
  var rect = point.rectFrom({ width: w, height: h, anchor: anchor });
  //draw rect
  this.drawBox(box, rect, options.color);
  //draw the string
  this.drawString(text, font,
    point.translate({
      x: -box.spriteWidth * anchor.x, y: -box.spriteHeight * anchor.y
    }),
    { cols: options.cols, rows: options.rows, anchor: anchor, align: options.align }
  );
};
*/

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