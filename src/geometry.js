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
  if((p.left !== undefined) + (p.right !== undefined) + (p.width !== undefined) !== 2)
    throw "Horizontal boundaries are not well defined.";
  if((p.top !== undefined) + (p.bottom !== undefined) + (p.height !== undefined) !== 2)
    throw "Vertical boundaries are not well defined.";
  if(p.point instanceof nigelgame.Point) this.point = p.point;
  else if(typeof(p.point) === "object") this.point = new nigelgame.Point(p.point);
  else if(!p.point) this.point = new nigelgame.Point({});
  else throw "strange point given to Rect";
  this.left = (p.left !== undefined)? p.left: (p.width - p.right);
  this.right = (p.right !== undefined)? p.right: (p.width - p.left);
  this.top = (p.top !== undefined)? p.top: (p.height - p.bottom);
  this.bottom = (p.bottom !== undefined)? p.bottom: (p.height - p.top);
  this.width = this.left + this.right;
  this.height = this.top + this.bottom;
}
nigelgame.Rect.prototype.leftFor = function(outer) {
  return this.point.xFor(outer) - this.left;
}
nigelgame.Rect.prototype.rightFor = function(outer) {
  return this.point.xFor(outer) + this.right;
}
nigelgame.Rect.prototype.topFor = function(outer) {
  return this.point.yFor(outer) - this.top;
}
nigelgame.Rect.prototype.bottomFor = function(outer) {
  return this.point.yFor(outer) + this.bottom;
}
nigelgame.Rect.prototype.translate = function(params) {
  this.point.translate(params);
}
nigelgame.Rect.prototype.resize = function(params) {
  return new nigelgame.Rect({
    point: this.point,
    left: this.left + (params.left || 0),
    right: this.right + (params.right || 0),
    top: this.top + (params.top || 0),
    bottom: this.bottom + (params.bottom)
  });
}