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
};

nigelgame.Screen.prototype.panel = function(rect) {
  return new nigelgame.Panel(this, rect);
}

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