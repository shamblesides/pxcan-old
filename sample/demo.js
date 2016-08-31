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

var chara = {x:0, y:0, xDir:0, yDir:0, speed:1, frame:0, flip: ''};

function color() {
  return '#'+'xxx'.split('').map(function(x) { return ('6b'.charAt(Math.random()*2)); }).join('');
};

game.onFrame = function() {
  this.font = 'px6';
  
  var panels = [ {x:-1,y:-1}, {x:-1,y:1}, {x:1,y:-1}, {x:1,y:1}, {x:0,y:0} ]
    .map(function(c) { return game.panel(c.x*3, c.y*3, game.width/2-10,game.height/2-10, -c.x, -c.y) });

  // update movement based on keys
  chara.xDir = ({ 'left': -1, 'right': 1 })[this.pad('left','right')] || 0;
  chara.yDir = ({ 'up': -1, 'down': 1 })[this.pad('up','down')] || 0;
  
  // or touch!
  if (this.touch.isDown) {
    panels.reverse();

    var p = panels.find(function(p) { return game.touch.rel(p).inBounds });
    if (p) {
      chara.xDir = Math.sign((this.touch.rel(p).x - chara.x)/chara.speed | 0);
      chara.yDir = Math.sign((this.touch.rel(p).y - chara.y)/chara.speed | 0);
    }

    panels.reverse();
  }

  // move
  chara.x += chara.xDir * chara.speed;
  chara.y += chara.yDir * chara.speed;
  // drawing frame
  if (chara.xDir || chara.yDir) chara.frame = (chara.frame+1)%3;
  chara.flip = 'h' + (Math.floor(this.clock / 10) % 4 * 90);

  // draw
  this.reset();
  panels.forEach(function(p) {
    p.clear();
    p.blit('bg', ['#e00', '#f22','#f55','#f77', '#f99'], 0, 0);
    p.blit('chara', ['#333', color(), color()], chara.frame, chara.flip, chara.x, chara.y, 0, 1);
    p.border([color()]);
    p.origin(-1,-1);
    p.write('writing letters', '#333', 3,3);
    p.write('writing letters', color(), 4,4);
  });
  
};