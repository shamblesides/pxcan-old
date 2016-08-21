var game;
if(document.getElementById('game')) game = new pxcan('#game');
else game = new pxcan(window);

game.setBackground('black');
game.preload('img/chara.png', 'chara', 20,20);
game.preload("img/bg.png", "bg");

game.bind('right', 68, 39);
game.bind('left', 65, 37);
game.bind('up', 87, 38);
game.bind('down', 83, 40);

var chara = {x:0, y:0, xDir:0, yDir:0, speed:1, frame:0};

game.onFrame = function() {
  var panels = [ [-1,-1], [-1, 1], [1, -1], [1, 1], [0, 0] ]
    .map(xy => {return {x:xy[0], y:xy[1]}; })
    .map(c => this.panel(c.x*3, c.y*3, this.width/2-10,this.height/2-10, -c.x, -c.y) );

  // update movement based on keys
  chara.xDir = ({ 'left': -1, 'right': 1 })[this.pad('left','right')] || 0;
  chara.yDir = ({ 'up': -1, 'down': 1 })[this.pad('up','down')] || 0;
  
  // or touch!
  if (this.touch.isDown) {
    panels.reverse();

    var p = panels.find(p=> this.touch.rel(p).inBounds);
    if(p) {
      chara.xDir = Math.sign((this.touch.rel(p).x - chara.x)/chara.speed | 0);
      chara.yDir = Math.sign((this.touch.rel(p).y - chara.y)/chara.speed | 0);
    }
    
    panels.reverse();
  }

  // move
  chara.x += chara.xDir * chara.speed;
  chara.y += chara.yDir * chara.speed;
  // movement frame
  if (chara.xDir || chara.yDir) chara.frame = (chara.frame+1)%3;
  // draw
  this.reset();
  var flip = (this.clock % 50 >= 25)? 'hv': '';
  panels.forEach(function(p) {
    p.clear();
    p.blit('bg', null, 0, 0);
    p.blit('chara', chara.frame, flip, chara.x, chara.y, 0, 1);
  });

};