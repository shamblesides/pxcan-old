nigelgame.Screen.prototype.setBackground = function(bg) {
  this.canvas.style.background = bg;
};

nigelgame.Screen.prototype.toCanvasCoords =
nigelgame.Panel.prototype.toCanvasCoords = function(x, y, w, h, xAnc, yAnc) {
  // make sure we got the right number of args
  if(arguments.length !== 6)
    throw new Error('toCanvasCoords requires 6 arguments');
  // define xAnc and yAnc if not defined
  if(xAnc === undefined || xAnc === null) xAnc = this.origin().x;
  if(yAnc === undefined || yAnc === null) yAnc = this.origin().y;
  // translate x and y into LEFT and TOP
  var l = Math.round(this.canvasOffX + x + this.offset().x + this.width * (this.origin().x+1)/2 - (w || 0) * (xAnc+1)/2);
  var t = Math.round(this.canvasOffY + y + this.offset().y + this.height * (this.origin().y+1)/2 - (h || 0) * (yAnc+1)/2);
  // how much may need to be cut off the sides for sprites
  var lcut = Math.max(0, this.canvasOffX-l, -l);
  var tcut = Math.max(0, this.canvasOffY-t, -t);
  var rcut = Math.max(0, (l+w)-(this.canvasOffX+this.width), (l+w)-((this.screen||this).width));
  var bcut = Math.max(0, (t+h)-(this.canvasOffY+this.height), (t+h)-((this.screen||this).height));
  // return null if the object didn't make it on the screen
  if(lcut+rcut >= w || tcut+bcut >= h) return null;
  // otherwise return a nice object
  return {
    x: l+lcut, y: t+tcut, width: w-lcut-rcut, height: h-tcut-bcut,
    lcut: lcut, tcut: tcut, rcut: rcut, bcut: bcut
  };
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
      this.context.clearRect(
        this.canvasOffX * this.drawScale,
        this.canvasOffY * this.drawScale,
        this.width * this.drawScale,
        this.height * this.drawScale
      );
    }
    return;
  }
  // translate to coordinates on canvas element
  var coords = this.toCanvasCoords(x, y, w, h, xAnc, yAnc);
  if(!coords) return;
  // clear canvas
  this.context.clearRect(coords.x * this.drawScale, coords.y * this.drawScale, coords.width * this.drawScale, coords.height * this.drawScale);
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
      this.context.fillRect(
        this.canvasOffX * this.drawScale,
        this.canvasOffY * this.drawScale,
        this.width * this.drawScale,
        this.height * this.drawScale
      );
    }
    this.context.fillStyle = temp;
    return;
  }
  // translate to coordinates on canvas element
  var coords = this.toCanvasCoords(x, y, w, h, xAnc, yAnc);
  if(!coords) return;
  // do fill on canvas
  this.context.fillRect(coords.x * this.drawScale, coords.y * this.drawScale, coords.width * this.drawScale, coords.height * this.drawScale);
  // set color back
  this.context.fillStyle = temp;
};

