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