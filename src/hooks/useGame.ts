import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  type Board,
  type Cell,
  type Player,
  type Difficulty,
  type GameResult,
  emptyBoard,
  applyMove,
  getWinner,
  isDraw,
  isTerminal,
  getComputerMove,
} from "../game/engine";

// ---- Types exposed to consumers ----

export type Phase = "menu" | "playing" | "result";

export interface Scores {
  wins: number;
  losses: number;
  draws: number;
}

export interface GameState {
  phase: Phase;
  difficulty: Difficulty;
  board: Board;
  result: GameResult | null;
  isPlayerTurn: boolean;
  scores: Scores;
  status: string;
  announcement: string;
  winningLine: readonly number[];
}

export interface GameActions {
  startGame: (difficulty: Difficulty) => void;
  handleCellClick: (index: number) => void;
  playAgain: () => void;
  returnToMenu: () => void;
}

// ---- Constants ----

const HUMAN: Player = "X";
const CPU: Player = "O";
const CPU_DELAY_MS = 400;
const STORAGE_KEY = "tic-tac-toe-state";
const SCHEMA_VERSION = 1;

// ---- Persistence types ----

interface PersistedState {
  schemaVersion: number;
  phase: Phase;
  difficulty: Difficulty;
  board: Cell[];
  isPlayerTurn: boolean;
  scores: Scores;
}

// ---- Validation helpers (exported for testing) ----

const VALID_PHASES: readonly string[] = ["menu", "playing", "result"];
const VALID_DIFFICULTIES: readonly string[] = ["easy", "medium", "hard"];
const VALID_CELLS: readonly (string | null)[] = ["X", "O", null];

export function validateSavedState(raw: unknown): PersistedState | null {
  if (typeof raw !== "object" || raw === null) return null;

  const obj = raw as Record<string, unknown>;

  // Schema version — reject any version we don't recognize
  if (obj.schemaVersion !== SCHEMA_VERSION) return null;

  // Phase
  if (!VALID_PHASES.includes(obj.phase as string)) return null;
  const phase = obj.phase as Phase;

  // Difficulty
  if (!VALID_DIFFICULTIES.includes(obj.difficulty as string)) return null;
  const difficulty = obj.difficulty as Difficulty;

  // Board
  if (!Array.isArray(obj.board) || obj.board.length !== 9) return null;
  for (const cell of obj.board) {
    if (!VALID_CELLS.includes(cell as string | null)) return null;
  }
  const board = obj.board as Cell[];

  // isPlayerTurn
  if (typeof obj.isPlayerTurn !== "boolean") return null;
  const isPlayerTurn = obj.isPlayerTurn;

  // Scores
  if (typeof obj.scores !== "object" || obj.scores === null) return null;
  const s = obj.scores as Record<string, unknown>;
  if (
    typeof s.wins !== "number" || s.wins < 0 ||
    typeof s.losses !== "number" || s.losses < 0 ||
    typeof s.draws !== "number" || s.draws < 0
  ) return null;
  const scores: Scores = {
    wins: s.wins as number,
    losses: s.losses as number,
    draws: s.draws as number,
  };

  // Cross-field consistency: if phase is "result", board must be terminal.
  // If phase is "playing" and board is terminal, that's invalid (missed transition).
  if (phase === "result" && !isTerminal(board)) return null;
  if (phase === "playing" && isTerminal(board)) return null;

  return { schemaVersion: SCHEMA_VERSION, phase, difficulty, board, isPlayerTurn, scores };
}

export function loadSavedState(): PersistedState | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    const parsed: unknown = JSON.parse(json);
    const validated = validateSavedState(parsed);
    if (!validated) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return validated;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function saveState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — silently ignore.
  }
}

export function clearSavedState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}

// ---- Helpers ----

function addScore(prev: Scores, result: GameResult | null): Scores {
  if (result) {
    return result.winner === HUMAN
      ? { ...prev, wins: prev.wins + 1 }
      : { ...prev, losses: prev.losses + 1 };
  }
  return { ...prev, draws: prev.draws + 1 };
}

// ---- Hook ----

