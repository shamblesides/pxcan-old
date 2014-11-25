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
  //make sure boundaries are well-defined for vertical & horizontal
  var hdef = 0;
  if(p.left !== undefined || p.leftAnchor !== undefined) ++hdef;
  if(p.right !== undefined || p.rightAnchor !== undefined) ++hdef;
  if(p.width !== undefined || p.widthPerc !== undefined) ++hdef;
  if(hdef < 2) throw "Horizontal boundaries are not well defined.";
  else if(hdef > 2) throw "Too many arguments for horizontal boundaries.";
  var vdef = 0;
  if(p.top !== undefined || p.topAnchor !== undefined) ++vdef;
  if(p.bottom !== undefined || p.bottomAnchor !== undefined) ++vdef;
  if(p.height !== undefined || p.heightPerc !== undefined) ++vdef;
  if(vdef < 2) throw "Vertical boundaries are not well defined.";
  else if(vdef > 2) throw "Too many arguments for vertical boundaries.";
  //assign all fields from info provided
  this.left = (p.left !== undefined || p.leftAnchor !== undefined)? 
    (p.left || p.right || 0): (p.right || 0) - (p.width || 0);
  this.right = (p.right !== undefined || p.rightAnchor !== undefined)?
    (p.right || p.left || 0): (p.left || 0) + (p.width || 0);
  this.top = (p.top !== undefined || p.topAnchor !== undefined)?
    (p.top || p.bottom || 0): (p.bottom || 0) - (p.height || 0);
  this.bottom = (p.bottom !== undefined || p.bottomAnchor !== undefined)?
    (p.bottom || p.top || 0): (p.top || 0) + (p.height || 0);
  this.leftAnchor = (p.leftAnchor !== undefined || p.left !== undefined)?
    (p.leftAnchor || p.rightAnchor || 0): (p.rightAnchor || 0) - (p.widthPerc*2 || 0);
  this.rightAnchor = (p.rightAnchor !== undefined || p.right !== undefined)?
    (p.rightAnchor || p.leftAnchor || 0): (p.leftAnchor || 0) + (p.widthPerc*2 || 0);
  this.topAnchor = (p.topAnchor !== undefined || p.left !== undefined)?
    (p.topAnchor || p.bottomAnchor || 0): (p.bottomAnchor || 0) - (p.heightPerc*2 || 0);
  this.bottomAnchor = (p.bottomAnchor !== undefined || p.right !== undefined)?
    (p.bottomAnchor || p.topAnchor || 0): (p.topAnchor || 0) + (p.heightPerc*2 || 0);
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
    xAnchor: this.leftAnchor + (this.widthPerc * 2) * (point.xAnchor + 1) / 2,
    yAnchor: this.topAnchor + (this.heightPerc * 2) * (point.yAnchor + 1) / 2,
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
};

