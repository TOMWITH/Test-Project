const AI = (function () {
  const SIZE = 15;
  const EMPTY = 0;
  const BLACK = 1;
  const WHITE = 2;

  const SCORE = {
    FIVE: 100000,
    OPEN_FOUR: 10000,
    CLOSED_FOUR: 1000,
    OPEN_THREE: 1000,
    CLOSED_THREE: 100,
    OPEN_TWO: 100,
    CLOSED_TWO: 10,
    ONE: 1,
  };

  const DIRECTIONS = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  function getBestMove(board) {
    const stoneCount = countStones(board);

    if (stoneCount === 0) {
      return { row: 7, col: 7 };
    }

    const candidates = getCandidates(board);
    if (candidates.length === 0) {
      return { row: 7, col: 7 };
    }

    let bestScore = -Infinity;
    let bestMove = candidates[0];

    for (const { row, col } of candidates) {
      board[row][col] = WHITE;
      const attack = evaluatePoint(board, row, col, WHITE);
      const defense = evaluatePoint(board, row, col, BLACK);
      board[row][col] = EMPTY;

      const score = Math.max(attack, defense * 0.95);
      if (score > bestScore) {
        bestScore = score;
        bestMove = { row, col };
      }
    }

    return bestMove;
  }

  function countStones(board) {
    let count = 0;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] !== EMPTY) count++;
      }
    }
    return count;
  }

  function getCandidates(board) {
    const set = new Set();
    let hasStone = false;

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] === EMPTY) continue;
        hasStone = true;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (
              nr >= 0 &&
              nr < SIZE &&
              nc >= 0 &&
              nc < SIZE &&
              board[nr][nc] === EMPTY
            ) {
              set.add(nr * SIZE + nc);
            }
          }
        }
      }
    }

    if (!hasStone) {
      return [{ row: 7, col: 7 }];
    }

    const candidates = [];
    for (const key of set) {
      candidates.push({ row: Math.floor(key / SIZE), col: key % SIZE });
    }

    return candidates;
  }

  function evaluatePoint(board, row, col, player) {
    let total = 0;
    for (const [dr, dc] of DIRECTIONS) {
      total += evaluateLine(board, row, col, dr, dc, player);
    }
    return total;
  }

  function evaluateLine(board, row, col, dr, dc, player) {
    let count = 1;
    let openEnds = 0;

    let r = row + dr;
    let c = col + dc;
    while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === player) {
      count++;
      r += dr;
      c += dc;
    }
    if (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === EMPTY) {
      openEnds++;
    }

    r = row - dr;
    c = col - dc;
    while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === player) {
      count++;
      r -= dr;
      c -= dc;
    }
    if (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === EMPTY) {
      openEnds++;
    }

    return patternScore(count, openEnds);
  }

  function patternScore(count, openEnds) {
    if (count >= 5) return SCORE.FIVE;
    if (count === 4) {
      return openEnds === 2 ? SCORE.OPEN_FOUR : openEnds === 1 ? SCORE.CLOSED_FOUR : 0;
    }
    if (count === 3) {
      return openEnds === 2 ? SCORE.OPEN_THREE : openEnds === 1 ? SCORE.CLOSED_THREE : 0;
    }
    if (count === 2) {
      return openEnds === 2 ? SCORE.OPEN_TWO : openEnds === 1 ? SCORE.CLOSED_TWO : 0;
    }
    if (count === 1) {
      return openEnds >= 1 ? SCORE.ONE : 0;
    }
    return 0;
  }

  return { getBestMove };
})();
