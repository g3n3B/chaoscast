// ============================================================
// CHAOS//CAST — main.js v2
// Black Fire Games | Gene (BlackFireGG)
//
// v2 CHANGES:
// - Fully responsive canvas — fills the window at any size
// - All positions calculated as percentages of canvas size
// - Window resize listener redraws everything automatically
// - Works on laptop, monitor, snapped window, any screen
// ============================================================


// ============================================================
// PIXI APP — starts at window size, resizes on window change
// ============================================================

const app = new PIXI.Application({
  width:           window.innerWidth,
  height:          window.innerHeight,
  backgroundColor: 0x0a0a0a,
  antialias:       false,
  resizeTo:        window, // PixiJS auto-resizes canvas to window
});
document.body.appendChild(app.view);

// Shorthand — always use these instead of hardcoded numbers
function W() { return app.renderer.width;  }
function H() { return app.renderer.height; }


// ============================================================
// CONSTANTS
// ============================================================

const BOARD_SLOTS   = 4;
const POUCH_SIZE    = 18;
const STARTING_HP   = 20;
const MAX_REROLLS   = 2;

const CLASS_COLORS = {
  Pyre:  0xcc3300,
  Veil:  0x7700cc,
  Fae:   0xcc0066,
  Rot:   0x336600,
  Chaos: 0xcc6600,
  Void:  0x0044cc,
};

const RARITY_BLANKS = {
  Ash:      3,
  Marked:   2,
  Cursed:   1,
  Forsaken: 0,
  Unbound:  0,
};

const RARITY_COLORS = {
  Ash:      0x555555,
  Marked:   0x4488cc,
  Cursed:   0xaa44cc,
  Forsaken: 0xccaa00,
  Unbound:  0xff2200,
};


// ============================================================
// DIE POOL
// ============================================================

const DIE_POOL = [
  { name: 'Ashbound Brute', class: 'Pyre',  keyword: 'Frenzied', rarity: 'Ash',      type: 'Bound' },
  { name: 'Cinder Ward',    class: 'Pyre',  keyword: 'Anchor',   rarity: 'Ash',      type: 'Bound' },
  { name: 'Veil Wraith',    class: 'Veil',  keyword: 'Shrouded', rarity: 'Ash',      type: 'Bound' },
  { name: 'Rot Crawler',    class: 'Rot',   keyword: 'Decay',    rarity: 'Ash',      type: 'Bound' },
  { name: 'Fae Leech',      class: 'Fae',   keyword: 'Leech',    rarity: 'Ash',      type: 'Bound' },
  { name: 'Void Sentinel',  class: 'Void',  keyword: 'Ward',     rarity: 'Ash',      type: 'Bound' },
  { name: 'Ember Striker',  class: 'Pyre',  keyword: 'Piercing', rarity: 'Marked',   type: 'Bound' },
  { name: 'Veil Dancer',    class: 'Veil',  keyword: 'Echo',     rarity: 'Marked',   type: 'Bound' },
  { name: 'Bone Shaper',    class: 'Rot',   keyword: 'Decay',    rarity: 'Marked',   type: 'Bound' },
  { name: 'Thorn Leech',    class: 'Fae',   keyword: 'Bleed',    rarity: 'Marked',   type: 'Bound' },
  { name: 'Null Shield',    class: 'Void',  keyword: 'Ward',     rarity: 'Marked',   type: 'Bound' },
  { name: 'Riot Dice',      class: 'Chaos', keyword: 'Frenzied', rarity: 'Marked',   type: 'Bound' },
  { name: 'Pyre Ascendant', class: 'Pyre',  keyword: 'Ascended', rarity: 'Cursed',   type: 'Bound' },
  { name: 'Shroud Walker',  class: 'Veil',  keyword: 'Shrouded', rarity: 'Cursed',   type: 'Bound' },
  { name: 'Rot Sovereign',  class: 'Rot',   keyword: 'Anchor',   rarity: 'Cursed',   type: 'Bound' },
  { name: 'Black Flame',    class: 'Pyre',  keyword: 'Piercing', rarity: 'Forsaken', type: 'Bound' },
  { name: 'The Hollow',     class: 'Veil',  keyword: 'Echo',     rarity: 'Forsaken', type: 'Bound' },
  { name: 'The Unraveling', class: 'Chaos', keyword: 'Frenzied', rarity: 'Unbound',  type: 'Bound' },
];


