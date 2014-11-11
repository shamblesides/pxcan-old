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