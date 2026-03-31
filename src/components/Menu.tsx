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
  return (
    <div className="menu">
      <ScoreBoard scores={scores} />

      <fieldset className="menu-difficulty">
        <legend className="menu-legend">Select difficulty</legend>
        <DifficultyPicker selected={difficulty} onSelect={onStartGame} />
      </fieldset>
    </div>
  );
}
