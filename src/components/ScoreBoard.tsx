import type { Scores } from "../hooks/useGame";
import "./ScoreBoard.css";

interface ScoreBoardProps {
  scores: Scores;
}

export function ScoreBoard({ scores }: ScoreBoardProps) {
  return (
    <div className="scoreboard" role="group" aria-label="Session scores">
      <div className="scoreboard-item">
        <span className="scoreboard-label">Wins</span>
        <span className="scoreboard-value scoreboard-wins">{scores.wins}</span>
      </div>
      <div className="scoreboard-item">
        <span className="scoreboard-label">Draws</span>
        <span className="scoreboard-value scoreboard-draws">{scores.draws}</span>
      </div>
      <div className="scoreboard-item">
        <span className="scoreboard-label">Losses</span>
        <span className="scoreboard-value scoreboard-losses">{scores.losses}</span>
      </div>
    </div>
  );
}
