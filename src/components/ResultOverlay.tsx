import { useEffect, useRef } from "react";
import type { GameResult, Player } from "../game/engine";
import "./ResultOverlay.css";

interface ResultOverlayProps {
  result: GameResult | null;
  humanPlayer: Player;
  onPlayAgain: () => void;
  onReturnToMenu: () => void;
}

function outcomeText(result: GameResult | null, humanPlayer: Player): string {
  if (!result) return "It's a draw!";
  return result.winner === humanPlayer ? "You win!" : "Computer wins!";
}

function outcomeClass(result: GameResult | null, humanPlayer: Player): string {
  if (!result) return "result-draw";
  return result.winner === humanPlayer ? "result-win" : "result-loss";
}

export function ResultOverlay({
  result,
  humanPlayer,
  onPlayAgain,
  onReturnToMenu,
}: ResultOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Move focus into the overlay when it mounts so keyboard users
  // land inside the result region rather than on the inert board.
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const text = outcomeText(result, humanPlayer);
  const cls = outcomeClass(result, humanPlayer);

  return (
    <div
      className="result-overlay"
      ref={containerRef}
      tabIndex={-1}
      role="region"
      aria-label="Game result"
    >
      <p className={"result-text " + cls}>{text}</p>
      <div className="result-actions">
        <button className="action-btn" onClick={onPlayAgain}>
          Play Again
        </button>
        <button className="action-btn action-btn-secondary" onClick={onReturnToMenu}>
          Menu
        </button>
      </div>
    </div>
  );
}
