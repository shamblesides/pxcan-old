/* global nigelgame */
nigelgame.Screen.prototype.toCanvasCoords = function(x, y, w, h, xAnc, yAnc) {
  // make sure we got the right number of args
  if([2,4,6].indexOf(arguments.length) === -1)
    throw new Error('bad number of arguments to toCanvasCoords');
  // define xAnc and yAnc if not defined
  if(xAnc === undefined || xAnc === null) xAnc = this.origin().x;
  if(yAnc === undefined || yAnc === null) yAnc = this.origin().y;
  // translate x and y into LEFT and TOP
  var l = Math.round(x + this.offset().x + this.width * (this.origin().x+1)/2 - (w || 0) * (xAnc+1)/2);
  var t = Math.round(y + this.offset().y + this.height * (this.origin().y+1)/2 - (h || 0) * (yAnc+1)/2);
  // convenient drawScale alias
  var s = this.drawScale;
  // return width and height if it's 4 args. otherwise it's a point with 2
  if(arguments.length === 2) return { x: l*s, y: t*s };
  else return { x: l*s, y: t*s, width: w*s, height: h*s };
};

nigelgame.Screen.prototype.clear = 
nigelgame.Panel.prototype.clear = function(x, y, w, h, xAnc, yAnc) {
  // verify valid arguments
  if([0, 4, 6].indexOf(arguments.length) === -1)
    throw new Error('bad arguments for clear');
  // if no arguments are provided, clear the whole area
  if(arguments.length === 0) {
    if(this instanceof nigelgame.Screen) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    else {
      
    }
    return;
  }
  // translate to coordinates on canvas element
  var coords = this.toCanvasCoords(x, y, w, h, xAnc, yAnc);
  // clear canvas
  this.context.clearRect(coords.x, coords.y, coords.width, coords.height);
};

nigelgame.Screen.prototype.reset = function() {
  this.clear();
  this.origin(0, 0);
  this.offset(0, 0);
};

nigelgame.Screen.prototype.fill =
nigelgame.Panel.prototype.fill = function(color, x, y, w, h, xAnc, yAnc) {
  // verify valid arguments
  if([1, 5, 7].indexOf(arguments.length) === -1)
    throw new Error('bad arguments for fill');
  // set color
  var temp = this.context.fillStyle;
  this.context.fillStyle = color;
  // if only the color is provided, fill the whole area
  if(arguments.length === 1) {
    if(this instanceof nigelgame.Screen) {
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    else {
      
    }
    this.context.fillStyle = temp;
    return;
  }
  // translate to coordinates on canvas element
  var coords = this.toCanvasCoords(x, y, w, h);
  // do fill on canvas
  this.context.fillRect(coords.x, coords.y, coords.width, coords.height);
  // set color back
  this.context.fillStyle = temp;
};

nigelgame.Screen.prototype.blit =
nigelgame.Panel.prototype.blit = function(sheetName, frame, x, y, xAnc, yAnc) {
  // verify valid arguments
  if([4, 6].indexOf(arguments.length) === -1)
    throw new Error('bad arguments for blit');
  // get the sheet
  var sheet = nigelgame.sheets[sheetName];
  if(!sheet) throw new Error('unknown sheet: ' + sheetName);
  // if a particular sprite is specified, get it
  var sprite = (frame !== undefined && frame !== null)?
    sheet.getSprite(frame): sheet;
  // coooordinates
  var coords = this.toCanvasCoords(x, y, sprite.width, sprite.height, xAnc, yAnc);
  // draw it to the screen
  this.context.drawImage(
    // image
    sprite.img,
    // location on the spritesheet
    sprite.left, sprite.top, sprite.width, sprite.height,
    // location on screen
    coords.x, coords.y, coords.width, coords.height
  );
};

nigelgame.Screen.prototype.write =
nigelgame.Panel.prototype.write = function(text, x, y, options) {
  // verify font
  var font = nigelgame.sheets[this.font];
  // options
  options = options || {};
  if(options.cols || options.rows)
    text = nigelgame.wrapString(text, options.cols, options.rows);
  var anchor = (options && options.anchor) || {};
  if(anchor.x === undefined) anchor.x = this.origin().x || 0;
  if(anchor.y === undefined) anchor.y = this.origin().y || 0;
  // format text into lines & get max column width
  var lines = text.split('\n');
  var maxcol = 0;
  for(var i = 0; i < lines.length; ++i) maxcol = Math.max(lines[i].length, maxcol);
  // how to align the text?
  var align = 0;
  if(!options || !options.align || options.align === "left") align = 0;
  else if(options.align === "center") align = 0.5;
  else if(options.align === "right") align = 1;
  else throw "unknown text alignment: " + options.align;
  // where the top left char at
  var coords = this.toCanvasCoords(x, y, font.spriteWidth * maxcol, font.spriteHeight * lines.length);
  var ltrWidth = font.spriteWidth * this.drawScale;
  var ltrHeight = font.spriteHeight * this.drawScale;
  // iterate
  for(var r = 0; r < lines.length; ++r) {
    var indent = Math.round((maxcol-lines[r].length)*align*font.spriteWidth) * this.drawScale;
    for(var c = 0; c < lines[r].length; ++c) {
      var ch = lines[r].charCodeAt(c) - 32;
      var sprite = font.getSprite(ch);
      // draw it to the screen
      this.context.drawImage(
        // image
        sprite.img,
        // location on the spritesheet
        sprite.left, sprite.top, sprite.width, sprite.height,
        // location on screen
        coords.x + indent + (c * ltrWidth), coords.y + (r * ltrHeight),
        ltrWidth, ltrHeight
      );
    }
  }
};
/*
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
*/