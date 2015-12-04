function nigelgame(element) {
  var resourceReqs = 0;
  var resourceCallback = null;
  
  // setup screen
  var screen = new nigelgame.Screen(element);
  this.setScreenMode = function() { screen.mode.apply(screen, arguments); };
  this.setScreenSize = function() { screen.setSize.apply(screen, arguments); };
  this.setScreenScale = function() { screen.setScale.apply(screen, arguments); };
  
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
    
    // utility mouse functions
    function touchPointFromEvt(evt) {
      return new TouchPoint(
        Math.floor((evt.clientX - (element.clientLeft || 0) - (element.offsetLeft || 0))/(element.clientWidth || element.innerWidth)*screen.width),
        Math.floor((evt.clientY - (element.clientTop || 0) - (element.offsetTop || 0))/(element.clientHeight || element.innerHeight)*screen.height),
        null
      );
    }
    function TouchPoint(x,y,rel) {
      this.x = x + (rel && rel.left || 0);
      this.y = y + (rel && rel.top || 0);
      this.equals = function(pt) {
        return this.x === pt.x && this.y === pt.y;
      };
      this.inBounds = function() {
        if(!rel) return
          this.x >= 0 && this.y >= 0
          && this.x < screen.width && this.y < screen.height;
        return
          this.x > screen.left && this.x <= screen.right
          && this.y > screen.top && this.y <= screen.bottom;
      };
      this.relativeTo = function(pan) {
        return new TouchPoint(
          this.x - (rel && rel.left || 0),
          this.y - (rel && rel.top || 0),
          pan
        );
      };
    }
    function mouseWhich(evt) {
      return (evt.button === 2)? "rightmouse": "mouse";
    }
    
    // mouse event handlers
    function gotMouseDown(mouseEvt) {
      var evt = {
        screen: screen,
        type: mouseWhich(mouseEvt),
        point: touchPointFromEvt(mouseEvt)
      };
      if(view.touch) view.touch(evt);
      mouseState.startPoint = evt.point;
      mouseState.lastPoint = evt.point;
      mouseState.button = evt.type;
    }
    function gotMouseMove(mouseEvt) {
      if(!mouseState.startPoint) return;
      var evt = {
        screen: screen,
        type: mouseState.button,
        point: touchPointFromEvt(mouseEvt),
        lastPoint: mouseState.lastPoint,
        startPoint: mouseState.startPoint,
      };
      if(evt.point.equals(evt.lastPoint)) return;
      if(view.drag) view.drag(evt);
      mouseState.lastPoint = evt.point;
    }
    function gotMouseUp(mouseEvt) {
      if(view.release && mouseState.startPoint && mouseState.button === mouseWhich(mouseEvt)) {
        view.release({
          screen: screen,
          type: mouseState.button,
          point: touchPointFromEvt(mouseEvt),
          startPoint: mouseState.startPoint,
        });
      }
      mouseState.startPoint = null;
      mouseState.lastPoint = null;
    }
    
    //touch events handlers
    function gotTouchStart(touchEvt) {
      touchEvt.preventDefault();
      // if this isn't the first touch, ignore it
      if(touchEvt.touches.length !== touchEvt.changedTouches.length) return;
      // issue event
      var evt = {
        screen: screen,
        type: 'touch',
        point: touchPointFromEvt(touchEvt.changedTouches[0])
      };
      if(view.touch) view.touch(evt);
      touchState.startPoint = evt.point;
      touchState.lastPoint = evt.point;
      touchState.id = touchEvt.changedTouches[0].identifier;
    }
    function gotTouchMove(touchEvt) {
      touchEvt.preventDefault();
      if(!touchState.startPoint) return;
      // look at all moved touches
      var i = 0;
      for(i = 0 ;; ++i) {
        if(i === touchEvt.changedTouches.length) return;
        if(touchEvt.changedTouches[i].identifier === touchState.id) break;
      }
      // if we got to this point, do this touch
      var evt = {
        screen: screen,
        type: 'touch',
        point: touchPointFromEvt(touchEvt.changedTouches[i]),
        lastPoint: touchState.lastPoint,
        startPoint: touchState.startPoint
      };
      if(evt.point.equals(evt.lastPoint)) return;
      if(view.drag) view.drag(evt);
      mouseState.lastPoint = evt.point;
    }
    function gotTouchEnd(touchEvt) {
      touchEvt.preventDefault();
      if(!touchState.startPoint) return;
      // look at all released touches
      var i = 0;
      for(i = 0 ;; ++i) {
        if(i === touchEvt.changedTouches.length) return;
        if(touchEvt.changedTouches[i].identifier === touchState.id) break;
      }
      // if this is the only touch, send release evt
      if(touchEvt.targetTouches.length===0) {
        if(view.release) view.release({
          screen: screen,
          type: 'touch',
          point: touchPointFromEvt(touchEvt.changedTouches[i]),
          startPoint: touchState.startPoint
        });
        touchState.id = null;
        touchState.startPoint = null;
        touchState.lastPoint = null;
      }
      // otherwise there are still other touches;
      // treat as 'drag' event to latest touch
      else {
        var nextTouch = touchEvt.targetTouches[touchEvt.targetTouches.length-1];
        var point = touchPointFromEvt(nextTouch);
        if(view.drag) view.drag({
          screen: screen,
          type: 'touch',
          point: point,
          lastPoint: touchState.lastPoint,
          startPoint: touchState.startPoint
        });
        touchState.id = nextTouch.identifier;
        touchState.lastPoint = point;
      }
    }
  }
}

nigelgame.sheets = {};
nigelgame.json = {};