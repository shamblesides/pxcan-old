function init(el) {
  nigelgame.start({
    view: TitleView,
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
  screen.reset();
  screen.blit('bg', null, 0, 0);
  screen.origin(-1, 0);
  for(var i = -5; i < screen.width; ++i) {
    screen.fill('#7f9', i, Math.sin((clocks.total*0.3 + i*1.05) / 20) * 15, 1, (i-clocks.total*0.3)%8);
  }
  screen.origin(0, 1);
  screen.font = 'ascii';
  screen.write('this is my new invention\nhow do u liek\n????????', -1, -21, {align:'center'});
  screen.write('this is my new invention\nhow do u liek\n????????', 0, -20, {align:'center'});
};