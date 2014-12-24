function init(el) {
  nigelgame.start({
    view: new TitleView(),
    element: el,
    width: 172,
    height: 144,
    scale: 2,
    scaleMode: "scale-adapt",
    sheets: [
      { src: "img/chara.png", alias: "chara", spriteWidth: 20, spriteHeight: 20 },
      { src: "img/bg.png", alias: "bg" },
      { src: "img/ascii.png", alias: "ascii", spriteWidth: 8, spriteHeight: 8 },
      { src: "img/uibox.png", alias: "uibox", spriteWidth: 8, spriteHeight: 8 }
    ],
    json: [
      { src: "data/data.json", alias: "gameobj" }
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
      40: "down",
      //space
      32: "start"
    },
    useTouch: true
  });
}

function TitleView() {}

TitleView.prototype.draw = function(screen, clocks) {
  //only draw on first frame
  if(!screen.wasResized) return;
  //draw title elements
  screen.drawStringBox(
    "NIGELGAME",
    nigelgame.sheets.ascii,
    nigelgame.sheets.uibox,
    { y: -20 },
    { color: "#666", anchor: { y: 1 } }
  );
  screen.drawString(
    "press space or touch\nanywhere to play\n\n(must have\nkeyboard focus)",
    nigelgame.sheets.ascii,
    { y: 20 },
    { align: "center" }
  );
};

TitleView.prototype.keydown = function(key) {
  if(key === "start") this.nextView = new GameView();
};
TitleView.prototype.touch = function() {
  this.nextView = new GameView();
}

function GameView() {
  this.chara = { x: 0, y: 0, xDir: 0, yDir: 0, speed: nigelgame.json.gameobj.speed, frame: 0 };
  this.target = null;
}

GameView.prototype.update = function() {
  if(this.target) {
    var movex = Math.abs(this.chara.x - this.target.x) >= this.chara.speed;
    var movey = Math.abs(this.chara.y - this.target.y) >= this.chara.speed;
    if(movex) this.chara.xDir = Math.sign(this.target.x - this.chara.x);
    else this.chara.xDir = 0;
    if(movey) this.chara.yDir = Math.sign(this.target.y - this.chara.y);
    else this.chara.yDir = 0;
    if(!movex && !movey) this.target = null;
  }
  this.chara.x += this.chara.xDir * this.chara.speed;
  this.chara.y += this.chara.yDir * this.chara.speed;
  if(this.chara.xDir || this.chara.yDir) {
    this.chara.frame = (this.chara.frame+1)%3;
  }
};

GameView.prototype.draw = function(screen, clocks) {
  screen.clear();
  screen.drawSprite(
    nigelgame.sheets.bg,
    new nigelgame.Point({ x: 0, y: 0 })
  );
  screen.drawSprite(
    nigelgame.sheets.chara.getSprite(this.chara.frame),
    { x: this.chara.x, y: this.chara.y },
    { anchor: { x: 0, y: 1 } }
  );
  screen.drawStringBox(
    nigelgame.json.gameobj.message,
    nigelgame.sheets.ascii,
    nigelgame.sheets.uibox,
    {xAnchor: 1, yAnchor: -1},
    { color: "#000", align: "right", anchor: {x:1, y:-1} }
  );
  screen.drawString(
    "view frames: " + clocks.view + "\ntotal frames: " + clocks.total,
    nigelgame.sheets.ascii,
    { xAnchor: -1, yAnchor: 1, x: 1, y: -1 },
    { align: "left", anchor: { x: -1, y: 1 } }
  );
};
GameView.prototype.keydown = function(key) {
  this.target = null;
  if(key === "up") this.chara.yDir = -1;
  else if(key === "down") this.chara.yDir = 1;
  else if(key === "left") this.chara.xDir = -1;
  else if(key === "right") this.chara.xDir = 1;
};
GameView.prototype.keyup = function(key) {
  if(key === "up" && this.chara.yDir === -1) this.chara.yDir = 0;
  else if(key === "down" && this.chara.yDir === 1) this.chara.yDir = 0;
  else if(key === "left" && this.chara.xDir === -1) this.chara.xDir = 0;
  else if(key === "right" && this.chara.xDir === 1) this.chara.xDir = 0;
};

GameView.prototype.touch =
GameView.prototype.drag = function(evt) {
  this.target = { x: evt.point.x, y: evt.point.y };
};
GameView.prototype.release = function() {
  this.target = null;
  this.chara.xDir = 0;
  this.chara.yDir = 0;
}