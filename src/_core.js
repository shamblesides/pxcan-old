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
  
  //auxilliary functions for touches
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
};