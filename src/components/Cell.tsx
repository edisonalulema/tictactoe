import type { Cell as CellValue } from "../game/engine";
import "./Cell.css";

interface CellProps {
  index: number;
  value: CellValue;
  isWinning: boolean;
  disabled: boolean;
  onClick: () => void;
}

function cellLabel(index: number, value: CellValue, isWinning: boolean): string {
  const row = Math.floor(index / 3) + 1;
  const col = (index % 3) + 1;
  const state = value ?? "empty";
  const suffix = isWinning ? ", winning" : "";
  return `Row ${row}, Column ${col}, ${state}${suffix}`;
}

export function Cell({ index, value, isWinning, disabled, onClick }: CellProps) {
  const className =
    "cell" +
    (value === "X" ? " cell-x" : value === "O" ? " cell-o" : "") +
    (isWinning ? " cell-winning" : "") +
    (!value && !disabled ? " cell-empty" : "");

  return (
    <button
      className={className}
      aria-label={cellLabel(index, value, isWinning)}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="cell-mark" aria-hidden="true">
        {value}
      </span>
      {isWinning && (
        <span className="cell-win-indicator" aria-hidden="true">
          ★
        </span>
      )}
    </button>
  );
}
