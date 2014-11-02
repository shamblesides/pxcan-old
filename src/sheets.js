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