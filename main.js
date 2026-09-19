const app = new PIXI.Application({
  width: 800,
  height: 600,
  backgroundColor: 0x0a0a0a,
  antialias: false,
});
document.body.appendChild(app.view);

const STARTER_POOL = [
  { name: 'Ashbound Brute', class: 'Pyre',  keyword: 'Frenzied' },
  { name: 'Cinder Ward',    class: 'Pyre',  keyword: 'Anchor'   },
  { name: 'Veil Wraith',    class: 'Veil',  keyword: 'Shrouded' },
  { name: 'Rot Crawler',    class: 'Rot',   keyword: 'Decay'    },
  { name: 'Fae Leech',      class: 'Fae',   keyword: 'Leech'    },
  { name: 'Void Sentinel',  class: 'Void',  keyword: 'Ward'     },
];

const CLASS_COLORS = {
  Pyre:  0xcc3300,
  Veil:  0x7700cc,
  Fae:   0xcc0066,
  Rot:   0x336600,
  Chaos: 0xcc6600,
  Void:  0x0044cc,
};

const dice = [];

STARTER_POOL.forEach((data, i) => {
  const x = 71 + i * 120;
  const y = 220;
  const die = createDie(x, y, data);
  dice.push(die);
});

function createDie(x, y, data) {
  const die = {
    name: data.name,
    class: data.class,
    keyword: data.keyword,
    faces: [1, 2, 3, 4, 5, 6],
    blanked: [1, 2, 3],
    currentFace: null,
    container: new PIXI.Container(),
    graphics: new PIXI.Graphics(),
    valueLabel: new PIXI.Text('', {
      fontFamily: 'monospace', fontSize: 20, fill: 0xffffff,
    }),
    nameLabel: new PIXI.Text(data.name, {
      fontFamily: 'monospace', fontSize: 9, fill: 0xaaaaaa,
      wordWrap: true, wordWrapWidth: 64, align: 'center',
    }),
    keywordLabel: new PIXI.Text(data.keyword, {
      fontFamily: 'monospace', fontSize: 9, fill: 0xffcc00,
    }),
    rolling: false,
  };

  die.container.x = x;
  die.container.y = y;
  die.container.interactive = true;
  die.container.buttonMode = true;
  die.container.on('pointerdown', () => rollDie(die));

  die.valueLabel.anchor.set(0.5);
  die.valueLabel.x = 32;
  die.valueLabel.y = 32;

  die.nameLabel.anchor.set(0.5, 0);
  die.nameLabel.x = 32;
  die.nameLabel.y = 70;

  die.keywordLabel.anchor.set(0.5, 0);
  die.keywordLabel.x = 32;
  die.keywordLabel.y = 86;

  die.container.addChild(die.graphics);
  die.container.addChild(die.valueLabel);
  die.container.addChild(die.nameLabel);
  die.container.addChild(die.keywordLabel);

  app.stage.addChild(die.container);
  drawDie(die);
  return die;
}

function drawDie(die) {
  die.graphics.clear();

  const color = CLASS_COLORS[die.class] || 0x333333;
  const isDead = die.blanked.length >= die.faces.length;
  const isBlank = die.currentFace === null || die.blanked.includes(die.currentFace);

  die.graphics.lineStyle(2, isDead ? 0x333333 : color, 1);
  die.graphics.beginFill(isDead ? 0x111111 : isBlank ? 0x1a1a1a : 0x1a0000);
  die.graphics.drawRect(0, 0, 64, 64);
  die.graphics.endFill();

  if (isDead) {
    die.valueLabel.text = 'DEAD';
    die.valueLabel.style.fill = 0x333333;
  } else if (isBlank) {
    die.valueLabel.text = '—';
    die.valueLabel.style.fill = 0x333333;
  } else {
    die.valueLabel.text = String(die.currentFace);
    die.valueLabel.style.fill = 0xffffff;
  }
}

function rollDie(die) {
  if (die.rolling) return;
  if (die.blanked.length >= die.faces.length) return;

  die.rolling = true;
  let ticks = 0;
  const maxTicks = 12;

  const interval = setInterval(() => {
    const available = die.faces.filter(f => !die.blanked.includes(f));
    die.currentFace = available[Math.floor(Math.random() * available.length)];
    drawDie(die);
    ticks++;

    if (ticks >= maxTicks) {
      clearInterval(interval);
      die.rolling = false;
    }
  }, 60);
}