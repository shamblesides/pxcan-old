function init(el) {
  var game = new nigelgame(el);
  game.addSheet("img/chara.png", "chara", 20, 20);
  game.addSheet("img/bg.png", "bg");
  game.addSheet("img/ascii.png", "ascii", 8, 8);
  game.addSheet("img/uibox.png", "uibox", 8, 8);
  game.addJSON("data/data.json", "gameobj");
  game.bind('right', 68, 39);
  game.bind('left', 65, 37);
  game.bind('up', 87, 38);
  game.bind('down', 83, 40);
  // game.setScreenMode('scale-overflow', 172, 144);
  game.start(new TitleView());
}

function TitleView() {
  this.amp = 15;
  this.tri = 8;
}

TitleView.prototype.draw = function(screen, clocks) {
  screen.reset();
  screen.blit('bg', null, 0, 0);
  screen.origin(-1, 0);
  for(var i = -5; i < screen.width; ++i) {
    screen.fill('#fa5', i, Math.sin((clocks.total*0.3 + i*1.05) / this.amp) * this.amp, 1, (i+clocks.total*0.7)%this.tri + 2);
    screen.fill('#000', i, Math.sin((clocks.total*0.3 + i*1.05) / this.amp) * this.amp, 1, (i+clocks.total*0.7)%this.tri);
  }
  screen.origin(0, 1);
  screen.setFont('ascii');
  screen.write('this is my new invention\nhow do u liek\n????????', -1, -21, {align:'center'});
  screen.write('this is my new invention\nhow do u liek\n????????', 0, -20, {align:'center'});
};

TitleView.prototype.buttondown = function(button) {
  if(button === 'left') --this.tri;
  else if(button === 'right') ++this.tri;
  else if(button === 'up') ++this.amp;
  else if(button === 'down') --this.amp;
}