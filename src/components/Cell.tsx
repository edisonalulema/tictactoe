import type { Cell as CellValue } from "../game/engine";
import "./Cell.css";

interface CellProps {
  index: number;
  value: CellValue;
  isWinning: boolean;
  disabled: boolean;
  onClick: () => void;
}

function cellLabel(index: number, value: CellValue): string {
  const row = Math.floor(index / 3) + 1;
  const col = (index % 3) + 1;
  const state = value ? value : "empty";
  return `Row ${row}, Column ${col}, ${state}`;
}

export function Cell({ index, value, isWinning, disabled, onClick }: CellProps) {
  const className =
    "cell" +
    (isWinning ? " winning" : "") +
    (value === "X" ? " x" : value === "O" ? " o" : "");

  return (
    <button
      className={className}
      aria-label={cellLabel(index, value)}
      disabled={disabled}
      onClick={onClick}
    >
      {value}
    </button>
  );
}