// ============================================================
// GAME STATE
// ============================================================

const state = {
  phase:       'START',
  turn:        'PLAYER',
  rerollsLeft: MAX_REROLLS,
  winner:      null,
  player: { hp: STARTING_HP, pouch: [], board: [], lockedDice: [] },
  ai:     { hp: STARTING_HP, pouch: [], board: [], lockedDice: [] },
};


// ============================================================
// PIXI LAYERS
// ============================================================

const aiLayer      = new PIXI.Container();
const playerLayer  = new PIXI.Container();
const uiLayer      = new PIXI.Container();
const overlayLayer = new PIXI.Container();

app.stage.addChild(aiLayer);
app.stage.addChild(playerLayer);
app.stage.addChild(uiLayer);
app.stage.addChild(overlayLayer);


// ============================================================
// TEXT HELPER
// ============================================================

function makeText(str, size, color) {
  return new PIXI.Text(str, {
    fontFamily: 'Share Tech Mono, monospace',
    fontSize:   size,
    fill:       color,
  });
}


// ============================================================
// LAYOUT HELPERS — all positions relative to W() and H()
// ============================================================

// Die card size scales with screen width
function dieW() { return Math.floor(W() * 0.10); }
function dieH() { return Math.floor(dieW() * 1.1); }

// Spacing between dice — evenly distributed across board width
function dieSpacing() { return Math.floor(W() / (BOARD_SLOTS + 1)); }

// Y positions as fractions of screen height
function aiDiceY()     { return Math.floor(H() * 0.08); }
function playerDiceY() { return Math.floor(H() * 0.62); }
function buttonY()     { return Math.floor(H() * 0.50); }
function endTurnY()    { return Math.floor(H() * 0.85); }
function playerHPY()   { return Math.floor(H() * 0.92); }
function pouchY()      { return Math.floor(H() * 0.96); }
function phaseY()      { return Math.floor(H() * 0.01); }
function logY()        { return Math.floor(H() * 0.04); }

// Button dimensions
function btnW()  { return Math.floor(W() * 0.14); }
function btnH()  { return Math.floor(H() * 0.06); }
function btnFs() { return Math.max(11, Math.floor(W() * 0.013)); }


// ============================================================
// PERSISTENT UI ELEMENTS — rebuilt on resize
// ============================================================

let uiRefs = {}; // holds all live UI text/button refs

