var nigelgame = {};

nigelgame.start = function(options) {
  //initialize some things
  var buttons = {};
  var mouseState = {
    startPoint: null,
    lastPoint: null
  }
  var view = options.view;
  var logicReady = true;
  var doingFrame = false;
  var totalClock = 0;
  var viewClock = 0;
  //setup screen
  var screen = new nigelgame.Screen(
    options.element, options.width || null, options.height || null
  );
  
  //load images
  if(options.sheets && options.sheets.length > 0) {
    nigelgame.loadImages(options.sheets, loadedImages);
  }
  else {
    loadedImages();
  }
  
  function loadedImages() {
    //key listeners
    if(options.keyBinds) {
      options.element.addEventListener("keydown", gotKeyDown, false);
      options.element.addEventListener("keyup", gotKeyUp, false);
    }
    //mouse listeners
    if(options.useTouch) {
      options.element.addEventListener("mousedown", gotMouseDown, false);
      options.element.addEventListener("mouseup", gotMouseUp, false);
      options.element.addEventListener("mousemove", gotMouseMove, false);
    }
    // begin doing frame actions
    window.requestAnimationFrame(reqAnim);
    window.setInterval(function() {
      logicReady = true;
    }, options.minFreq || 33);
  }
  
  function reqAnim() {
    if(doingFrame) return;
    doingFrame = true;
    if(logicReady) {
      logicReady = false;
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
    doingFrame = false;
    window.requestAnimationFrame(reqAnim);
  }
  
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
  
  function gotMouseDown(evt) {
    var point = mousePoint(evt);
    mouseState.startPoint = point;
    mouseState.lastPoint = point;
    if(view.touch) view.touch(point, "mouse");
  }
  function gotMouseMove(evt) {
    if(!mouseState.startPoint) return;
    var point = mousePoint(evt);
    point.startPoint = mouseState.startPoint;
    point.lastPoint = mouseState.lastPoint;
    point.lastPoint.startPoint = undefined;
    point.lastPoint.lastPoint = undefined;
    mouseState.lastPoint = point;
    if(view.drag) view.drag(point, "mouse");
  }
  function gotMouseUp(evt) {
    if(view.release && mouseState.startPoint) {
      var point = mousePoint(evt);
      point.startPoint = mouseState.startPoint;
      view.release(point, "mouse");
    }
    mouseState.startPoint = null;
    mouseState.lastPoint = null;
  }
  
  //auxilliary functions for touches
  function point(x, y) {
    var sw = screen.width;
    var sh = screen.height;
    return {
      fromScreenLeft: x,
      fromScreenTop: y,
      fromScreenRight: sw - x,
      fromScreenBottom: sh - y,
      fromCenterX: Math.round(x-sw/2),
      fromCenterY: Math.round(y-sh/2),
      hPercent: x / sw * 100,
      vPercent: y / sh * 100,
      inBounds: x >= 0 && y >= 0 && x < sw && y < sh
    };
  }
  function mousePoint(evt) {
    var x = evt.clientX - (options.element.clientLeft || 0) - (options.element.offsetLeft || 0);
    var y = evt.clientY - (options.element.clientTop || 0) - (options.element.offsetTop || 0);
    return point(
      Math.floor(x*screen.width/(options.element.clientWidth || options.element.innerWidth)),
      Math.floor(y*screen.height/(options.element.clientHeight || options.element.innerHeight))
    );
  }
};