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

window.requestAnimationFrame =
  window.requestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.oRequestAnimationFrame;

nigelgame.Point = function(params) {
  this.x = params.x || 0;
  this.y = params.y || 0;
  this.xAnchor = params.xAnchor || 0;
  this.yAnchor = params.yAnchor || 0;
};
nigelgame.Point.prototype.xFor = function(screen) {
  return Math.round(this.xAnchor * screen.width / 100 + this.x);
};
nigelgame.Point.prototype.yFor = function(screen) {
  return Math.round(this.yAnchor * screen.height / 100 + this.y);
};
nigelgame.Point.prototype.coordsFor = function(screen) {
  return { x: this.xFor(screen), y: this.yFor(screen) };
};
nigelgame.Point.prototype.translate = function(params) {
  return new nigelgame.Point({
    x: this.x + (params.x || 0),
    y: this.y + (params.y || 0),
    xAnchor: this.xAnchor + (params.xAnchor || 0),
    yAnchor: this.yAnchor + (params.yAnchor || 0)
  });
};

nigelgame.Screen = function(element, mw, mh) {
  //vars
  this.element = element;
  this.minWidth = mw || element.clientWidth || element.innerWidth;
  this.minHeight = mh || element.clientHeight || element.innerWidth;
  this.width = undefined;
  this.height = undefined;
  this.drawScale = undefined;
  
  //create canvas element
  this.canvas = document.createElement("canvas");
  this.canvas.style.display = "block";
  this.canvas.style.width = "100%";
  this.canvas.style.height = "100%";
  this.canvas.style.backgroundColor = "#000";
  //drawing context
  this.context = this.canvas.getContext("2d");
  //put canvas on page
  var parent = (element !== window)? element: document.getElementsByTagName("body")[0];
  parent.appendChild(this.canvas);
  //make it selectable (if it's not just in the window)
  if(this.element !== window && this.element.tabIndex < 0) this.element.tabIndex = 0;
  //fit to div
  this.fitElement();
};

nigelgame.Screen.prototype.fitElement = function() {
  var w = this.element.clientWidth || this.element.innerWidth;
  var h = this.element.clientHeight || this.element.innerHeight;
  //if it hasn't changed, skip this step.
  if(this.prevDims && this.prevDims.width === w && this.prevDims.height === h) {
    return;
  }
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
  this.context.webkitImageSmoothingEnabled =
    this.context.imageSmoothingEnabled =
    this.context.mozImageSmoothingEnabled =
    this.context.oImageSmoothingEnabled = false;
  //remember this so it doesn't have to do it again
  this.prevDims = { height: h, width: w };
  //if the view is the whole window, then keep it at the right location
  if(this.element === window) {
    window.scrollTo(0, 0);
  }
};

nigelgame.Screen.prototype.clear = function() {
  this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
};

nigelgame.Screen.prototype.fill = function(point, width, height, color) {
  var temp = this.context.fillStyle;
  this.context.fillStyle = color;
  this.context.fillRect(
    point.xFor(this) * this.drawScale,
    point.yFor(this) * this.drawScale,
    width * this.drawScale,
    height * this.drawScale
  );
  this.context.fillStyle = temp;
};

nigelgame.Screen.prototype.drawSprite = function(sheet, point, frame) {
  //extrapolate frame dimensions
  var f = sheet.getFrameRect(frame);
  //draw it to the screen
  this.context.drawImage(sheet.img,
    //location on the spritesheet
    f.left, f.top, f.width, f.height,
    //location on screen
    point.xFor(this) * this.drawScale, point.yFor(this) * this.drawScale, f.width * this.drawScale, f.height * this.drawScale
  );
};

nigelgame.Screen.prototype.drawString = function(text, font, point, cols, rows) {
  //where to draw at on the screen?
  var coords = (point || new nigelgame.Point({ x: 0, y: 0 })).coordsFor(this);
  //loop thru chars
  var c = 0, r = 0;
  for(var i = 0; i < text.length; ++i) {
    if(text.charAt(i) === '\n') {
      //newline
      ++r;
      c = 0;
      if(r>=rows) break;
    }
    else {
      //reset if at eol
      if(c >= cols) {
        ++r;
        c = 0;
        if(r>=rows) break;
      }
      //get character and draw it
      var ch = text.charCodeAt(i) - 32;
      this.drawSprite(font, point.translate({ x: c*font.spriteWidth, y: r*font.spriteHeight }), ch);
      //advance cursor
      ++c;
    }
  }
};

nigelgame.Screen.prototype.drawStringBox = function(box, color, text, font, point, cols, rows) {
  //calculate dimensions
  var width = cols * font.spriteWidth + 2 * box.spriteWidth;
  var height = rows * font.spriteHeight + 2 * box.spriteHeight;
  //horizontal 
  for(var di = box.spriteWidth, i = di; i <= width-di; i += di) {
    //top
    this.drawSprite(box, point.translate({ x: i, y: 0 }), {row:0, col:1});
    //bottom
    this.drawSprite(box, point.translate({ x: i, y: height - box.spriteHeight }), {row:2, col:1});
  }
  //vertical
  for(var di = box.spriteHeight, i = di; i <= height-di; i += di) {
    //left
    this.drawSprite(box, point.translate({ x: 0, y: i }), {row:1, col:0});
    //right
    this.drawSprite(box, point.translate({ x: width-box.spriteWidth, y: i }), {row:1, col:2});
  }
  //corners
  this.drawSprite(box, point, {row: 0, col: 0});
  this.drawSprite(box, point.translate({ x: width-box.spriteWidth }), {row: 0, col: 2});
  this.drawSprite(box, point.translate({ y: height-box.spriteHeight }), {row: 2, col: 0});
  this.drawSprite(box, point.translate({ x: width-box.spriteWidth, y: height-box.spriteHeight }), {row: 2, col: 2});
  //positioning of interior content
  var contentPos = point.translate({ x: box.spriteWidth, y: box.spriteHeight })
  //fill inside of box
  this.fill(contentPos, cols * font.spriteWidth, rows * font.spriteHeight, color);
  //message, if any
  if(text) {
    this.drawString(text, font, contentPos, cols, rows);
  }
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
};

nigelgame.Sheet.prototype.getFrameRect = function(frame) {
  if(frame!==undefined && (typeof frame === "number") && (frame%1)===0) {
    frame = { col: frame % this.numCols, row: Math.floor(frame / this.numCols) };
  }
  var fx = (frame!==undefined)? (frame.x!==undefined? frame.x: frame.col? frame.col*this.spriteWidth: 0): 0;
  var fy = (frame!==undefined)? (frame.y!==undefined? frame.y: frame.row? frame.row*this.spriteHeight: 0): 0;
  var fw = (frame!==undefined)? (frame.width!==undefined? frame.width: (frame.col!==undefined? this.spriteWidth: this.img.width-fx)): this.img.width-fx;
  var fh = (frame!==undefined)? (frame.height!==undefined? frame.height: (frame.row!==undefined? this.spriteHeight: this.img.height-fy)): this.img.height-fy;
  return {
    left: fx,
    top: fy,
    right: fx + fw,
    bottom: fy + fh,
    width: fw,
    height: fh
  };
};