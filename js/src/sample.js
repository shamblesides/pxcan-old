function init(el) {
  nigelgame.start({
    view: new GameView(),
    element: el,
    width: 144,
    height: 144,
    sheets: [
      { src: "img/chara.png", alias: "chara", spriteWidth: 20, spriteHeight: 20 },
      { src: "img/bg.png", alias: "bg" },
      { src: "img/ascii.png", alias: "ascii", spriteWidth: 8, spriteHeight: 8 },
    ],
    keyBinds: {
      //d, right
      68: "right",
      39: "right",
      //a, left
      65: "left",
      37: "left",
      //w, up
      87: "up", 
      38: "up",
      //s, down
      83: "down",
      40: "down"
    }
  });
}

function GameView() {
  this.chara = { x: 50, y: 50, xDir: 0, yDir: 0, speed: 3, frame: 0 };
};

GameView.prototype.update = function() {
  this.chara.x += this.chara.xDir * this.chara.speed;
  this.chara.y += this.chara.yDir * this.chara.speed;
  if(this.chara.xDir || this.chara.yDir) this.chara.frame = (this.chara.frame+1)%3;
};

GameView.prototype.draw = function(screen) {
  screen.drawSprite(
    nigelgame.sheets.bg,
    new nigelgame.Point({
      xAnchor: 50,
      yAnchor: 50,
      x: -nigelgame.sheets.bg.spriteWidth / 2,
      y: -nigelgame.sheets.bg.spriteHeight / 2
    })
  );
  screen.drawSprite(nigelgame.sheets.chara, new nigelgame.Point(this.chara), this.chara.frame);
  screen.drawString("hello,\nnigelgame!", nigelgame.sheets.ascii, new nigelgame.Point({
    xAnchor: 50,
    yAnchor: 50,
    y: -50,
    x: -40 }
  ));
}
GameView.prototype.keydown = function(key) {
  if(key === "up") this.chara.yDir = -1;
  else if(key === "down") this.chara.yDir = 1;
  else if(key === "left") this.chara.xDir = -1;
  else if(key === "right") this.chara.xDir = 1;
}
GameView.prototype.keyup = function(key) {
  if(key === "up" && this.chara.yDir === -1) this.chara.yDir = 0;
  else if(key === "down" && this.chara.yDir === 1) this.chara.yDir = 0;
  else if(key === "left" && this.chara.xDir === -1) this.chara.xDir = 0;
  else if(key === "right" && this.chara.xDir === 1) this.chara.xDir = 0;
}