function buildUI() {
  uiLayer.removeChildren();
  uiRefs = {};

  // Phase label
  const phaseLabel = makeText(state.phase || '', Math.max(11, Math.floor(W() * 0.013)), 0x888888);
  phaseLabel.x = 16;
  phaseLabel.y = phaseY();
  uiLayer.addChild(phaseLabel);
  uiRefs.phaseLabel = phaseLabel;

  // Log label
  const logLabel = makeText('', Math.max(10, Math.floor(W() * 0.011)), 0x555555);
  logLabel.x = 16;
  logLabel.y = logY();
  uiLayer.addChild(logLabel);
  uiRefs.logLabel = logLabel;

  // Player HP
  const playerHP = makeText('YOUR HP: ' + state.player.hp, Math.max(13, Math.floor(W() * 0.015)), 0xcc0000);
  playerHP.x = 16;
  playerHP.y = playerHPY();
  uiLayer.addChild(playerHP);
  uiRefs.playerHP = playerHP;

  // AI HP
  const aiHP = makeText('ENEMY HP: ' + state.ai.hp, Math.max(13, Math.floor(W() * 0.015)), 0x884400);
  aiHP.x = W() - 200;
  aiHP.y = 16;
  uiLayer.addChild(aiHP);
  uiRefs.aiHP = aiHP;

  // Pouch label
  const pouchLabel = makeText('POUCH: ' + state.player.pouch.length + ' remaining', Math.max(10, Math.floor(W() * 0.010)), 0x444444);
  pouchLabel.x = 16;
  pouchLabel.y = pouchY();
  uiLayer.addChild(pouchLabel);
  uiRefs.pouchLabel = pouchLabel;

  // Reroll count
  const rerollLabel = makeText('Rerolls left: ' + state.rerollsLeft, Math.max(10, Math.floor(W() * 0.011)), 0x555555);
  rerollLabel.x = W() * 0.5 - 60;
  rerollLabel.y = buttonY() + btnH() + 8;
  uiLayer.addChild(rerollLabel);
  uiRefs.rerollLabel = rerollLabel;

  // Divider line — separates AI side from player side
  const divider = new PIXI.Graphics();
  divider.lineStyle(1, 0x1a1a1a, 1);
  divider.moveTo(0, H() * 0.45);
  divider.lineTo(W(), H() * 0.45);
  uiLayer.addChild(divider);

  // AI zone label
  const aiZone = makeText('ENEMY BOARD', Math.max(9, Math.floor(W() * 0.009)), 0x222222);
  aiZone.x = 16;
  aiZone.y = aiDiceY() + dieH() + 36;
  uiLayer.addChild(aiZone);

  // Player zone label
  const playerZone = makeText('YOUR BOARD', Math.max(9, Math.floor(W() * 0.009)), 0x222222);
  playerZone.x = 16;
  playerZone.y = playerDiceY() - 18;
  uiLayer.addChild(playerZone);

  // ROLL ALL button
  buildButton('ROLL ALL', W() * 0.30, buttonY(), () => {
    if (state.phase === 'ROLL' && state.turn === 'PLAYER') phaseRoll();
  });

  // REROLL button
  buildButton('REROLL', W() * 0.46, buttonY(), () => {
    if (state.phase === 'REROLL' && state.turn === 'PLAYER' && state.rerollsLeft > 0) phaseReroll();
  });

  // DONE button
  buildButton('DONE', W() * 0.62, buttonY(), () => {
    if (state.phase === 'REROLL' && state.turn === 'PLAYER') {
      state.phase = 'ACTION';
      unlockAllPlayerDice();
      setPhaseLabel('ACTION — click your dice to deal damage');
      log('Click a die to send its value as damage. Hit END TURN when done.');
      renderBoard();
    }
  });

  // END TURN button — centered, bigger
  buildButton('END TURN', W() * 0.40, endTurnY(), () => {
    if (state.phase === 'ACTION' && state.turn === 'PLAYER') phaseResolve();
  }, true);
}

function buildButton(label, x, y, onClick, big = false) {
  const w   = big ? btnW() * 1.2 : btnW();
  const h   = btnH();
  const fs  = big ? btnFs() + 2 : btnFs();
  const btn = new PIXI.Container();
  btn.x = x;
  btn.y = y;
  btn.interactive = true;
  btn.buttonMode  = true;

  const g = new PIXI.Graphics();
  g.lineStyle(2, 0xcc0000, 1);
  g.beginFill(0x0a0a0a);
  g.drawRect(0, 0, w, h);
  g.endFill();

  const txt = makeText(label, fs, 0xcc0000);
  txt.anchor.set(0.5);
  txt.x = w / 2;
  txt.y = h / 2;

  btn.addChild(g);
  btn.addChild(txt);
  btn.on('pointerdown', onClick);
  uiLayer.addChild(btn);
  return btn;
}

function setPhaseLabel(txt) { if (uiRefs.phaseLabel) uiRefs.phaseLabel.text = txt; }
function log(txt)            { if (uiRefs.logLabel)   uiRefs.logLabel.text   = txt; }

function refreshHP() {
  if (uiRefs.playerHP) uiRefs.playerHP.text = 'YOUR HP: '   + state.player.hp;
  if (uiRefs.aiHP)     uiRefs.aiHP.text     = 'ENEMY HP: '  + state.ai.hp;
}

function refreshPouchLabel() {
  if (uiRefs.pouchLabel)  uiRefs.pouchLabel.text  = 'POUCH: ' + state.player.pouch.length + ' remaining';
}

function refreshRerollLabel() {
  if (uiRefs.rerollLabel) uiRefs.rerollLabel.text = 'Rerolls left: ' + state.rerollsLeft;
}


// ============================================================
// DIE FACTORY
// ============================================================

