var nigelgame = {};

nigelgame.start = function(options) {
  //initialize some things
  var buttons = {};
  var mouseState = {
    startPoint: null,
    lastPoint: null,
    button: null
  }
  var touchState = {
    id: null,
    startPoint: null,
    lastPoint: null
  }
  var view;
  var logicReady = true;
  var doingFrame = false;
  var totalClock = 0;
  var viewClock = 0;
  var skippedFrames = 0;
  //setup screen
  var screen = new nigelgame.Screen(
    options.element,
    options.scaleMode,
    options.width,
    options.height,
    options.scale
  );
  
  //load images
  if(options.sheets && options.sheets.length > 0) {
    nigelgame.loadImages(options.sheets, loadedImages);
  }
  else {
    loadedImages();
  }
  
  //load json files
  function loadedImages() {
    if(options.json && options.json.length > 0) {
      nigelgame.loadJSON(options.json, loadedJSON);
    }
    else {
      loadedJSON();
    }
  }
  
  function loadedJSON() {
    //key listeners
    if(options.keyBinds) {
      options.element.addEventListener("keydown", gotKeyDown, false);
      options.element.addEventListener("keyup", gotKeyUp, false);
    }
    if(options.useKeyboard) {
      options.element.addEventListener("keypress", gotKeyPress, false);
    }
    //mouse/touch listeners
    if(options.useTouch) {
      options.element.addEventListener("mousedown", gotMouseDown, false);
      options.element.addEventListener("mouseup", gotMouseUp, false);
      options.element.addEventListener("mousemove", gotMouseMove, false);
      options.element.addEventListener("touchstart", gotTouchStart, false);
      options.element.addEventListener("touchmove", gotTouchMove, false);
      options.element.addEventListener("touchend", gotTouchEnd, false);
      //disable right click
      options.element.addEventListener("contextmenu", function(evt) { evt.preventDefault(); return false; }, false);
    }
    // create the view object
    view = new options.view();
    // begin doing frame actions
    if(options.framerate) {
      window.setInterval(function() {
        logicReady = true;
      }, options.framerate);
    }
    window.requestAnimationFrame(reqAnim);
  }
  
  function reqAnim() {
    //don't accidentally call this method twice at once
    if(doingFrame) return;
    doingFrame = true;
    //if we have a specific framerate to target, skip some frames
    if(!options.framerate || logicReady) {
      logicReady = false;
      if(options.frameskip) {
        ++skippedFrames;
        if(skippedFrames > options.frameskip) {
          skippedFrames = 0;
          doFrame();
        }
      }
      else {
        doFrame();
      }
    }
    //done. unlock method
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
  
  //game button event handlers
  function gotKeyDown(evt) {
    if(!options.useKeyboard) evt.preventDefault();
    var key = options.keyBinds[evt.keyCode];
    if(key === undefined) return true;
    
    if(!buttons[key]) {
      buttons[key] = true;
      if(view.buttondown) return view.buttondown(key);
    }
  }
  function gotKeyUp(evt) {
    var key = options.keyBinds[evt.keyCode];
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
    var x = evt.clientX - (options.element.clientLeft || 0) - (options.element.offsetLeft || 0);
    var y = evt.clientY - (options.element.clientTop || 0) - (options.element.offsetTop || 0);
    var elw = options.element.clientWidth || options.element.innerWidth;
    var elh = options.element.clientHeight || options.element.innerHeight;
    return new nigelgame.Point({
      x: Math.floor(x/elw*screen.width - screen.width/2),
      y: Math.floor(y/elh*screen.height - screen.height/2)
    });
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
    var x = touch.clientX - (options.element.clientLeft || 0) - (options.element.offsetLeft || 0);
    var y = touch.clientY - (options.element.clientTop || 0) - (options.element.offsetTop || 0);
    var elw = options.element.clientWidth || options.element.innerWidth;
    var elh = options.element.clientHeight || options.element.innerHeight;
    return new nigelgame.Point({
      x: Math.floor(x/elw*screen.width - screen.width/2),
      y: Math.floor(y/elh*screen.height - screen.height/2)
    });
  }
};

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

nigelgame.Point = function(params) {
  this.x = params.x || 0;
  this.y = params.y || 0;
  this.xAnchor = params.xAnchor || 0;
  this.yAnchor = params.yAnchor || 0;
};

nigelgame.Point.prototype.xFor = function(outer) {
  return this.xAnchor * outer.width / 2 + this.x;
};

nigelgame.Point.prototype.yFor = function(outer) {
  return this.yAnchor * outer.height / 2 + this.y;
};

nigelgame.Point.prototype.translate = function(params) {
  return new nigelgame.Point({
    x: this.x + (params.x || 0),
    y: this.y + (params.y || 0),
    xAnchor: this.xAnchor + (params.xAnchor || 0),
    yAnchor: this.yAnchor + (params.yAnchor || 0)
  });
};

nigelgame.Point.prototype.untranslate = function(params) {
  return new nigelgame.Point({
    x: this.x - (params.x || 0),
    y: this.y - (params.y || 0),
    xAnchor: this.xAnchor - (params.xAnchor || 0),
    yAnchor: this.yAnchor - (params.yAnchor || 0)
  });
};

nigelgame.Point.prototype.inverse = function() {
  return new nigelgame.Point({
    x: -this.x,
    y: -this.y,
    xAnchor: -this.xAnchor,
    yAnchor: -this.yAnchor
  });
}

nigelgame.Point.prototype.equals = function(params) {
  return this.x == params.x
    && this.y == params.y
    && this.xAnchor == params.xAnchor
    && this.yAnchor == params.yAnchor;
}

nigelgame.Rect = function(p) {
  //make sure boundaries are well-defined for vertical & horizontal
  var ldef=0, rdef=0, wdef=0;
  if(p.left !== undefined || p.leftAnchor !== undefined) ldef = 1;
  if(p.right !== undefined || p.rightAnchor !== undefined) rdef = 1;
  if(p.width !== undefined || p.widthPerc !== undefined) wdef = 1;
  if(ldef + rdef + wdef < 2)
    throw "Horizontal boundaries are not well defined.";
  else if(ldef + rdef + wdef > 2)
    throw "Too many arguments for horizontal boundaries.";
  var tdef=0, bdef=0, hdef=0;
  if(p.top !== undefined || p.topAnchor !== undefined) tdef = 1;
  if(p.bottom !== undefined || p.bottomAnchor !== undefined) bdef = 1;
  if(p.height !== undefined || p.heightPerc !== undefined) hdef = 1;
  if(tdef + bdef + hdef < 2)
    throw "Vertical boundaries are not well defined.";
  else if(tdef + bdef + hdef > 2)
    throw "Too many arguments for vertical boundaries.";
  //assign all fields from info provided
  this.left = ldef? (p.left !== undefined?p.left: (p.right || 0)):
    (p.right || 0) - (p.width || 0);
  this.right = rdef? (p.right !== undefined?p.right: (p.left || 0)):
    (p.left || 0) + (p.width || 0);
  this.top = tdef? (p.top !== undefined?p.top: (p.bottom || 0)):
    (p.bottom || 0) - (p.height || 0);
  this.bottom = bdef? (p.bottom !== undefined?p.bottom: (p.top || 0)):
    (p.top || 0) + (p.height || 0);
  this.leftAnchor = ldef? (p.leftAnchor !== undefined?p.leftAnchor: (p.rightAnchor || 0)):
    (p.rightAnchor || 0) - (p.widthPerc*2 || 0);
  this.rightAnchor = rdef? (p.rightAnchor !== undefined?p.rightAnchor: (p.leftAnchor || 0)):
    (p.leftAnchor || 0) + (p.widthPerc*2 || 0);
  this.topAnchor = tdef? (p.topAnchor !== undefined?p.topAnchor: (p.bottomAnchor || 0)):
    (p.bottomAnchor || 0) - (p.heightPerc*2 || 0);
  this.bottomAnchor = bdef? (p.bottomAnchor !== undefined?p.bottomAnchor: (p.topAnchor || 0)):
    (p.topAnchor || 0) + (p.heightPerc*2 || 0);
  this.width = this.right - this.left;
  this.height = this.bottom - this.top;
  this.widthPerc = (this.rightAnchor - this.leftAnchor)/2;
  this.heightPerc = (this.bottomAnchor - this.topAnchor)/2;
};

nigelgame.Rect.prototype.leftFor = function(outer) {
  return this.left + this.leftAnchor * outer.width / 2;
};

nigelgame.Rect.prototype.rightFor = function(outer) {
  return this.right + this.rightAnchor * outer.width / 2;
};

nigelgame.Rect.prototype.topFor = function(outer) {
  return this.top + this.topAnchor * outer.height / 2;
};

nigelgame.Rect.prototype.bottomFor = function(outer) {
  return this.bottom + this.bottomAnchor * outer.height / 2;
};

nigelgame.Rect.prototype.widthFor = function(outer) {
  return this.width + this.widthPerc * outer.width;
};

nigelgame.Rect.prototype.heightFor = function(outer) {
  return this.height + this.heightPerc * outer.height;
};

nigelgame.Rect.prototype.expand = function(params) {
  return new nigelgame.Rect({
    top: this.top - (params.top || 0),
    bottom: this.bottom + (params.bottom || 0),
    left: this.left - (params.left || 0),
    right: this.right + (params.right || 0),
    leftAnchor: this.leftAnchor - (params.leftAnchor || 0),
    rightAnchor: this.rightAnchor + (params.rightAnchor || 0),
    topAnchor: this.topAnchor - (params.topAnchor || 0),
    bottomAnchor: this.bottomAnchor + (params.bottomAnchor || 0)
  });
};

nigelgame.Rect.prototype.shrink = function(params) {
  return new nigelgame.Rect({
    top: this.top + (params.top || 0),
    bottom: this.bottom - (params.bottom || 0),
    left: this.left + (params.left || 0),
    right: this.right - (params.right || 0),
    leftAnchor: this.leftAnchor + (params.leftAnchor || 0),
    rightAnchor: this.rightAnchor - (params.rightAnchor || 0),
    topAnchor: this.topAnchor + (params.topAnchor || 0),
    bottomAnchor: this.bottomAnchor - (params.bottomAnchor || 0)
  });
};

nigelgame.Rect.prototype.translate = function(params) {
  return new nigelgame.Rect({
    top: this.top + (params.y || 0),
    bottom: this.bottom + (params.y || 0),
    left: this.left + (params.x || 0),
    right: this.right + (params.x || 0),
    leftAnchor: this.leftAnchor + (params.xAnchor || 0),
    rightAnchor: this.rightAnchor + (params.xAnchor || 0),
    topAnchor: this.topAnchor + (params.yAnchor || 0),
    bottomAnchor: this.bottomAnchor + (params.yAnchor || 0)
  });
};

nigelgame.Rect.prototype.untranslate = function(params) {
  return new nigelgame.Rect({
    top: this.top - (params.y || 0),
    bottom: this.bottom - (params.y || 0),
    left: this.left - (params.x || 0),
    right: this.right - (params.x || 0),
    leftAnchor: this.leftAnchor - (params.xAnchor || 0),
    rightAnchor: this.rightAnchor - (params.xAnchor || 0),
    topAnchor: this.topAnchor - (params.yAnchor || 0),
    bottomAnchor: this.bottomAnchor - (params.yAnchor || 0)
  });
};

nigelgame.Rect.prototype.contains = function(point, outer) {
  if(!(point instanceof nigelgame.Point)) point = new nigelgame.Point(point);
  var px = point.xFor(outer);
  var py = point.yFor(outer);
  return px >= this.leftFor(outer) && px <= this.rightFor(outer)
    && py >= this.topFor(outer) && py <= this.bottomFor(outer);
};

nigelgame.Rect.prototype.pointIn = function(point) {
  if(!(point instanceof nigelgame.Point)) point = new nigelgame.Point(point);
  return new nigelgame.Point({
    x: this.left + this.width * (point.xAnchor+1) / 2 + point.x,
    y: this.top + this.height * (point.yAnchor+1) / 2 + point.y,
    xAnchor: this.leftAnchor + this.widthPerc * (point.xAnchor + 1),
    yAnchor: this.topAnchor + this.heightPerc * (point.yAnchor + 1)
  });
};

nigelgame.Rect.prototype.pointOut = function(point) {
  if(!(point instanceof nigelgame.Point)) point = new nigelgame.Point(point);
  return new nigelgame.Point({
    x: point.x - this.left - this.width * (point.xAnchor+1) / 2,
    y: point.y - this.top - this.height * (point.yAnchor+1) / 2,
    xAnchor: (point.xAnchor - this.leftAnchor) / (this.widthPerc) - 1,
    yAnchor: (point.yAnchor - this.topAnchor) / (this.heightPerc) - 1
  });
};

nigelgame.Rect.prototype.rectIn = function(rect) {
  if(!(rect instanceof nigelgame.Rect)) rect = new nigelgame.Rect(rect);
  return new nigelgame.Rect({
    left: this.left + this.width * (rect.leftAnchor+1) / 2 + rect.left,
    right: this.left + this.width * (rect.rightAnchor+1) / 2 + rect.right,
    top: this.top + this.height * (rect.topAnchor+1) / 2 + rect.top,
    bottom: this.top + this.height * (rect.bottomAnchor+1) / 2 + rect.bottom,
    leftAnchor: this.leftAnchor + (this.widthPerc * 2) * (rect.leftAnchor + 1) / 2,
    rightAnchor: this.leftAnchor + (this.widthPerc * 2) * (rect.rightAnchor + 1) / 2,
    topAnchor: this.topAnchor + (this.heightPerc * 2) * (rect.topAnchor + 1) / 2,
    bottomAnchor: this.topAnchor + (this.heightPerc * 2) * (rect.bottomAnchor + 1) / 2
  });
};

nigelgame.Point.prototype.rectFrom = function(params) {
  var anchor = {
    x: (params.anchor && params.anchor.x) || 0,
    y: (params.anchor && params.anchor.y) || 0
  };
  return new nigelgame.Rect({
    width: params.width,
    height: params.height,
    left: this.x - params.width * (anchor.x + 1) / 2,
    top: this.y - params.height * (anchor.y + 1) / 2,
    leftAnchor: this.xAnchor,
    topAnchor: this.yAnchor
  });
};

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

nigelgame.Screen = function(element, mode, mw, mh, scale) {
  //robust
  if(!mode)
    mode = "scale-adapt";
  else if(nigelgame.Screen.MODES.indexOf(mode.toLowerCase()) === -1)
    throw "unsupported screen mode: " + mode;
  //vars
  mode = mode.toLowerCase();
  mw = mw || element.clientWidth || element.innerWidth;
  mh = mh || element.clientHeight || element.innerWidth;
  Object.defineProperty(this, 'element', { get: function() { return element; } });
  Object.defineProperty(this, 'mode', { get: function() { return mode; } });
  Object.defineProperty(this, 'minWidth', { get: function() { return mw; } });
  Object.defineProperty(this, 'minHeight', { get: function() { return mw; } });
  this.width = undefined;
  this.height = undefined;
  this.drawScale = scale || 1;
  
  //section (the whole thing)
  var subrect = new nigelgame.Rect({ leftAnchor: -1, rightAnchor: 1, topAnchor: -1, bottomAnchor: 1 });
  Object.defineProperty(this, 'subRect', { get: function() { return subrect; } });
  
  //create canvas element
  this.canvas = document.createElement("canvas");
  this.canvas.style.display = "block";
  this.canvas.style.width = "100%";
  this.canvas.style.height = "100%";
  //drawing context
  this.context = this.canvas.getContext("2d");
  //put canvas on page
  ((element !== window)? element: document.getElementsByTagName("body")[0]).appendChild(this.canvas);
  //make it selectable (if it's not just in the window)
  if(this.element !== window && this.element.tabIndex < 0) this.element.tabIndex = 0;
};

nigelgame.Screen.MODES = [ "none", "adapt", "scale-adapt" ];

nigelgame.Panel = function(parent, rect) {
  this.subRect = parent.subRect.rectIn(rect);
  this.screen = parent.screen || parent;
  Object.defineProperty(this, 'canvas', { get: function() { return this.screen.canvas; } });
  Object.defineProperty(this, 'width', { get: function() { return this.subRect.widthFor(parent); } });
  Object.defineProperty(this, 'height', { get: function() { return this.subRect.heightFor(parent); } });
};

nigelgame.Screen.prototype.panel = function(rect) {
  return new nigelgame.Panel(this, rect);
};

nigelgame.Screen.prototype.fitElement = function() {
  //get the current width/height of the elemnt
  var w = this.element.clientWidth || this.element.innerWidth;
  var h = this.element.clientHeight || this.element.innerHeight;
  //if it hasn't changed, skip this step.
  this.wasResized =
    !this.prevDims ||
    this.prevDims.width !== w ||
    this.prevDims.height !== h;
  if(!this.wasResized) return;
  //otherwise, do the correct resize function for the mode
  if(this.mode === "none")
    this.fitElementModeNone(w, h);
  else if(this.mode === "adapt")
    this.fitElementModeAdapt(w, h);
  else if(this.mode === "scale-adapt")
    this.fitElementModeScaleAdapt(w, h);
  //record previous dimensions
  this.prevDims = { height: h, width: w };
};

nigelgame.Screen.prototype.fitElementModeNone = function(w, h) {
  //only resize if the size hasnt yet been set
  if(this.prevDims) return;
  //set the sizes just once
  this.canvas.width = (this.width = this.minWidth) * this.drawScale;
  this.canvas.height = (this.height = this.minHeight) * this.drawScale;
  //crispy if scaled up
  if(this.drawScale > 1) this.crispy();
};

nigelgame.Screen.prototype.fitElementModeAdapt = function(w, h) {
  //resize
  this.canvas.width = (this.width = Math.floor(w/this.drawScale)) * this.drawScale;
  this.canvas.height = (this.height = Math.floor(h/this.drawScale)) * this.drawScale;
  //crispy if scaled up
  if(this.drawScale > 1) this.crispy();
};

nigelgame.Screen.prototype.fitElementModeScaleAdapt = function(w, h) {
  //if the desired aspect ratio is equal
  if(this.minWidth * h === this.minHeight * w) {
    this.width = this.minWidth;
    this.height = this.minHeight;
  }
  //if it needs to be WIDER
  else if(this.minWidth * h < this.minHeight * w) {
    this.width = Math.floor(w / h * this.minHeight);
    this.height = this.minHeight;
  }
  //if it needs to be TALLER
  else {
    this.width = this.minWidth;
    this.height = Math.floor(h / w * this.minWidth);
  }
  //draw at a lower scale...
  this.drawScale = Math.floor(Math.min(h/this.height, w/this.width));
  if(this.drawScale < 1) this.drawScale = 1; //unless it's smaller than minimum
  this.canvas.width = this.width * this.drawScale;
  this.canvas.height =  this.height * this.drawScale;
  //crispy
  this.crispy();
  //if the view is the whole window, then keep it at the right location
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

nigelgame.Screen.prototype.getRect = function() {
  return new nigelgame.Rect({
    left: -this.width/2,
    top: -this.height/2,
    width: this.width,
    height: this.height
  });
};

nigelgame.Screen.prototype.clear = 
nigelgame.Panel.prototype.clear = function(rect) {
  //basic screen, just clear the whole thing quickly
  if(!rect && !this.screen) {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    return;
  }
  //for panels, if no rect provided, assume full panel
  if(!rect) {
    rect = this.subRect;
  }
  if(!(rect instanceof nigelgame.Rect)) rect = new nigelgame.Rect(rect);
  //rect position
  var scr = this.screen || this;
  var w2 = scr.width/2, h2 = scr.height/2;
  var w = Math.round(rect.widthFor(scr));
  var h = Math.round(rect.heightFor(scr));
  var l = Math.round(rect.leftFor(scr) + w2);
  var t = Math.round(rect.topFor(scr) + h2);
  var ll = Math.round(this.subRect.leftFor(scr) + w2);
  var lt = Math.round(this.subRect.topFor(scr) + h2);
  if(l < ll) { w -= ll - l; l = ll; }
  if(t < lt) { h -= lt - t; t = lt; }
  var lr = Math.round(this.subRect.rightFor(scr) + w2);
  var lb = Math.round(this.subRect.bottomFor(scr) + h2);
  if(l + w > lr) w = lr - l;
  if(t + h > lb) h = lb - t;
  if(w <= 0 || h <= 0) return;
  //clear it
  scr.context.clearRect(
    l * scr.drawScale, t * scr.drawScale,
    w * scr.drawScale, h * scr.drawScale
  );
};

nigelgame.Screen.prototype.fill =
nigelgame.Panel.prototype.fill = function(color, rect) {
  //robust arguments
  if(rect && !(rect instanceof nigelgame.Rect)) rect = new nigelgame.Rect(rect);
  var scr = this.screen || this;
  //set color
  var temp = scr.context.fillStyle;
  scr.context.fillStyle = color;
  //rect
  rect = rect? this.subRect.rectIn(rect): this.subRect;
  //rect position
  var w2 = scr.width/2, h2 = scr.height/2;
  var w = Math.round(rect.widthFor(scr));
  var h = Math.round(rect.heightFor(scr));
  var l = Math.round(rect.leftFor(scr) + w2);
  var t = Math.round(rect.topFor(scr) + h2);
  var ll = Math.round(this.subRect.leftFor(scr) + w2);
  var lt = Math.round(this.subRect.topFor(scr) + h2);
  if(l < ll) { w -= ll - l; l = ll; }
  if(t < lt) { h -= lt - t; t = lt; }
  var lr = Math.round(this.subRect.rightFor(scr) + w2);
  var lb = Math.round(this.subRect.bottomFor(scr) + h2);
  if(l + w > lr) w = lr - l;
  if(t + h > lb) h = lb - t;
  if(w <= 0 || h <= 0) return;
  //draw the rectangle
  scr.context.fillRect(
    l * scr.drawScale, t * scr.drawScale,
    w * scr.drawScale, h * scr.drawScale
  );
  //set color back
  scr.context.fillStyle = temp;
};

nigelgame.Screen.prototype.drawSprite =
nigelgame.Panel.prototype.drawSprite = function(sprite, point, options) {
  //robust arguments
  if(sprite instanceof nigelgame.Sheet) sprite = sprite.getSprite();
  else if(!sprite.sheet || !sprite.rect) throw "invalid sprite.";
  var anchor = (options && options.anchor) || {};
  if(anchor.x === undefined) anchor.x = point.xAnchor || 0;
  if(anchor.y === undefined) anchor.y = point.yAnchor || 0;
  //point relative to Panel rect
  point = this.subRect.pointIn(point);
  //onscreen location
  var scr = this.screen || this;
  var w2 = scr.width/2, h2 = scr.height/2;
  var w = sprite.rect.widthFor(sprite.sheet);
  var h = sprite.rect.heightFor(sprite.sheet);
  var l = Math.round(point.xFor(scr) + w2 - (anchor.x + 1) / 2 * w);
  var t = Math.round(point.yFor(scr) + h2 - (anchor.y + 1) / 2 * h);
  var ll = Math.round(this.subRect.leftFor(scr) + w2);
  var lt = Math.round(this.subRect.topFor(scr) + h2);
  var offx = 0, offy = 0;
  if(l < ll) { offx = ll - l; w -= offx; l = ll; }
  if(t < lt) { offy = lt - t; h -= offy; t = lt; }
  var lr = Math.round(this.subRect.rightFor(scr) + w2);
  var lb = Math.round(this.subRect.bottomFor(scr) + h2);
  if(l + w > lr) w = lr - l;
  if(t + h > lb) h = lb - t;
  if(w <= 0 || h <= 0) return;
  //draw it to the screen
  scr.context.drawImage(sprite.sheet.img,
    //location on the spritesheet
    sprite.rect.leftFor(sprite.sheet) + offx, sprite.rect.topFor(sprite.sheet) + offy,
    w, h,
    //location on screen
    l * scr.drawScale, t * scr.drawScale,
    w * scr.drawScale, h * scr.drawScale
  );
};

nigelgame.Screen.prototype.drawString =
nigelgame.Panel.prototype.drawString = function(text, font, point, options) {
  if(!(font instanceof nigelgame.Sheet)) throw "invalid font in drawString.";
  if(!(point instanceof nigelgame.Point)) point = new nigelgame.Point(point);
  //robust arguments
  options = options || {};
  if(options.cols || options.rows)
    text = nigelgame.wrapString(text, options.cols, options.rows);
  point = point || new nigelgame.Point({ x: 0, y: 0 });
  var anchor = (options && options.anchor) || {};
  if(anchor.x === undefined) anchor.x = point.xAnchor || 0;
  if(anchor.y === undefined) anchor.y = point.yAnchor || 0;
  //format text into lines & get max column width
  var lines = text.split('\n');
  var maxcol = 0;
  for(var i = 0; i < lines.length; ++i) maxcol = Math.max(lines[i].length, maxcol);
  //how to align the text?
  var align = 0;
  if(!options || !options.align || options.align === "left") align = 0;
  else if(options.align === "center") align = 0.5;
  else if(options.align === "right") align = 1;
  else throw "unknown text alignment: " + options.align;
  //top left text point
  var tl = point.translate({
    x: -maxcol * font.spriteWidth * (anchor.x+1) / 2,
    y: -lines.length * font.spriteHeight * (anchor.y+1) / 2
  });
  //print all characters
  for(var r = 0; r < lines.length; ++r) {
    var indent = (maxcol-lines[r].length)*align;
    var pt = tl.translate({ x: indent*font.spriteWidth, y: r*font.spriteHeight });
    for(var c = 0; c < lines[r].length; ++c) {
      //get character and draw it
      var ch = lines[r].charCodeAt(c) - 32;
      this.drawSprite(font.getSprite(ch), pt, { anchor: { x: -1, y: -1 } });
      pt = pt.translate({ x: font.spriteWidth });
    }
  }
};

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

nigelgame.sheets = {};

nigelgame.loadImages = function(sheetList, callback) {
  var numRequested = 0;
  var numLoaded = 0;
  
  for(var i = 0; i < sheetList.length; ++i) {
    if(!sheetList[i].src) throw "missing source image";
    if(!sheetList[i].alias) throw "missing alias";
    if(nigelgame.sheets[sheetList[i].alias]) {
      var oldsheet = nigelgame.sheets[sheetList[i].alias];
      if(oldsheet.src === sheetList[i].src)
        continue;
      else
        throw "Sheet already defined with alias " + oldsheet.alias + "(" + oldsheet.src + ", " + sheetList[i].src + ")";
    }
    loadSheet(sheetList[i]);
  }
  if(numRequested === 0) {
    callback();
  }
  function loadSheet(sheetInfo) {
    var img = new Image();
    img.onload = onLoadedFile;
    img.onerror = function() {
      throw "Failed to load image " + sheetInfo.src;
    }
    img.src = sheetInfo.src;
    ++numRequested;
    
    function onLoadedFile() {
      nigelgame.sheets[sheetInfo.alias] = new nigelgame.Sheet(
        sheetInfo.alias, img, sheetInfo.src, sheetInfo.spriteWidth, sheetInfo.spriteHeight
      );
      ++numLoaded;
      if(numLoaded >= numRequested) {
        callback();
      }
    }

  }
};

nigelgame.Sheet = function(alias, img, src, spriteWidth, spriteHeight) {
  this.alias = alias;
  this.img = img;
  this.src = src;
  this.width = img.width;
  this.height = img.height;
  this.spriteWidth = spriteWidth || this.width;
  this.spriteHeight = spriteHeight || this.height;
  this.numCols = Math.floor(this.width / this.spriteWidth);
  this.numRows = Math.floor(this.height / this.spriteHeight);
  this.numSprites = this.numCols * this.numRows;
};

nigelgame.Sheet.prototype.getSprite = function(frame) {
  return new nigelgame.Sprite(this, frame);
};

nigelgame.Sprite = function(sheet, frame) {
  if((typeof frame === "number") && (frame%1)===0) {
    frame = { col: frame % sheet.numCols, row: Math.floor(frame / sheet.numCols) };
  }
  var fx = (frame!==undefined)? (frame.x!==undefined? frame.x: frame.col? frame.col*sheet.spriteWidth: 0): 0;
  var fy = (frame!==undefined)? (frame.y!==undefined? frame.y: frame.row? frame.row*sheet.spriteHeight: 0): 0;
  var fw = (frame!==undefined)? (frame.width!==undefined? frame.width: (frame.col!==undefined? sheet.spriteWidth: sheet.width-fx)): sheet.width-fx;
  var fh = (frame!==undefined)? (frame.height!==undefined? frame.height: (frame.row!==undefined? sheet.spriteHeight: sheet.height-fy)): sheet.height-fy;
  
  this.sheet = sheet;
  this.rect = new nigelgame.Rect({
    left: fx,
    top: fy,
    width: fw,
    height: fh
  });
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