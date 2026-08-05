const Board = (function () {
  const SIZE = 15;
  const CELL = 40;
  const PADDING = 20;
  const STONE_RADIUS = 17;

  let canvas, ctx;
  let onCellClick = null;
  let hoverCell = null;
  let lastMove = null;
  let animatingStone = null;
  let currentBoard = null;

  function init(canvasEl, clickCallback) {
    canvas = canvasEl;
    ctx = canvas.getContext("2d");
    onCellClick = clickCallback;

    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
  }

  function getBoardSize() {
    return SIZE * CELL + PADDING * 2;
  }

  function cellToPixel(row, col) {
    return {
      x: PADDING + col * CELL,
      y: PADDING + row * CELL,
    };
  }

  function pixelToCell(x, y) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = (x - rect.left) * scaleX;
    const py = (y - rect.top) * scaleY;

    const col = Math.round((px - PADDING) / CELL);
    const row = Math.round((py - PADDING) / CELL);

    if (row >= 0 && row < SIZE && col >= 0 && col < SIZE) {
      return { row, col };
    }
    return null;
  }

  function handleClick(e) {
    const cell = pixelToCell(e.clientX, e.clientY);
    if (cell && onCellClick) {
      onCellClick(cell.row, cell.col);
    }
  }

  function handleMouseMove(e) {
    hoverCell = pixelToCell(e.clientX, e.clientY);
    draw();
  }

  function handleMouseLeave() {
    hoverCell = null;
    draw();
  }

  function drawBoardBackground() {
    const w = canvas.width;
    const h = canvas.height;

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#e8c872");
    grad.addColorStop(0.5, "#dcb35c");
    grad.addColorStop(1, "#c9a040");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#5c3d0e";
    ctx.lineWidth = 1.5;

    for (let i = 0; i < SIZE; i++) {
      const start = cellToPixel(i, 0);
      const end = cellToPixel(i, SIZE - 1);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      const startH = cellToPixel(0, i);
      const endH = cellToPixel(SIZE - 1, i);
      ctx.beginPath();
      ctx.moveTo(startH.x, startH.y);
      ctx.lineTo(endH.x, endH.y);
      ctx.stroke();
    }

    const stars = [3, 7, 11];
    ctx.fillStyle = "#5c3d0e";
    for (const r of stars) {
      for (const c of stars) {
        const p = cellToPixel(r, c);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawStone(row, col, player, scale) {
    const { x, y } = cellToPixel(row, col);
    const radius = STONE_RADIUS * (scale || 1);

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    if (player === 1) {
      const grad = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, radius);
      grad.addColorStop(0, "#555");
      grad.addColorStop(1, "#111");
      ctx.fillStyle = grad;
    } else {
      const grad = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, radius);
      grad.addColorStop(0, "#fff");
      grad.addColorStop(1, "#ccc");
      ctx.fillStyle = grad;
    }

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (lastMove && lastMove.row === row && lastMove.col === col) {
      ctx.strokeStyle = player === 1 ? "#ff4444" : "#4488ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawHoverPreview() {
    if (!hoverCell || !currentBoard) return;
    const { row, col } = hoverCell;
    if (currentBoard[row][col] !== 0) return;

    const { x, y } = cellToPixel(row, col);
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(x, y, STONE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function draw() {
    drawBoardBackground();

    if (!currentBoard) return;

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (currentBoard[r][c] !== 0) {
          const isAnimating =
            animatingStone &&
            animatingStone.row === r &&
            animatingStone.col === c;
          const scale = isAnimating ? animatingStone.scale : 1;
          drawStone(r, c, currentBoard[r][c], scale);
        }
      }
    }

    drawHoverPreview();
  }

  function render(board) {
    currentBoard = board;
    draw();
  }

  function setLastMove(row, col) {
    lastMove = row !== null ? { row, col } : null;
  }

  function animateStone(row, col, board, callback) {
    currentBoard = board;
    const duration = 180;
    const start = performance.now();

    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      const scale = 0.3 + 0.7 * easeOutBack(t);
      animatingStone = { row, col, scale };
      draw();

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        animatingStone = null;
        draw(board);
        if (callback) callback();
      }
    }

    requestAnimationFrame(frame);
  }

  function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  function setThinking(thinking) {
    canvas.classList.toggle("thinking", thinking);
  }

  function reset() {
    lastMove = null;
    hoverCell = null;
    animatingStone = null;
  }

  return {
    init,
    render,
    setLastMove,
    animateStone,
    setThinking,
    reset,
    SIZE,
  };
})();