function buildDie(template) {
  const allFaces   = [1, 2, 3, 4, 5, 6];
  const startBlanks = RARITY_BLANKS[template.rarity] ?? 3;
  const blanked    = [];
  const facesCopy  = [...allFaces];

  for (let i = 0; i < startBlanks; i++) {
    const idx = Math.floor(Math.random() * facesCopy.length);
    blanked.push(facesCopy.splice(idx, 1)[0]);
  }

  return {
    ...template,
    id:          Math.random().toString(36).slice(2),
    faces:       allFaces,
    blanked,
    currentFace: null,
    rolling:     false,
    locked:      false,
    container:   null,
    graphics:    null,
    valueLabel:  null,

    isDead()      { return this.activefaces().length === 0; },
    activefaces() { return this.faces.filter(f => !this.blanked.includes(f)); },
    roll() {
      const active = this.activefaces();
      if (!active.length) return null;
      this.currentFace = active[Math.floor(Math.random() * active.length)];
      return this.currentFace;
    },
  };
}


// ============================================================
// POUCH + BOARD SETUP
// ============================================================

function buildPouch() {
  const pouch = [];
  for (let i = 0; i < POUCH_SIZE; i++) {
    pouch.push(buildDie(DIE_POOL[Math.floor(Math.random() * DIE_POOL.length)]));
  }
  return pouch;
}

function fillBoard(who) {
  for (let i = 0; i < BOARD_SLOTS; i++) who.board.push(null);
  for (let i = 0; i < BOARD_SLOTS; i++) drawFromPouch(who);
}

function drawFromPouch(who) {
  const slot = who.board.findIndex(s => s === null);
  if (slot === -1 || !who.pouch.length) return;
  who.board[slot] = who.pouch.shift();
}


// ============================================================
// DIE RENDERER — scales to current dieW/dieH
// ============================================================

function renderDie(die, x, y, isPlayer) {
  const layer = isPlayer ? playerLayer : aiLayer;
  if (die.container) layer.removeChild(die.container);

  const W2 = dieW();
  const H2 = dieH();
  const fs  = Math.max(14, Math.floor(W2 * 0.28));
  const fsS = Math.max(7,  Math.floor(W2 * 0.10));

  const container  = new PIXI.Container();
  const graphics   = new PIXI.Graphics();
  const valueLabel = makeText('', fs, 0xffffff);
  const nameLabel  = new PIXI.Text(die.name, {
    fontFamily: 'Share Tech Mono, monospace',
    fontSize:   Math.max(7, Math.floor(W2 * 0.09)),
    fill:       0x888888,
    wordWrap:   true,
    wordWrapWidth: W2 + 8,
    align:      'center',
  });
  const keyLabel    = makeText(die.keyword, fsS, 0xffcc00);
  const rarityLabel = makeText(die.rarity.toUpperCase(), Math.max(6, Math.floor(W2 * 0.08)), RARITY_COLORS[die.rarity] || 0x555555);

  container.x = x;
  container.y = y;

  if (isPlayer) {
    container.interactive = true;
    container.buttonMode  = true;
  }

  valueLabel.anchor.set(0.5);
  valueLabel.x = W2 / 2;
  valueLabel.y = H2 / 2 - 4;

  nameLabel.anchor.set(0.5, 0);
  nameLabel.x = W2 / 2;
  nameLabel.y = H2 + 4;

  keyLabel.anchor.set(0.5, 0);
  keyLabel.x = W2 / 2;
  keyLabel.y = H2 + 4 + Math.floor(W2 * 0.13);

  rarityLabel.anchor.set(0.5, 0);
  rarityLabel.x = W2 / 2;
  rarityLabel.y = H2 + 4 + Math.floor(W2 * 0.13) * 2;

  container.addChild(graphics);
  container.addChild(valueLabel);
  container.addChild(nameLabel);
  container.addChild(keyLabel);
  container.addChild(rarityLabel);

  die.container  = container;
  die.graphics   = graphics;
  die.valueLabel = valueLabel;

  drawDieGraphic(die);
  layer.addChild(container);
  return container;
}

