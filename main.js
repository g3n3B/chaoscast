const app = new PIXI.Application({
  width: 800,
  height: 600,
  backgroundColor: 0x0a0a0a,
  antialias: false, // keep pixel art crisp
});
document.body.appendChild(app.view);

// Die face values — 6 faces, 0 = blank
function createDie(x, y) {
  const die = {
    faces: [1, 2, 3, 4, 5, 6], // replace with keyword faces later
    blanked: [],                 // index of blanked faces
    currentFace: 1,
    container: new PIXI.Container(),
    graphics: new PIXI.Graphics(),
    label: new PIXI.Text('', {
      fontFamily: 'monospace',
      fontSize: 20,
      fill: 0xffffff,
    }),
    rolling: false,
  };

  die.container.x = x;
  die.container.y = y;
  die.container.interactive = true;
  die.container.buttonMode = true;

  die.container.addChild(die.graphics);
  die.container.addChild(die.label);
  die.label.anchor.set(0.5);
  die.label.x = 32;
  die.label.y = 32;

  die.container.on('pointerdown', () => rollDie(die));

  app.stage.addChild(die.container);
  drawDie(die);
  return die;
}

function drawDie(die) {
  die.graphics.clear();

  const isBlank = die.blanked.includes(die.currentFace);
  const color = isBlank ? 0x333333 : 0x8b0000;
  const border = 0xff3333;

  die.graphics.lineStyle(2, border, 1);
  die.graphics.beginFill(color);
  die.graphics.drawRect(0, 0, 64, 64);
  die.graphics.endFill();

  die.label.text = isBlank ? '' : String(die.currentFace);
  die.label.style.fill = isBlank ? 0x000000 : 0xffffff;
}

function rollDie(die) {
  if (die.rolling) return;
  die.rolling = true;

  let ticks = 0;
  const maxTicks = 12;

  const interval = setInterval(() => {
    const available = die.faces.filter(f => !die.blanked.includes(f));
    if (available.length === 0) {
      die.currentFace = null;
      die.label.text = 'DEAD';
      clearInterval(interval);
      die.rolling = false;
      return;
    }

    // Flash random faces during animation
    die.currentFace = available[Math.floor(Math.random() * available.length)];
    drawDie(die);
    ticks++;

    if (ticks >= maxTicks) {
      clearInterval(interval);
      die.rolling = false;
      console.log('Rolled:', die.currentFace);
    }
  }, 60);
}

// Spawn a test die
const testDie = createDie(368, 268);