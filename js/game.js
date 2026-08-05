const Game = (function () {
  const SIZE = 15;
  const EMPTY = 0;
  const BLACK = 1;
  const WHITE = 2;

  const DIRECTIONS = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  let board;
  let isOver = false;
  let isThinking = false;
  let winner = null;
  let audioCtx = null;

  let onUpdate = null;
  let onStatusChange = null;
  let onGameEnd = null;

  function createEmptyBoard() {
    return Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
  }

  function init(callbacks) {
    onUpdate = callbacks.onUpdate;
    onStatusChange = callbacks.onStatusChange;
    onGameEnd = callbacks.onGameEnd || null;
    reset();
  }

  function notifyGameEnd(result, lastMove) {
    if (onGameEnd) {
      onGameEnd(result, lastMove);
    }
  }

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  }

  function playStoneSound() {
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.08);
  }

  function reset() {
    board = createEmptyBoard();
    isOver = false;
    isThinking = false;
    winner = null;
    setStatus("轮到您落子（黑棋）");
    if (onUpdate) onUpdate(board, null);
  }

  function setStatus(text) {
    if (onStatusChange) onStatusChange(text);
  }

  function getBoard() {
    return board;
  }

  function isGameOver() {
    return isOver;
  }

  function isAiThinking() {
    return isThinking;
  }

  function handlePlayerMove(row, col) {
    if (isOver || isThinking) return false;

    initAudio();

    if (board[row][col] !== EMPTY) return false;

    placeStone(row, col, BLACK);
    playStoneSound();

    const win = checkWin(row, col, BLACK);
    if (win) {
      isOver = true;
      winner = BLACK;
      setStatus("恭喜！您赢了！");
      if (onUpdate) onUpdate(board, { row, col });
      notifyGameEnd("player_win", { row, col });
      return true;
    }

    if (isBoardFull()) {
      isOver = true;
      setStatus("平局！棋盘已满");
      if (onUpdate) onUpdate(board, { row, col });
      notifyGameEnd("draw", { row, col });
      return true;
    }

    if (onUpdate) onUpdate(board, { row, col });
    triggerAiMove();
    return true;
  }

  function triggerAiMove() {
    isThinking = true;
    setStatus("电脑思考中…");

    setTimeout(() => {
      const move = AI.getBestMove(board);
      placeStone(move.row, move.col, WHITE);
      playStoneSound();

      const win = checkWin(move.row, move.col, WHITE);
      isThinking = false;

      if (win) {
        isOver = true;
        winner = WHITE;
        setStatus("电脑赢了，再试一次！");
        if (onUpdate) onUpdate(board, { row: move.row, col: move.col });
        notifyGameEnd("ai_win", { row: move.row, col: move.col });
        return;
      }

      if (isBoardFull()) {
        isOver = true;
        setStatus("平局！棋盘已满");
        if (onUpdate) onUpdate(board, { row: move.row, col: move.col });
        notifyGameEnd("draw", { row: move.row, col: move.col });
        return;
      }

      setStatus("轮到您落子（黑棋）");
      if (onUpdate) onUpdate(board, { row: move.row, col: move.col });
    }, 400);
  }

  function placeStone(row, col, player) {
    board[row][col] = player;
  }

  function checkWin(row, col, player) {
    for (const [dr, dc] of DIRECTIONS) {
      let count = 1;

      let r = row + dr;
      let c = col + dc;
      while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === player) {
        count++;
        r += dr;
        c += dc;
      }

      r = row - dr;
      c = col - dc;
      while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === player) {
        count++;
        r -= dr;
        c -= dc;
      }

      if (count >= 5) return true;
    }
    return false;
  }

  function isBoardFull() {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] === EMPTY) return false;
      }
    }
    return true;
  }

  return {
    init,
    reset,
    handlePlayerMove,
    getBoard,
    isGameOver,
    isAiThinking,
  };
})();
