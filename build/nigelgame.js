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

nigelgame.Rect = function(p) {
  if((p.left !== undefined) + (p.right !== undefined) + (p.width !== undefined) !== 2)
    throw "Horizontal boundaries are not well defined.";
  if((p.top !== undefined) + (p.bottom !== undefined) + (p.height !== undefined) !== 2)
    throw "Vertical boundaries are not well defined.";
  if(p.point instanceof nigelgame.Point) this.point = p.point;
  else if(typeof(p.point) === "object") this.point = new nigelgame.Point(p.point);
  else if(!p.point) this.point = new nigelgame.Point({});
  else throw "strange point given to Rect";
  this.left = (p.left !== undefined)? p.left: (p.width - p.right);
  this.right = (p.right !== undefined)? p.right: (p.width - p.left);
  this.top = (p.top !== undefined)? p.top: (p.height - p.bottom);
  this.bottom = (p.bottom !== undefined)? p.bottom: (p.height - p.top);
  this.width = this.left + this.right;
  this.height = this.top + this.bottom;
}
nigelgame.Rect.prototype.leftFor = function(outer) {
  return this.point.xFor(outer) - this.left;
}
nigelgame.Rect.prototype.rightFor = function(outer) {
  return this.point.xFor(outer) + this.right;
}
nigelgame.Rect.prototype.topFor = function(outer) {
  return this.point.yFor(outer) - this.top;
}
nigelgame.Rect.prototype.bottomFor = function(outer) {
  return this.point.yFor(outer) + this.bottom;
}
nigelgame.Rect.prototype.translate = function(params) {
  this.point.translate(params);
}
nigelgame.Rect.prototype.resize = function(params) {
  return new nigelgame.Rect({
    point: this.point,
    left: this.left + (params.left || 0),
    right: this.right + (params.right || 0),
    top: this.top + (params.top || 0),
    bottom: this.bottom + (params.bottom)
  });
}

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

nigelgame.Screen.prototype.fill = function(rect, color) {
  //robust arguments
  if(!(rect instanceof nigelgame.Rect)) rect = new nigelgame.Rect(rect);
  //set color
  var temp = this.context.fillStyle;
  this.context.fillStyle = color;
  //draw the rectangle
  this.context.fillRect(
    rect.leftFor(this) * this.drawScale,
    rect.topFor(this) * this.drawScale,
    rect.width * this.drawScale,
    rect.height * this.drawScale
  );
  //set color back
  this.context.fillStyle = temp;
};

nigelgame.Screen.prototype.drawSprite = function(sprite, point, options) {
  //robust arguments
  if(sprite instanceof nigelgame.Sheet) sprite = sprite.getSprite();
  else if(!sprite.sheet || !sprite.rect) throw "invalid sprite.";
  if(!(point instanceof nigelgame.Point)) point = new nigelgame.Point(point);
  anchor = (options && options.anchor) || {}
  anchor.x = anchor.x || 0;
  anchor.y = anchor.y || 0;
  //onscreen location
  var sx = point.xFor(this) + this.width / 2 - (anchor.x + 1) / 2 * sprite.rect.width;
  var sy = point.yFor(this) + this.height / 2 - (anchor.y + 1) / 2 * sprite.rect.height;
  //draw it to the screen
  this.context.drawImage(sprite.sheet.img,
    //location on the spritesheet
    sprite.rect.left, sprite.rect.top, sprite.rect.width, sprite.rect.height,
    //location on screen
    sx * this.drawScale, sy * this.drawScale,
    sprite.rect.width * this.drawScale, sprite.rect.height * this.drawScale
  );
};

