nigelgame.Sheet = function(alias, img, src, spriteWidth, spriteHeight) {
  // calculate some defaults and extra values
  spriteWidth = spriteWidth || img.width;
  spriteHeight = spriteHeight || img.height;
  var numCols = Math.floor(img.width / spriteWidth);
  var numRows = Math.floor(img.height / spriteHeight);
  var numSprites = numCols * numRows;
  
  // properties
  Object.defineProperty(this, 'alias', { get: function() { return alias; } });
  Object.defineProperty(this, 'img', { get: function() { return img; } });
  Object.defineProperty(this, 'src', { get: function() { return src; } });
  Object.defineProperty(this, 'left', { get: function() { return 0; } });
  Object.defineProperty(this, 'top', { get: function() { return 0; } });
  Object.defineProperty(this, 'width', { get: function() { return img.width; } });
  Object.defineProperty(this, 'height', { get: function() { return img.height; } });
  Object.defineProperty(this, 'spriteWidth', { get: function() { return spriteWidth; } });
  Object.defineProperty(this, 'spriteHeight', { get: function() { return spriteHeight; } });
  Object.defineProperty(this, 'numCols', { get: function() { return numCols; } });
  Object.defineProperty(this, 'numRows', { get: function() { return numRows; } });
  Object.defineProperty(this, 'numSprites', { get: function() { return numSprites; } });
};

nigelgame.Sheet.prototype.getSprite = function(frame) {
  return new nigelgame.Sprite(this, frame);
};

nigelgame.Sprite = function(sheet, frame) {
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
  Object.defineProperty(this, 'img', { get: function() { return sheet.img; } });
  Object.defineProperty(this, 'left', { get: function() { return fx; } });
  Object.defineProperty(this, 'top', { get: function() { return fy; } });
  Object.defineProperty(this, 'width', { get: function() { return fw; } });
  Object.defineProperty(this, 'height', { get: function() { return fh; } });
};