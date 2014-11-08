var nigelgame = {};

nigelgame.start = function(options) {
  //initialize some things
  var buttons = {};
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
    //listeners
    if(options.keyBinds) {
      options.element.addEventListener("keydown", gotKeyDown, false);
      options.element.addEventListener("keyup", gotKeyUp, false);
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
};