var nigelgame = {};

nigelgame.start = function(options) {
  //initialize some things
  var buttons = {};
  var mouseState = {
    startPoint: null,
    lastPoint: null
  }
  var touchState = {
    id: null,
    startPoint: null,
    lastPoint: null
  }
  var view = options.view;
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
    //mouse/touch listeners
    if(options.useTouch) {
      options.element.addEventListener("mousedown", gotMouseDown, false);
      options.element.addEventListener("mouseup", gotMouseUp, false);
      options.element.addEventListener("mousemove", gotMouseMove, false);
      options.element.addEventListener("touchstart", gotTouchStart, false);
      options.element.addEventListener("touchmove", gotTouchMove, false);
      options.element.addEventListener("touchend", gotTouchEnd, false);
    }
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
  
  //keyboard event handlers
  function gotKeyDown(evt) {
    var key = options.keyBinds[evt.keyCode];
    if(key === undefined) return;
    
    evt.preventDefault();
    if(!buttons[key]) {
      buttons[key] = true;
      if(view.keydown) view.keydown(key);
    }
  }
  function gotKeyUp(evt) {
    var key = options.keyBinds[evt.keyCode];
    if(key === undefined) return;
    
    if(buttons[key]) {
      buttons[key] = false;
      if(view.keyup) view.keyup(key);
    }
  }
  
  //mouse event handlers
  function gotMouseDown(evt) {
    var point = mousePoint(evt);
    mouseState.startPoint = point;
    mouseState.lastPoint = point;
    if(view.touch) view.touch({
      point: point,
      type: "mouse",
      screenRect: screen.getRect()
    });
  }
  function gotMouseMove(evt) {
    if(!mouseState.startPoint) return;
    var point = mousePoint(evt);
    if(view.drag) view.drag({
      point: point,
      lastPoint: mouseState.lastPoint,
      startPoint: mouseState.startPoint,
      type: "mouse",
      screenRect: screen.getRect()
    });
    mouseState.lastPoint = point;
  }
  function gotMouseUp(evt) {
    if(view.release && mouseState.startPoint) {
      view.release({
        point: mousePoint(evt),
        startPoint: mouseState.startPoint,
        type: "mouse",
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