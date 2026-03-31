// ---- Domain types ----

export type Player = "X" | "O";
export type Cell = Player | null;
export type Board = readonly Cell[];
export type Difficulty = "easy" | "medium" | "hard";

export interface GameResult {
  winner: Player;
  line: readonly number[];
}

// ---- Constants ----

const WINNING_LINES: readonly (readonly number[])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

// ---- Board helpers ----

export function emptyBoard(): Board {
  return Array<Cell>(9).fill(null);
}

export function availableMoves(board: Board): number[] {
  return board.reduce<number[]>((acc, cell, i) => {
    if (cell === null) acc.push(i);
    return acc;
  }, []);
}

export function applyMove(board: Board, index: number, player: Player): Board {
  if (index < 0 || index > 8 || board[index] !== null) return board;
  const next = [...board];
  next[index] = player;
  return next;
}

export function opponent(player: Player): Player {
  return player === "X" ? "O" : "X";
}

// ---- Board evaluation ----

export function getWinner(board: Board): GameResult | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  return null;
}

export function isDraw(board: Board): boolean {
  return !getWinner(board) && board.every((cell) => cell !== null);
}

export function isTerminal(board: Board): boolean {
  return getWinner(board) !== null || isDraw(board);
}

// ---- Minimax (hard mode) ----

function minimax(
  board: Board,
  maximizing: boolean,
  cpuPlayer: Player,
  humanPlayer: Player,
): number {
  const result = getWinner(board);
  if (result) return result.winner === cpuPlayer ? 10 : -10;
  if (isDraw(board)) return 0;

  const moves = availableMoves(board);
  if (maximizing) {
    let best = -Infinity;
    for (const i of moves) {
      const score = minimax(
        applyMove(board, i, cpuPlayer),
        false,
        cpuPlayer,
        humanPlayer,
      );
      if (score > best) best = score;
    }
    return best;
  } else {
    let best = Infinity;
    for (const i of moves) {
      const score = minimax(
        applyMove(board, i, humanPlayer),
        true,
        cpuPlayer,
        humanPlayer,
      );
      if (score < best) best = score;
    }
    return best;
  }
}

function bestMoveHard(
  board: Board,
  cpuPlayer: Player,
  humanPlayer: Player,
): number {
  const moves = availableMoves(board);
  let bestScore = -Infinity;
  let bestMove = moves[0];
  for (const i of moves) {
    const score = minimax(
      applyMove(board, i, cpuPlayer),
      false,
      cpuPlayer,
      humanPlayer,
    );
    if (score > bestScore) {
      bestScore = score;
      bestMove = i;
    }
  }
  return bestMove;
}

// ---- CPU move selection ----

/**
 * Pick a random element from an array using the provided RNG.
 * `rand` must return a value in [0, 1).
 */
function pickRandom(indices: number[], rand: () => number): number {
  return indices[Math.floor(rand() * indices.length)];
}

function bestMoveEasy(
  board: Board,
  cpuPlayer: Player,
  rand: () => number,
): number {
  const moves = availableMoves(board);

  // 20% chance to take a winning move if one exists
  if (rand() < 0.2) {
    for (const i of moves) {
      if (getWinner(applyMove(board, i, cpuPlayer))) return i;
    }
  }

  return pickRandom(moves, rand);
}

function bestMoveMedium(
  board: Board,
  cpuPlayer: Player,
  humanPlayer: Player,
  rand: () => number,
): number {
  // 60% of the time, play the optimal (hard) move.
  // 40% of the time, fall back to easy-mode random play.
  if (rand() < 0.6) {
    return bestMoveHard(board, cpuPlayer, humanPlayer);
  }
  return bestMoveEasy(board, cpuPlayer, rand);
}

export function getComputerMove(
  board: Board,
  difficulty: Difficulty,
  cpuPlayer: Player = "O",
  humanPlayer: Player = "X",
  rand: () => number = Math.random,
): number {
  switch (difficulty) {
    case "easy":
      return bestMoveEasy(board, cpuPlayer, rand);
    case "medium":
      return bestMoveMedium(board, cpuPlayer, humanPlayer, rand);
    case "hard":
      return bestMoveHard(board, cpuPlayer, humanPlayer);
  }
}