export function useGame(): GameState & GameActions {
  // Load saved state once. useMemo with [] deps runs once on mount and is
  // safe to read during render (unlike useRef().current which the linter flags).
  const saved = useMemo(() => loadSavedState(), []);

  const [phase, setPhase] = useState<Phase>(() => saved?.phase ?? "menu");
  const [difficulty, setDifficulty] = useState<Difficulty>(() => saved?.difficulty ?? "medium");
  const [board, setBoard] = useState<Board>(() => saved?.board ?? emptyBoard());
  const [isPlayerTurn, setIsPlayerTurn] = useState(() => saved?.isPlayerTurn ?? true);
  const [scores, setScores] = useState<Scores>(() => saved?.scores ?? { wins: 0, losses: 0, draws: 0 });

  // Explicit announcement set by actions.
  const [actionAnnouncement, setActionAnnouncement] = useState("");

  // Ref for CPU timeout — enables cancellation from any action.
  const cpuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelCpuMove = useCallback(() => {
    if (cpuTimeoutRef.current !== null) {
      clearTimeout(cpuTimeoutRef.current);
      cpuTimeoutRef.current = null;
    }
  }, []);

  // Derive result and terminal state from the board.
  const result = getWinner(board);
  const draw = isDraw(board);
  const gameOver = isTerminal(board);
  const winningLine = result?.line ?? [];

  // ---- Persist state on every change ----

  useEffect(() => {
    saveState({
      schemaVersion: SCHEMA_VERSION,
      phase,
      difficulty,
      board: [...board],
      isPlayerTurn,
      scores,
    });
  }, [phase, difficulty, board, isPlayerTurn, scores]);

  // ---- Status and announcement derivation ----

  let status: string;
  let announcement: string;

  if (phase === "menu") {
    status = "Choose a difficulty to start";
    announcement = actionAnnouncement;
  } else if (result) {
    status = result.winner === HUMAN ? "You win!" : "Computer wins!";
    announcement = status;
  } else if (draw) {
    status = "It's a draw!";
    announcement = status;
  } else if (isPlayerTurn) {
    status = "Your turn (X)";
    announcement = actionAnnouncement || "Your turn";
  } else {
    status = "Computer thinking\u2026";
    announcement = "Computer is thinking";
  }

  // ---- Transition board → result (called from event handlers, not effects) ----

  const finishGameIfOver = useCallback(
    (nextBoard: Board) => {
      if (!isTerminal(nextBoard)) return;
      const r = getWinner(nextBoard);
      setPhase("result");
      setScores((prev) => addScore(prev, r));
    },
    [],
  );

  // ---- Schedule CPU move ----

  useEffect(() => {
    if (phase !== "playing" || isPlayerTurn || gameOver) return;

    cpuTimeoutRef.current = setTimeout(() => {
      cpuTimeoutRef.current = null;

      setBoard((prev) => {
        if (isTerminal(prev)) return prev;
        const move = getComputerMove(prev, difficulty, CPU, HUMAN);
        const next = applyMove(prev, move, CPU);
        finishGameIfOver(next);
        return next;
      });
      setIsPlayerTurn(true);
      setActionAnnouncement("");
    }, CPU_DELAY_MS);

    return cancelCpuMove;
  }, [phase, isPlayerTurn, gameOver, difficulty, cancelCpuMove, finishGameIfOver]);

  // ---- Cancel on unmount ----

  useEffect(() => cancelCpuMove, [cancelCpuMove]);

  // ---- Actions ----

  const startGame = useCallback(
    (diff: Difficulty) => {
      cancelCpuMove();
      setDifficulty(diff);
      setBoard(emptyBoard());
      setIsPlayerTurn(true);
      setPhase("playing");
      setActionAnnouncement("Game started on " + diff + " difficulty. Your turn.");
    },
    [cancelCpuMove],
  );

  const handleCellClick = useCallback(
    (index: number) => {
      if (phase !== "playing" || !isPlayerTurn || gameOver) return;

      setBoard((prev) => {
        const next = applyMove(prev, index, HUMAN);
        if (next === prev) return prev;
        setIsPlayerTurn(false);
        setActionAnnouncement("");
        finishGameIfOver(next);
        return next;
      });
    },
    [phase, isPlayerTurn, gameOver, finishGameIfOver],
  );

  const playAgain = useCallback(() => {
    cancelCpuMove();
    setBoard(emptyBoard());
    setIsPlayerTurn(true);
    setPhase("playing");
    setActionAnnouncement("New round. Your turn.");
  }, [cancelCpuMove]);

  const returnToMenu = useCallback(() => {
    cancelCpuMove();
    setBoard(emptyBoard());
    setIsPlayerTurn(true);
    setPhase("menu");
    setActionAnnouncement("");
  }, [cancelCpuMove]);

  return {
    phase,
    difficulty,
    board,
    result,
    isPlayerTurn,
    scores,
    status,
    announcement,
    winningLine,
    startGame,
    handleCellClick,
    playAgain,
    returnToMenu,
  };
}