nigelgame.Screen.prototype.fitElement = function() {
  var w = this.element.clientWidth || this.element.innerWidth;
  var h = this.element.clientHeight || this.element.innerHeight;
  //if it hasn't changed, skip this step.
  this.wasResized = !this.prevDims || this.prevDims.width !== w || this.prevDims.height !== h;
  if(!this.wasResized) return;
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

nigelgame.Screen.prototype.getRect = function() {
  return new nigelgame.Rect({
    left: -this.width/2,
    top: -this.height/2,
    width: this.width,
    height: this.height
  });
};

nigelgame.Screen.prototype.clear = function() {
  this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
};

nigelgame.Screen.prototype.fill = function(color, rect) {
  //robust arguments
  if(!(rect instanceof nigelgame.Rect)) rect = new nigelgame.Rect(rect);
  //set color
  var temp = this.context.fillStyle;
  this.context.fillStyle = color;
  //draw the rectangle
  this.context.fillRect(
    Math.round(rect.leftFor(this) + this.width / 2) * this.drawScale,
    Math.round(rect.topFor(this) + this.height / 2) * this.drawScale,
    Math.round(rect.widthFor(this)) * this.drawScale,
    Math.round(rect.heightFor(this)) * this.drawScale
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
    sprite.rect.leftFor(sprite.sheet), sprite.rect.topFor(sprite.sheet),
    sprite.rect.widthFor(sprite.sheet), sprite.rect.heightFor(sprite.sheet),
    //location on screen
    Math.round(sx) * this.drawScale, Math.round(sy) * this.drawScale,
    sprite.rect.widthFor(sprite.sheet) * this.drawScale,
    sprite.rect.heightFor(sprite.sheet) * this.drawScale
  );
};

nigelgame.Screen.prototype.drawString = function(text, font, point, options) {
  //robust arguments
  var ns;
  if(text instanceof nigelgame.Nstring) ns = text;
  else {
    if(typeof(text) !== "string") text = text + "";
    ns = new nigelgame.Nstring(text, options.cols, options.rows);
  }
  if(!(font instanceof nigelgame.Sheet)) throw "invalid font in drawString.";
  if(!(point instanceof nigelgame.Point)) point = new nigelgame.Point(point);
  point = point || new nigelgame.Point({ x: 0, y: 0 });
  options = options || {};
  var anchor = options.anchor ?
    { x: options.anchor.x || 0, y: options.anchor.y || 0 } :
    { x: 0, y: 0 };
  //how to align the text?
  var align = 0;
  if(options.align === "left" || options.align === undefined) align = 0;
  else if(options.align === "center") align = 0.5;
  else if(options.align === "right") align = 1;
  else throw "unknown text alignment: " + options.align;
  //top left text point
  var tl = point.translate({
    x: -ns.maxcol * font.spriteWidth * (anchor.x+1) / 2,
    y: -ns.lines.length * font.spriteHeight * (anchor.y+1) / 2
  });
  //print all characters
  for(var r = 0; r < ns.lines.length; ++r) {
    var indent = Math.floor((ns.maxcol-ns.lines[r].length)*align);
    var pt = tl.translate({ x: indent*font.spriteWidth, y: r*font.spriteHeight });
    for(var c = 0; c < ns.lines[r].length; ++c) {
      //get character and draw it
      var ch = ns.lines[r].charCodeAt(c) - 32;
      this.drawSprite(font.getSprite(ch), pt, { anchor: { x: -1, y: -1 } });
      pt = pt.translate({ x: font.spriteWidth });
    }
  }
};

nigelgame.Screen.prototype.drawBox = function(box, rect, color) {
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

nigelgame.Screen.prototype.drawStringBox = function(text, font, box, point, options) {
  //robust args
  if(!(point instanceof nigelgame.Point)) point = new nigelgame.Point(point);
  options = options || {};
  var anchor = options.anchor ?
    { x: options.anchor.x || 0, y: options.anchor.y || 0 } :
    { x: 0, y: 0 };
  //format string
  var nstr = new nigelgame.Nstring(text, options.cols, options.rows);
  //figure out size of box
  var w = (options.cols || nstr.maxcol) * font.spriteWidth + 2 * box.spriteWidth;
  var h = (options.rows || nstr.rows) * font.spriteHeight + 2 * box.spriteHeight;
  var rect = {
    left: point.x - w * (anchor.x+1)/2,
    width: w,
    top: point.y - h * (anchor.y+1)/2,
    height: h,
    leftAnchor: point.xAnchor,
    topAnchor: point.yAnchor
  };
  //draw rect
  this.drawBox(box, rect, options.color);
  //draw the string
  this.drawString(text, font, point.translate({ x: -box.spriteWidth * anchor.x, y: -box.spriteHeight * anchor.y }),
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

nigelgame.Nstring = function(text, cols, rows) {
  //separate into lines
  //if no column limit, just split by newline
  if(!cols) {
    this.lines = text.split('\n');
  }
  //otherwise, split by newline OR line too long
  else {
    this.lines = [];
    var s = text;
    for(var r = 0; s.length > 0 && !(r >= rows); ++r) {
      this.lines.push(s.substr(0, Math.min(s.indexOf('\n'), cols)));
      s = s.substr(Math.min(s.indexOf('\n')+1, cols));
    }
  }
  //max line length, needed to format text
  var maxcol = 0;
  this.lines.forEach(function(x){if(x.length>maxcol)maxcol=x.length;});
  this.maxcol = maxcol;
  //how many rows
  this.rows = this.lines.length;
}