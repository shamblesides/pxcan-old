pxcan.Sheet = function(alias, src, spriteWidth, spriteHeight) {
  // properties
  Object.defineProperty(this, 'alias', { get: function() { return alias; } });
  Object.defineProperty(this, 'img', { get: function() { return pxcan.image(src); } });
  Object.defineProperty(this, 'src', { get: function() { return src; } });
  Object.defineProperty(this, 'left', { get: function() { return 0; } });
  Object.defineProperty(this, 'top', { get: function() { return 0; } });
  Object.defineProperty(this, 'width', { get: function() { return this.img.width; } });
  Object.defineProperty(this, 'height', { get: function() { return this.img.height; } });
  Object.defineProperty(this, 'spriteWidth', { get: function() { return spriteWidth || this.img.width; } });
  Object.defineProperty(this, 'spriteHeight', { get: function() { return spriteHeight || this.img.height; } });
  Object.defineProperty(this, 'numCols', { get: function() { return Math.floor(this.img.width / spriteWidth); } });
  Object.defineProperty(this, 'numRows', { get: function() { return Math.floor(this.img.height / spriteHeight); } });
  Object.defineProperty(this, 'numSprites', { get: function() { return this.numCols * this.numRows; } });
};

pxcan.Sheet.prototype.scaledImage = function(scale) {
  return pxcan.scaledImage(this.src, scale);
};

pxcan.Sheet.prototype.getSprite = function(frame) {
  return new pxcan.Sprite(this, frame);
};

pxcan.Sprite = function(sheet, frame) {
  // validate frame
  if(frame === undefined || frame === null)
    throw new Error('bad frame while constructing sprite');
  // if frame is given as a number, get the column and row
  if((typeof frame === "number") && (frame%1)===0) {
    frame = { col: frame % sheet.numCols, row: Math.floor(frame / sheet.numCols) };
  }
  // calculate dimensions
  var fx = frame.x!==undefined? frame.x: frame.col? frame.col*sheet.spriteWidth: 0;
  var fy = frame.y!==undefined? frame.y: frame.row? frame.row*sheet.spriteHeight: 0;
  var fw = frame.width!==undefined? frame.width: (frame.col!==undefined? sheet.spriteWidth: sheet.width-fx);
  var fh = frame.height!==undefined? frame.height: (frame.row!==undefined? sheet.spriteHeight: sheet.height-fy);
  
  // properties
  Object.defineProperty(this, 'sheet', { get: function() { return sheet; } });
  Object.defineProperty(this, 'img', { get: function() { return sheet.img; } });
  Object.defineProperty(this, 'left', { get: function() { return fx; } });
  Object.defineProperty(this, 'top', { get: function() { return fy; } });
  Object.defineProperty(this, 'width', { get: function() { return fw; } });
  Object.defineProperty(this, 'height', { get: function() { return fh; } });
};

pxcan.Sprite.prototype.scaledImage = function(scale) {
  return pxcan.scaledImage(this.sheet.src, scale);
};