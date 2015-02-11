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

nigelgame.Point.prototype.untranslate = function(params) {
  return new nigelgame.Point({
    x: this.x - (params.x || 0),
    y: this.y - (params.y || 0),
    xAnchor: this.xAnchor - (params.xAnchor || 0),
    yAnchor: this.yAnchor - (params.yAnchor || 0)
  });
};

nigelgame.Point.prototype.equals = function(params) {
  return this.x == params.x
    && this.y == params.y
    && this.xAnchor == params.xAnchor
    && this.yAnchor == params.yAnchor;
}

nigelgame.Rect = function(p) {
  //make sure boundaries are well-defined for vertical & horizontal
  var ldef=0, rdef=0, wdef=0;
  if(p.left !== undefined || p.leftAnchor !== undefined) ldef = 1;
  if(p.right !== undefined || p.rightAnchor !== undefined) rdef = 1;
  if(p.width !== undefined || p.widthPerc !== undefined) wdef = 1;
  if(ldef + rdef + wdef < 2)
    throw "Horizontal boundaries are not well defined.";
  else if(ldef + rdef + wdef > 2)
    throw "Too many arguments for horizontal boundaries.";
  var tdef=0, bdef=0, hdef=0;
  if(p.top !== undefined || p.topAnchor !== undefined) tdef = 1;
  if(p.bottom !== undefined || p.bottomAnchor !== undefined) bdef = 1;
  if(p.height !== undefined || p.heightPerc !== undefined) hdef = 1;
  if(tdef + bdef + hdef < 2)
    throw "Vertical boundaries are not well defined.";
  else if(tdef + bdef + hdef > 2)
    throw "Too many arguments for vertical boundaries.";
  //assign all fields from info provided
  this.left = ldef? (p.left !== undefined?p.left: (p.right || 0)):
    (p.right || 0) - (p.width || 0);
  this.right = rdef? (p.right !== undefined?p.right: (p.left || 0)):
    (p.left || 0) + (p.width || 0);
  this.top = tdef? (p.top !== undefined?p.top: (p.bottom || 0)):
    (p.bottom || 0) - (p.height || 0);
  this.bottom = bdef? (p.bottom !== undefined?p.bottom: (p.top || 0)):
    (p.top || 0) + (p.height || 0);
  this.leftAnchor = ldef? (p.leftAnchor !== undefined?p.leftAnchor: (p.rightAnchor || 0)):
    (p.rightAnchor || 0) - (p.widthPerc*2 || 0);
  this.rightAnchor = rdef? (p.rightAnchor !== undefined?p.rightAnchor: (p.leftAnchor || 0)):
    (p.leftAnchor || 0) + (p.widthPerc*2 || 0);
  this.topAnchor = tdef? (p.topAnchor !== undefined?p.topAnchor: (p.bottomAnchor || 0)):
    (p.bottomAnchor || 0) - (p.heightPerc*2 || 0);
  this.bottomAnchor = bdef? (p.bottomAnchor !== undefined?p.bottomAnchor: (p.topAnchor || 0)):
    (p.topAnchor || 0) + (p.heightPerc*2 || 0);
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

nigelgame.Rect.prototype.expand = function(params) {
  return new nigelgame.Rect({
    top: this.top - (params.top || 0),
    bottom: this.bottom + (params.bottom || 0),
    left: this.left - (params.left || 0),
    right: this.right + (params.right || 0),
    leftAnchor: this.leftAnchor - (params.leftAnchor || 0),
    rightAnchor: this.rightAnchor + (params.rightAnchor || 0),
    topAnchor: this.topAnchor - (params.topAnchor || 0),
    bottomAnchor: this.bottomAnchor + (params.bottomAnchor || 0)
  });
};

nigelgame.Rect.prototype.shrink = function(params) {
  return new nigelgame.Rect({
    top: this.top + (params.top || 0),
    bottom: this.bottom - (params.bottom || 0),
    left: this.left + (params.left || 0),
    right: this.right - (params.right || 0),
    leftAnchor: this.leftAnchor + (params.leftAnchor || 0),
    rightAnchor: this.rightAnchor - (params.rightAnchor || 0),
    topAnchor: this.topAnchor + (params.topAnchor || 0),
    bottomAnchor: this.bottomAnchor - (params.bottomAnchor || 0)
  });
};

nigelgame.Rect.prototype.translate = function(params) {
  return new nigelgame.Rect({
    top: this.top + (params.y || 0),
    bottom: this.bottom + (params.y || 0),
    left: this.left + (params.x || 0),
    right: this.right + (params.x || 0),
    leftAnchor: this.leftAnchor + (params.xAnchor || 0),
    rightAnchor: this.rightAnchor + (params.xAnchor || 0),
    topAnchor: this.topAnchor + (params.yAnchor || 0),
    bottomAnchor: this.bottomAnchor + (params.yAnchor || 0)
  });
};

nigelgame.Rect.prototype.untranslate = function(params) {
  return new nigelgame.Rect({
    top: this.top - (params.y || 0),
    bottom: this.bottom - (params.y || 0),
    left: this.left - (params.x || 0),
    right: this.right - (params.x || 0),
    leftAnchor: this.leftAnchor - (params.xAnchor || 0),
    rightAnchor: this.rightAnchor - (params.xAnchor || 0),
    topAnchor: this.topAnchor - (params.yAnchor || 0),
    bottomAnchor: this.bottomAnchor - (params.yAnchor || 0)
  });
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
    yAnchor: this.topAnchor + (this.heightPerc * 2) * (point.yAnchor + 1) / 2
  });
};

nigelgame.Point.prototype.rectFrom = function(params) {
  var anchor = {
    x: (params.anchor && params.anchor.x) || 0,
    y: (params.anchor && params.anchor.y) || 0
  };
  return new nigelgame.Rect({
    width: params.width,
    height: params.height,
    left: this.x - params.width * (anchor.x + 1) / 2,
    top: this.y - params.height * (anchor.y + 1) / 2,
    leftAnchor: anchor.x,
    topAnchor: anchor.y
  });
};