nigelgame.Screen.prototype.drawString = function(text, font, point, options) {
  //robust arguments
  if(typeof(text) !== "string") text = text + "";
  if(!(font instanceof nigelgame.Sheet)) throw "invalid font in drawString.";
  if(!(point instanceof nigelgame.Point)) point = new nigelgame.Point(point);
  point = point || new nigelgame.Point({ x: 0, y: 0 });
  options = options || {};
  options.anchor = options.anchor || {};
  options.anchor.x = options.anchor.x || 0;
  options.anchor.y = options.anchor.y || 0;
  //separate into lines
  var lines;
  //if no column limit, just split by newline
  if(!options.cols) {
    lines = text.split('\n');
  }
  //otherwise, split by newline OR line too long
  else {
    lines = [];
    var s = text;
    for(var r = 0; s.length > 0 && !(r >= options.rows); ++r) {
      lines.push(s.substr(0, Math.min(s.indexOf('\n'), options.cols)));
      s = s.substr(Math.min(s.indexOf('\n')+1, options.cols));
    }
  }
  //max line length, needed to format text
  var maxcol = 0;
  lines.forEach(function(x){if(x.length>maxcol)maxcol=x.length;});
  //how to align the text?
  var align = 0;
  if(options.align === "left" || options.align === undefined) align = 0;
  else if(options.align === "center") align = 0.5;
  else if(options.align === "right") align = 1;
  else throw "unknown text alignment: " + options.align;
  //top left text point
  var tl = point.translate({
    x: -maxcol * font.spriteWidth * (options.anchor.x+1) / 2,
    y: -lines.length * font.spriteHeight * (options.anchor.y+1) / 2
  });
  //print all characters
  for(var r = 0; r < lines.length; ++r) {
    var indent = Math.floor((maxcol-lines[r].length)*align);
    var pt = tl.translate({ x: indent*font.spriteWidth, y: r*font.spriteHeight });
    for(var c = 0; c < lines[r].length; ++c) {
      //get character and draw it
      var ch = lines[r].charCodeAt(c) - 32;
      this.drawSprite(font.getSprite(ch), pt, { anchor: { x: -1, y: -1 } });
      pt = pt.translate({ x: font.spriteWidth });
    }
  }
};

nigelgame.Screen.prototype.drawBox = function(box, rect, options) {
  //robust arguments
  if(!(rect instanceof nigelgame.Rect)) rect = new nigelgame.Rect(rect);
  options = options || {};
  options.anchor = options.anchor || {};
  options.anchor.x = options.anchor.x || 0;
  options.anchor.y = options.anchor.y || 0;
  //position on screen
  var pt = rect.point.translate({
    x: -rect.width * (options.anchor.x+1)/2,
    y: -rect.height * (options.anchor.y+1)/2
  });
  //draw the sprites
  var anc = { anchor: { x: -1, y: -1 } };
  //horizontal 
  for(var di = box.spriteWidth, i = di; i <= rect.width-di; i += di) {
    //top
    this.drawSprite(box.getSprite({row:0, col:1}), pt.translate({ x: i, y: 0 }), anc);
    //bottom
    this.drawSprite(box.getSprite({row:2, col:1}), pt.translate({ x: i, y: rect.height - box.spriteHeight }), anc);
  }
  //vertical
  for(var di = box.spriteHeight, i = di; i <= rect.height-di; i += di) {
    //left
    this.drawSprite(box.getSprite({row:1, col:0}), pt.translate({ x: 0, y: i }), anc);
    //right
    this.drawSprite(box.getSprite({row:1, col:2}), pt.translate({ x: rect.width-box.spriteWidth, y: i }), anc);
  }
  //corners
  this.drawSprite(box.getSprite({row: 0, col: 0}), pt, anc);
  this.drawSprite(box.getSprite({row: 0, col: 2}), pt.translate({ x: rect.width-box.spriteWidth }), anc);
  this.drawSprite(box.getSprite({row: 2, col: 0}), pt.translate({ y: rect.height-box.spriteHeight }), anc);
  this.drawSprite(box.getSprite({row: 2, col: 2}), pt.translate({ x: rect.width-box.spriteWidth, y: rect.height-box.spriteHeight }), anc);
  //positioning of interior content
  var inner = rect.resize({top:-8, bottom:-8, left:-8, right:-8});
  //fill inside of box
  if(options && options.color) this.fill(inner, options.color);
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
}

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
}