function drawDieGraphic(die) {
  if (!die.graphics) return;
  die.graphics.clear();

  const W2      = dieW();
  const H2      = dieH();
  const dead    = die.isDead();
  const color   = CLASS_COLORS[die.class] || 0x333333;
  const isBlank = die.currentFace === null || die.blanked.includes(die.currentFace);

  let border = dead ? 0x222222 : color;
  if (die.locked) border = 0xffffff;

  die.graphics.lineStyle(2, border, 1);
  die.graphics.beginFill(dead ? 0x0d0d0d : isBlank ? 0x141414 : 0x1a0000);
  die.graphics.drawRect(0, 0, W2, H2);
  die.graphics.endFill();

  if (dead) {
    die.valueLabel.text            = '✕';
    die.valueLabel.style.fill      = 0x333333;
  } else if (isBlank) {
    die.valueLabel.text            = '—';
    die.valueLabel.style.fill      = 0x2a2a2a;
  } else {
    die.valueLabel.text            = String(die.currentFace);
    die.valueLabel.style.fill      = 0xffffff;
  }
}


// ============================================================
// BOARD RENDERER
// ============================================================

function renderBoard() {
  playerLayer.removeChildren();
  aiLayer.removeChildren();

  const spacing = dieSpacing();
  const halfDie = dieW() / 2;

  // AI board — top zone
  state.ai.board.forEach((die, i) => {
    if (!die) return;
    const x = spacing * (i + 1) - halfDie;
    renderDie(die, x, aiDiceY(), false);
  });

  // Player board — bottom zone
  state.player.board.forEach((die, i) => {
    if (!die) return;
    const x = spacing * (i + 1) - halfDie;
    renderDie(die, x, playerDiceY(), true);
    die.container.on('pointerdown', () => handlePlayerDieClick(die));
  });
}


// ============================================================
// FULL REDRAW — called on resize and state changes
// ============================================================

function fullRedraw() {
  buildUI();
  renderBoard();
  refreshHP();
  refreshPouchLabel();
  refreshRerollLabel();

  // Restore phase label text
  const phaseTexts = {
    ROLL:    'YOUR TURN — hit ROLL ALL to begin',
    REROLL:  'REROLL — click dice to lock, then REROLL or DONE',
    ACTION:  'ACTION — click your dice to deal damage',
    RESOLVE: 'RESOLVING...',
    OVER:    state.winner === 'PLAYER' ? 'VICTORY' : 'DEFEATED',
    START:   'YOUR TURN — hit ROLL ALL to begin',
  };
  setPhaseLabel(phaseTexts[state.phase] || '');
}

// Resize handler — fires whenever window changes size
window.addEventListener('resize', () => {
  // PixiJS resizeTo:window handles the canvas resize automatically
  // We just need to rebuild layout after a short debounce
  clearTimeout(window._resizeTimer);
  window._resizeTimer = setTimeout(() => {
    fullRedraw();
    // If game over screen was showing, redraw it
    if (state.phase === 'OVER') showEndScreen(state.winner);
  }, 100);
});


// ============================================================
// KEYWORD: FRENZIED
// ============================================================

function applyFrenzied(die, target) {
  if (!die.currentFace || die.blanked.includes(die.currentFace)) return;
  dealDamage(target, die.currentFace);
  log(die.name + ' FRENZIED — dealt ' + die.currentFace + ' instantly!');
  die.currentFace = null;
  drawDieGraphic(die);
}


// ============================================================
// PHASE: ROLL
// ============================================================

function phaseRoll() {
  if (state.turn !== 'PLAYER') return;
  state.phase       = 'ROLL';
  state.rerollsLeft = MAX_REROLLS;
  setPhaseLabel('ROLLING...');
  log('Rolling your dice...');

  let ticks = 0;
  const interval = setInterval(() => {
    state.player.board.forEach(d => { if (d && !d.isDead()) { d.roll(); drawDieGraphic(d); } });
    if (++ticks >= 14) {
      clearInterval(interval);

      // Frenzied triggers immediately on roll
      state.player.board.forEach(d => {
        if (d && !d.isDead() && d.keyword === 'Frenzied' && d.currentFace && !d.blanked.includes(d.currentFace)) {
          applyFrenzied(d, 'AI');
          d.locked = true; // spend it — can't reroll a fired Frenzied die
        }
      });

      state.phase = 'REROLL';
      setPhaseLabel('REROLL — click dice to lock, then REROLL or DONE');
      log('Lock dice you want to keep. Unlocked dice will reroll.');
      refreshRerollLabel();

      // Attach lock listeners directly — do NOT call renderBoard here
      state.player.board.forEach(die => {
        if (!die || die.isDead() || !die.container) return;
        die.container.removeAllListeners('pointerdown');
        die.container.on('pointerdown', () => {
          if (state.phase !== 'REROLL') return;
          die.locked = !die.locked;
          drawDieGraphic(die);
        });
      });
    }
  }, 60);
}


