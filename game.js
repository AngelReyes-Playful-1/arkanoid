// Constantes
const CANVAS_W = 800, CANVAS_H = 600;
const BLOCK_W = 40, BLOCK_H = 20;
const GRID_COLS = 20, GRID_ROWS = 8, GRID_TOP = 60;
const ROW_COLORS = ['gray', 'red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green', 'gray'];
const PADDLE_W = 120, PADDLE_H = 14, PADDLE_Y = 560, PADDLE_SPEED = 480; // px/s
const BALL_SIZE = 12, BALL_SPEED = 360;                                  // px/s
const MAX_BOUNCE_ANGLE = Math.PI / 3;  // 60° respecto a la vertical
const START_LIVES = 3, POINTS_PER_BLOCK = 10;
const MAX_DT = 1 / 30;                 // s

// Estado del juego
const state = {
  phase: 'serve',      // 'serve' | 'playing' | 'gameover' | 'win'
  score: 0,
  lives: START_LIVES,
  paddle: { x: 340 },  // esquina izquierda; y fija = PADDLE_Y
  ball: { x: 0, y: 0, vx: 0, vy: 0 }, // esquina superior izquierda, px/s
  blocks: [],          // { x, y, color, alive }
  input: { left: false, right: false, mouseX: null },
};

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let lastTime = null;

function buildBlocks() {
  const blocks = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      blocks.push({
        x: col * BLOCK_W,
        y: GRID_TOP + row * BLOCK_H,
        color: ROW_COLORS[row],
        alive: true,
      });
    }
  }
  return blocks;
}

function update(dt) {
}

function render() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  for (const b of state.blocks) {
    if (b.alive) drawSprite(ctx, 'block_' + b.color, b.x, b.y, BLOCK_W, BLOCK_H);
  }
}

function frame(now) {
  const dt = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, MAX_DT);
  lastTime = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

state.blocks = buildBlocks();

loadSpritesheet(() => requestAnimationFrame(frame));
