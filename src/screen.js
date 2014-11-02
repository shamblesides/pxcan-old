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