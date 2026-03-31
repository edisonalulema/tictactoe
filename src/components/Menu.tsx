import type { Difficulty } from "../game/engine";
import type { Scores } from "../hooks/useGame";
import { DifficultyPicker } from "./DifficultyPicker";
import { ScoreBoard } from "./ScoreBoard";
import "./Menu.css";

interface MenuProps {
  scores: Scores;
  difficulty: Difficulty;
  onStartGame: (difficulty: Difficulty) => void;
}

export function Menu({ scores, difficulty, onStartGame }: MenuProps) {
  const hasHistory = scores.wins + scores.losses + scores.draws > 0;

  return (
    <div className="menu">
      {/* Decorative 3x3 grid silhouette */}
      <div className="menu-grid-preview" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="menu-grid-cell" />
        ))}
      </div>

      {hasHistory && <ScoreBoard scores={scores} />}

      <fieldset className="menu-difficulty">
        <legend className="menu-legend">
          {hasHistory ? "Play again" : "Select difficulty"}
        </legend>
        <DifficultyPicker selected={difficulty} onSelect={onStartGame} />
      </fieldset>
    </div>
  );
}
