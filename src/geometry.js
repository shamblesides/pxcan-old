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
nigelgame.Rect.prototype.pointIn = function(point) {
  if(!(point instanceof nigelgame.Point)) point = new nigelgame.Point(point);
  return new nigelgame.Point({
    x: this.left + this.width * (point.xAnchor+1) / 2 + point.x,
    y: this.top + this.height * (point.yAnchor+1) / 2 + point.y,
    xAnchor: this.leftAnchor + (this.widthPerc * 2) * (point.xAnchor + 1) / 2,
    yAnchor: this.topAnchor + (this.heightPerc * 2) * (point.yAnchor + 1) / 2,
  });
};