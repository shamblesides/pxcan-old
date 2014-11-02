nigelgame.Point = function(params) {
  this.x = params.x || 0;
  this.y = params.y || 0;
  this.xAnchor = params.xAnchor || 0;
  this.yAnchor = params.yAnchor || 0;
}
nigelgame.Point.prototype.xFor = function(screen) {
  return Math.round(this.xAnchor * screen.width / 100 + this.x);
}
nigelgame.Point.prototype.yFor = function(screen) {
  return Math.round(this.yAnchor * screen.height / 100 + this.y);
}
nigelgame.Point.prototype.coordsFor = function(screen) {
  return { x: this.xFor(screen), y: this.yFor(screen) };
}
nigelgame.Point.prototype.translate = function(params) {
  return new nigelgame.Point({
    x: this.x + (params.x || 0),
    y: this.y + (params.y || 0),
    xAnchor: this.xAnchor + (params.xAnchor || 0),
    yAnchor: this.yAnchor + (params.yAnchor || 0)
  });
}