import { useEffect, useRef } from "react";
import type { GameResult, Player } from "../game/engine";
import "./ResultOverlay.css";

interface ResultOverlayProps {
  result: GameResult | null;
  humanPlayer: Player;
  onPlayAgain: () => void;
  onReturnToMenu: () => void;
}

interface OutcomeInfo {
  text: string;
  icon: string;
  className: string;
}

function getOutcome(result: GameResult | null, humanPlayer: Player): OutcomeInfo {
  if (!result) {
    return { text: "Draw", icon: "—", className: "result-draw" };
  }
  if (result.winner === humanPlayer) {
    return { text: "You win!", icon: "★", className: "result-win" };
  }
  return { text: "You lose", icon: "✕", className: "result-loss" };
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
  // NOTE: This is not a full focus trap — Tab can still escape to
  // the board behind. A focus trap should be added in a later pass.
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const outcome = getOutcome(result, humanPlayer);

  return (
    <div
      className="result-overlay"
      ref={containerRef}
      tabIndex={-1}
      role="region"
      aria-label={"Game result: " + outcome.text}
    >
      <div className={"result-badge " + outcome.className}>
        <span className="result-icon" aria-hidden="true">
          {outcome.icon}
        </span>
      </div>
      <p className={"result-text " + outcome.className}>{outcome.text}</p>
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
