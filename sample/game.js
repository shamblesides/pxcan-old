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
  game.bind('start', 32);
  // game.setFrameSkip(1);
  // game.setScreenMode('adapt');
  game.setScreenScale(2);
  game.start(new TitleView());
}

function DemoView() {
  this.amp = 15;
  this.tri = 8;
}

DemoView.prototype.update = function(e) {
  e.screen.reset();
  e.screen.blit('bg', null, 0, 0);
  e.screen.origin(-1, 0);
  for(var i = -5; i < e.screen.width; ++i) {
    e.screen.fill('#fa5', i, Math.sin((e.viewClock*0.3 + i*1.05) / this.amp) * this.amp, 1, (i+e.viewClock*0.7)%this.tri + 2);
    e.screen.fill('#000', i, Math.sin((e.viewClock*0.3 + i*1.05) / this.amp) * this.amp, 1, (i+e.viewClock*0.7)%this.tri);
  }
  e.screen.origin(0, 1);
  e.screen.font = 'ascii';
  e.screen.write('this is my new invention\nhow do u liek\n????????', -1, -21, {align:'center'});
  // e.screen.write('this is my new invention\nhow do u liek\n????????', 0, -20, {align:'center'});
};

DemoView.prototype.buttondown = function(button) {
  if(button === 'left') --this.tri;
  else if(button === 'right') ++this.tri;
  else if(button === 'up') ++this.amp;
  else if(button === 'down') --this.amp;
};

function TitleView() {}

TitleView.prototype.update = function(e) {
  //only draw on first frame
  if(e.viewClock > 0 && !screen.wasResized) return;
  //draw title elements
  e.screen.reset();
  e.screen.font = 'ascii';
  var panel = e.screen.panel(0, -20, 100, 30, 0, 1);
  panel.fill('#666');
  panel.border('uibox');
  panel.write('NIGELGAME', 0, 0);
  e.screen.write(
    "press space or touch\nanywhere to play\n\n(must have\nkeyboard focus)",
    0, 20, { align: 'center' }
  );
};

TitleView.prototype.buttondown = function(button) {
  if(button === "start") this.nextView = new GameView();
};
TitleView.prototype.touch = function() {
  this.nextView = new GameView();
};

function GameView() {
  this.chara = { x: 0, y: 0, xDir: 0, yDir: 0, speed: 1, frame: 0 };
  this.target = null;
}

GameView.prototype.update = function(e) {
  // update movement based on keys
  if(e.buttons.left && (!e.buttons.right || e.buttons.left.length < e.buttons.right.length)) this.chara.xDir = -1;
  else if(e.buttons.right && (!e.buttons.left || e.buttons.right.length < e.buttons.left.length)) this.chara.xDir = 1;
  else this.chara.xDir = 0;
  if(e.buttons.up && (!e.buttons.down || e.buttons.up.length < e.buttons.down.length)) this.chara.yDir = -1;
  else if(e.buttons.down && (!e.buttons.up || e.buttons.down.length < e.buttons.up.length)) this.chara.yDir = 1;
  else this.chara.yDir = 0;
  // maybe move towards target
  if(this.target) {
    var movex = Math.abs(this.chara.x - this.target.x) >= this.chara.speed;
    var movey = Math.abs(this.chara.y - this.target.y) >= this.chara.speed;
    if(movex) this.chara.xDir = Math.sign(this.target.x - this.chara.x);
    else this.chara.xDir = 0;
    if(movey) this.chara.yDir = Math.sign(this.target.y - this.chara.y);
    else this.chara.yDir = 0;
    if(!movex && !movey) this.target = null;
  }
  // move
  this.chara.x += this.chara.xDir * this.chara.speed;
  this.chara.y += this.chara.yDir * this.chara.speed;
  if(this.chara.xDir || this.chara.yDir) {
    this.chara.frame = (this.chara.frame+1)%3;
  }
  // draw
  e.screen.reset();
  var flip = (e.gameClock % 50 >= 25)? 'hv': '';
  var panels = [
    e.screen.panel(1,1,e.screen.width/2-3,e.screen.height/2-3, -1, -1),
    e.screen.panel(-1,1,e.screen.width/2-3,e.screen.height/2-3, 1, -1),
    e.screen.panel(1,-1,e.screen.width/2-3,e.screen.height/2-3, -1, 1),
    e.screen.panel(-1,-1,e.screen.width/2-3,e.screen.height/2-3, 1, 1),
    e.screen.panel(0,0, e.screen.width/2, e.screen.height/2)
  ];
  for(var i = 0; i < 5; ++i) {
    var p = panels[i];
    p.blit('bg', null, 0, 0);
    p.blit('chara', 1, flip, this.chara.x, this.chara.y, 0, 1);
  }
};

GameView.prototype.touch =
GameView.prototype.drag = function(evt) {
  this.target = { x: evt.point.x, y: evt.point.y };
};
GameView.prototype.release = function() {
  this.target = null;
  this.chara.xDir = 0;
  this.chara.yDir = 0;
};