nigelgame.Screen.prototype.blit =
nigelgame.Panel.prototype.blit = function(sheetName, frame /* [flip], x, y, [xAnc, yAnc] */) {
  // verify valid arguments
  if([4,5,6,7].indexOf(arguments.length) === -1)
    throw new Error('bad arguments for blit');
  // get variable arguments
  var flip = (arguments.length%2 === 1) && arguments[2] || '';
  var x = arguments[arguments.length%2===0? 2: 3];
  var y = arguments[arguments.length%2===0? 3: 4];
  var xAnc = arguments.length>=6? arguments[arguments.length-2]: null;
  var yAnc = arguments.length>=6? arguments[arguments.length-1]: null;
  // get the sheet
  var sheet = nigelgame.sheets[sheetName];
  if(!sheet) throw new Error('unknown sheet: ' + sheetName);
  // if a particular sprite is specified, get it
  var sprite = (frame !== undefined && frame !== null)?
    sheet.getSprite(frame): sheet;
  // coooordinates
  var coords = this.toCanvasCoords(x, y, sprite.width, sprite.height, xAnc, yAnc);
  if(!coords) return;
  // do canvas flipping
  var xflip = (flip.indexOf('h')!==-1)? 1:0;
  var yflip = (flip.indexOf('v')!==-1)? 1:0;
  if(flip) {
    this.context.translate(this.canvas.width*xflip, this.canvas.height*yflip);
    this.context.scale(xflip?-1:1, yflip?-1:1);
  }
  // draw it to the screen
  this.context.drawImage(
    // image
    sprite.scaledImage(this.drawScale),
    // location on the spritesheet
    (sprite.left + (xflip?coords.rcut:coords.lcut)) * this.drawScale,
    (sprite.top + (yflip?coords.bcut:coords.tcut)) * this.drawScale,
    coords.width * this.drawScale, coords.height * this.drawScale,
    // location on screen
    this.canvas.width*xflip + (coords.x*(xflip?-1:1) - coords.width*xflip) * this.drawScale,
    this.canvas.height*yflip + (coords.y*(yflip?-1:1) - coords.height*yflip) * this.drawScale,
    coords.width * this.drawScale, coords.height * this.drawScale
  );
  // undo flipping
  if(flip) {
    this.context.translate(this.canvas.width*xflip, this.canvas.height*yflip);
    this.context.scale(xflip?-1:1, yflip?-1:1);
  }
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
  var coords = this.toCanvasCoords(x, y, font.spriteWidth * maxcol, font.spriteHeight * lines.length, null, null);
  if(!coords) return;
  var ltrWidth = font.spriteWidth;
  var ltrHeight = font.spriteHeight;
  // iterate
  for(var r = 0; r < lines.length; ++r) {
    var indent = Math.round((maxcol-lines[r].length)*align*font.spriteWidth);
    for(var c = 0; c < lines[r].length; ++c) {
      var ch = lines[r].charCodeAt(c) - 32;
      var sprite = font.getSprite(ch);
      // draw it to the screen
      this.context.drawImage(
        // image
        sprite.scaledImage(this.drawScale),
        // location on the spritesheet
        sprite.left * this.drawScale, sprite.top * this.drawScale,
        sprite.width * this.drawScale, sprite.height * this.drawScale,
        // location on screen
        (coords.x + indent + (c * ltrWidth)) * this.drawScale,
        (coords.y + (r * ltrHeight)) * this.drawScale,
        ltrWidth * this.drawScale, ltrHeight * this.drawScale
      );
    }
  }
};

nigelgame.Screen.prototype.border =
nigelgame.Panel.prototype.border = function(sheet) {
  // temporarily store origin and offset, then set them
  var oldOrigin = this.origin();
  var oldOffset = this.offset();
  this.origin(-1,-1);
  this.offset(0,0);
  // horizontal edges
  var sw = nigelgame.sheets[sheet].spriteWidth;
  for(var x = sw; x < this.width - sw; x += sw) {
    this.blit(sheet, {col:1, row:0}, x, 0, -1, -1);
    this.blit(sheet, {col:1, row:2}, x, this.height, -1, 1);
  }
  // vertical edges
  var sh = nigelgame.sheets[sheet].spriteHeight;
  for(var y = sh; y < this.height - sh; y += sh) {
    this.blit(sheet, {col:0, row:1}, 0, y, -1, -1);
    this.blit(sheet, {col:2, row:1}, this.width, y, 1, -1);
  }
  // corners
  this.blit(sheet, {col:0, row:0}, 0,0, -1, -1);
  this.blit(sheet, {col:2, row:0}, this.width,0, 1, -1);
  this.blit(sheet, {col:0, row:2}, 0,this.height, -1, 1);
  this.blit(sheet, {col:2, row:2}, this.width,this.height, 1, 1);
  // return origin and offset to old values
  this.origin(oldOrigin.x, oldOrigin.y);
  this.offset(oldOffset.x, oldOffset.y);
};