// ============================================================
// PHASE: REROLL
// ============================================================

function enableDieLocking() {
  state.player.board.forEach(die => {
    if (!die || die.isDead()) return;
    die.container.removeAllListeners('pointerdown');
    die.container.on('pointerdown', () => {
      if (state.phase !== 'REROLL') return;
      die.locked = !die.locked;
      drawDieGraphic(die);
    });
  });
}

function unlockAllPlayerDice() {
  state.player.board.forEach(d => { if (d) d.locked = false; });
}

function phaseReroll() {
  if (state.rerollsLeft <= 0) return;
  state.rerollsLeft--;
  let ticks = 0;
  const interval = setInterval(() => {
    state.player.board.forEach(d => { if (d && !d.isDead() && !d.locked) { d.roll(); drawDieGraphic(d); } });
    if (++ticks >= 10) {
      clearInterval(interval);
      refreshRerollLabel();
      log('Rerolled. ' + state.rerollsLeft + ' rerolls remaining.');
    }
  }, 60);
}


// ============================================================
// PHASE: ACTION
// ============================================================

function handlePlayerDieClick(die) {
  if (state.phase !== 'ACTION') return;
  if (!die || die.isDead()) return;
  if (!die.currentFace || die.blanked.includes(die.currentFace)) {
    log(die.name + ' rolled blank — no effect.');
    return;
  }

  // Anchor check
  const aiHasAnchor = state.ai.board.some(d => d && !d.isDead() && d.keyword === 'Anchor');
  if (aiHasAnchor && die.keyword !== 'Piercing') {
    log('Enemy has ANCHOR — use a Piercing die to bypass it first.');
    return;
  }

  dealDamage('AI', die.currentFace);
  log(die.name + ' dealt ' + die.currentFace + ' damage!');
  die.currentFace = null;
  drawDieGraphic(die);
}


// ============================================================
// PHASE: RESOLVE
// ============================================================

function phaseResolve() {
  state.phase = 'RESOLVE';
  setPhaseLabel('RESOLVING...');
  cleanBoard('player');
  if (checkWin()) return;
  setTimeout(() => { state.turn = 'AI'; aiTurn(); }, 800);
}


// ============================================================
// BOARD CLEANUP
// ============================================================

function cleanBoard(who) {
  const side = state[who];
  side.board.forEach((die, i) => {
    if (!die || !die.isDead()) return;
    log((who === 'player' ? 'Your ' : 'Enemy ') + die.name + ' destroyed!');
    side.board[i] = null;
    if (side.pouch.length > 0) {
      const next = side.pouch.shift();
      side.board[i] = next;
      log((who === 'player' ? 'Drew: ' : 'Enemy drew: ') + next.name);
    }
  });
  renderBoard();
  refreshPouchLabel();
}


// ============================================================
// DAMAGE
// ============================================================

function dealDamage(target, amount) {
  if (target === 'AI')     state.ai.hp     = Math.max(0, state.ai.hp     - amount);
  else                     state.player.hp = Math.max(0, state.player.hp - amount);
  refreshHP();
}

function blankFace(die) {
  const active = die.activefaces();
  if (!active.length) return;
  const f = active[Math.floor(Math.random() * active.length)];
  die.blanked.push(f);
  log(die.name + ' lost face ' + f + '!');
  drawDieGraphic(die);
}


// ============================================================
// WIN CHECK
// ============================================================

function checkWin() {
  if (state.ai.hp     <= 0) { showEndScreen('PLAYER'); return true; }
  if (state.player.hp <= 0) { showEndScreen('AI');     return true; }
  return false;
}

