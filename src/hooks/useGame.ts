import { useState, useCallback, useEffect, useRef } from "react";
import {
  type Board,
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
  const [phase, setPhase] = useState<Phase>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [board, setBoard] = useState<Board>(emptyBoard());
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [scores, setScores] = useState<Scores>({ wins: 0, losses: 0, draws: 0 });

  // Explicit announcement set by actions. Cleared after game-over announcements
  // are derived below — only used for action-triggered messages like "Game started".
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
