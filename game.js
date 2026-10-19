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

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function updatePaddle(dt) {
  const { input, paddle } = state;
  // El ratón coloca la pala una vez por movimiento; luego el teclado puede seguir moviéndola
  if (input.mouseX !== null) {
    paddle.x = input.mouseX - PADDLE_W / 2;
    input.mouseX = null;
  }
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  paddle.x += dir * PADDLE_SPEED * dt;
  paddle.x = clamp(paddle.x, 0, CANVAS_W - PADDLE_W);
}

function stickBallToPaddle() {
  state.ball.x = state.paddle.x + PADDLE_W / 2 - BALL_SIZE / 2;
  state.ball.y = PADDLE_Y - BALL_SIZE;
}

function launchBall() {
  const angle = Math.PI / 6; // 30° de la vertical, hacia la derecha
  state.ball.vx = BALL_SPEED * Math.sin(angle);
  state.ball.vy = -BALL_SPEED * Math.cos(angle);
  state.phase = 'playing';
}

// Espacio o clic
function onAction() {
  if (state.phase === 'serve') launchBall();
}

function updateBall(dt) {
  const ball = state.ball;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  // Paredes laterales y techo: recolocar dentro y forzar el signo de la velocidad
  if (ball.x < 0) {
    ball.x = 0;
    ball.vx = Math.abs(ball.vx);
  } else if (ball.x + BALL_SIZE > CANVAS_W) {
    ball.x = CANVAS_W - BALL_SIZE;
    ball.vx = -Math.abs(ball.vx);
  }
  if (ball.y < 0) {
    ball.y = 0;
    ball.vy = Math.abs(ball.vy);
  }

  bounceOnPaddle();
}

function overlaps(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function bounceOnPaddle() {
  const { ball, paddle } = state;
  // Solo si baja, para no rebotar dos veces seguidas
  if (ball.vy <= 0) return;
  if (!overlaps(ball.x, ball.y, BALL_SIZE, BALL_SIZE, paddle.x, PADDLE_Y, PADDLE_W, PADDLE_H)) return;

  const ballCenter = ball.x + BALL_SIZE / 2;
  const paddleCenter = paddle.x + PADDLE_W / 2;
  const rel = clamp((ballCenter - paddleCenter) / (PADDLE_W / 2), -1, 1);
  const angle = rel * MAX_BOUNCE_ANGLE;
  ball.vx = BALL_SPEED * Math.sin(angle);
  ball.vy = -BALL_SPEED * Math.cos(angle);
  ball.y = PADDLE_Y - BALL_SIZE;
}

function update(dt) {
  updatePaddle(dt);
  if (state.phase === 'serve') stickBallToPaddle();
  else if (state.phase === 'playing') updateBall(dt);
}

function render() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  for (const b of state.blocks) {
    if (b.alive) drawSprite(ctx, 'block_' + b.color, b.x, b.y, BLOCK_W, BLOCK_H);
  }

  drawSprite(ctx, 'paddle', state.paddle.x, PADDLE_Y, PADDLE_W, PADDLE_H);
  drawSprite(ctx, 'ball', state.ball.x, state.ball.y, BALL_SIZE, BALL_SIZE);
}

function frame(now) {
  const dt = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, MAX_DT);
  lastTime = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

// Input
const KEY_DIRS = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };

function setKey(e, pressed) {
  const dir = KEY_DIRS[e.key];
  if (!dir) return;
  state.input[dir] = pressed;
  e.preventDefault();
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (!e.repeat) onAction();
    return;
  }
  setKey(e, true);
});
window.addEventListener('keyup', (e) => setKey(e, false));

canvas.addEventListener('click', onAction);

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  state.input.mouseX = (e.clientX - rect.left) * (CANVAS_W / rect.width);
});

state.blocks = buildBlocks();
stickBallToPaddle();

loadSpritesheet(() => requestAnimationFrame(frame));
