var game;
if(document.getElementById('game')) game = new pxcan('#game');
else game = new pxcan(window);

game.mode('adapt', 3);

game.setBackground('black');
game.preload('img/chara.png', 'chara', 20,20);
game.preload("img/bg.png", "bg");

game.bind('right', 68, 39);
game.bind('left', 65, 37);
game.bind('up', 87, 38);
game.bind('down', 83, 40);

var chara = {x:0, y:0, xDir:0, yDir:0, speed:1, frame:0};

game.onFrame = function() {
  // update movement based on keys
  if (this.button('left').isDown && this.button('right').isDown) {
    chara.xDir = Math.sign(this.button('left').framesDown - this.button('right').framesDown);
  }
  else if (this.button('left').isDown) chara.xDir = -1;
  else if (this.button('right').isDown) chara.xDir = 1;
  else chara.xDir = 0;

  if (this.button('up').isDown && this.button('down').isDown) {
    chara.yDir = Math.sign(this.button('up').framesDown - this.button('down').framesDown);
  }
  else if (this.button('up').isDown) chara.yDir = -1;
  else if (this.button('down').isDown) chara.yDir = 1;
  else chara.yDir = 0;
  
  // or touch!
  if (this.touch.isDown) {
    chara.xDir = Math.sign((this.touch.x - chara.x)/chara.speed | 0);
    chara.yDir = Math.sign((this.touch.y - chara.y)/chara.speed | 0);
  }

  // move
  chara.x += chara.xDir * chara.speed;
  chara.y += chara.yDir * chara.speed;
  // movement frame
  if (chara.xDir || chara.yDir) chara.frame = (chara.frame+1)%3;
  // draw
  this.reset();
  var flip = (this.clock % 50 >= 25)? 'hv': '';
  var panels = [
    this.panel(1,1,this.width/2-3,this.height/2-3, -1, -1),
    this.panel(-1,1,this.width/2-3,this.height/2-3, 1, -1),
    this.panel(1,-1,this.width/2-3,this.height/2-3, -1, 1),
    this.panel(-1,-1,this.width/2-3,this.height/2-3, 1, 1),
    this.panel(0,0, this.width/2, this.height/2)
  ];
  for (var i = 0; i < 5; ++i) {
    var p = panels[i];
    p.clear();
    p.blit('bg', null, 0, 0);
    p.blit('chara', chara.frame, flip, chara.x, chara.y, 0, 1);
  }

};