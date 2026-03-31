import type { Difficulty } from "../game/engine";
import "./DifficultyPicker.css";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

interface DifficultyPickerProps {
  selected: Difficulty;
  onSelect: (difficulty: Difficulty) => void;
}

function label(d: Difficulty): string {
  return d[0].toUpperCase() + d.slice(1);
}

export function DifficultyPicker({ selected, onSelect }: DifficultyPickerProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const currentIndex = DIFFICULTIES.indexOf(selected);
    let nextIndex = -1;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % DIFFICULTIES.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + DIFFICULTIES.length) % DIFFICULTIES.length;
    }

    if (nextIndex !== -1) {
      onSelect(DIFFICULTIES[nextIndex]);
      // Move focus to the newly selected radio
      const group = e.currentTarget;
      const radios = group.querySelectorAll<HTMLButtonElement>("[role='radio']");
      radios[nextIndex]?.focus();
    }
  }

  return (
    <div
      className="difficulty-picker"
      role="radiogroup"
      aria-label="Difficulty"
      onKeyDown={handleKeyDown}
    >
      {DIFFICULTIES.map((d) => {
        const isSelected = d === selected;
        return (
          <button
            key={d}
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            className={"difficulty-option" + (isSelected ? " selected" : "")}
            onClick={() => onSelect(d)}
          >
            {label(d)}
          </button>
        );
      })}
    </div>
  );
}