function showEndScreen(winner) {
  state.winner = winner;
  state.phase  = 'OVER';
  overlayLayer.removeChildren();

  const bg = new PIXI.Graphics();
  bg.beginFill(0x000000, 0.85);
  bg.drawRect(0, 0, W(), H());
  bg.endFill();

  const msg = winner === 'PLAYER' ? 'VICTORY' : 'DEFEATED';
  const col = winner === 'PLAYER' ? 0xcc0000  : 0x444444;
  const fs  = Math.max(40, Math.floor(W() * 0.07));

  const winText = new PIXI.Text(msg, {
    fontFamily: 'Share Tech Mono, monospace',
    fontSize:   fs,
    fill:       col,
    letterSpacing: 8,
  });
  winText.anchor.set(0.5);
  winText.x = W() / 2;
  winText.y = H() / 2;

  const sub = makeText('refresh to play again', Math.max(12, Math.floor(W() * 0.014)), 0x444444);
  sub.anchor.set(0.5);
  sub.x = W() / 2;
  sub.y = H() / 2 + fs + 16;

  overlayLayer.addChild(bg);
  overlayLayer.addChild(winText);
  overlayLayer.addChild(sub);
}


// ============================================================
// AI TURN
// ============================================================

function aiTurn() {
  setPhaseLabel('ENEMY TURN...');
  log('Enemy is thinking...');

  setTimeout(() => {
    state.ai.board.forEach(die => {
      if (!die || die.isDead()) return;
      die.roll();
      drawDieGraphic(die);
      if (die.keyword === 'Frenzied' && die.currentFace && !die.blanked.includes(die.currentFace)) {
        applyFrenzied(die, 'PLAYER');
      }
    });
    setTimeout(aiAct, 700);
  }, 600);
}

function aiAct() {
  const usable         = state.ai.board.filter(d => d && !d.isDead() && d.currentFace && !d.blanked.includes(d.currentFace));
  const playerHasAnchor = state.player.board.some(d => d && !d.isDead() && d.keyword === 'Anchor');

  usable.forEach(die => {
    if (die.keyword === 'Decay') {
      const target = getStrongestPlayerDie();
      if (target) {
        blankFace(target);
        blankFace(target);
        log('Enemy DECAY — blanked 2 faces on your ' + target.name + '!');
        die.currentFace = null; drawDieGraphic(die); return;
      }
    }
    if (die.keyword === 'Leech' && state.ai.hp < STARTING_HP) {
      const heal = Math.floor(die.currentFace / 2);
      dealDamage('PLAYER', die.currentFace);
      state.ai.hp = Math.min(STARTING_HP + 5, state.ai.hp + heal);
      refreshHP();
      log('Enemy LEECH — dealt damage, healed ' + heal + '!');
      die.currentFace = null; drawDieGraphic(die); return;
    }
    if (die.keyword === 'Piercing' && playerHasAnchor) {
      dealDamage('PLAYER', die.currentFace);
      log('Enemy PIERCING — bypassed your Anchor for ' + die.currentFace + '!');
      die.currentFace = null; drawDieGraphic(die); return;
    }
    if (!playerHasAnchor || die.keyword === 'Piercing') {
      dealDamage('PLAYER', die.currentFace);
      log('Enemy ' + die.name + ' dealt ' + die.currentFace + ' damage.');
      die.currentFace = null; drawDieGraphic(die);
    }
  });

  setTimeout(() => {
    cleanBoard('ai');
    if (checkWin()) return;
    state.turn        = 'PLAYER';
    state.phase       = 'ROLL';
    state.rerollsLeft = MAX_REROLLS;
    setPhaseLabel('YOUR TURN — hit ROLL ALL to begin');
    log('Your turn.');
    renderBoard();
  }, 800);
}

function getStrongestPlayerDie() {
  let best = null, bestCount = -1;
  state.player.board.forEach(d => {
    if (!d || d.isDead()) return;
    const c = d.activefaces().length;
    if (c > bestCount) { best = d; bestCount = c; }
  });
  return best;
}


// ============================================================
// INIT
// ============================================================

function initGame() {
  state.player.pouch = buildPouch();
  state.ai.pouch     = buildPouch();
  fillBoard(state.player);
  fillBoard(state.ai);

  state.phase = 'ROLL';
  state.turn  = 'PLAYER';

  fullRedraw();
  setPhaseLabel('YOUR TURN — hit ROLL ALL to begin');
  log('Match started. Roll your dice.');
}

initGame();