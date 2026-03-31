import type { Board as BoardState } from "../game/engine";
import { Cell } from "./Cell";
import "./Board.css";

interface BoardProps {
  board: BoardState;
  winningLine: readonly number[];
  disabled: boolean;
  onCellClick: (index: number) => void;
}

export function Board({ board, winningLine, disabled, onCellClick }: BoardProps) {
  return (
    <div className="board" role="grid" aria-label="Tic-tac-toe board">
      {[0, 1, 2].map((row) => (
        <div key={row} className="board-row" role="row">
          {[0, 1, 2].map((col) => {
            const index = row * 3 + col;
            const value = board[index];
            return (
              <Cell
                key={index}
                index={index}
                value={value}
                isWinning={winningLine.includes(index)}
                disabled={disabled || value !== null}
                onClick={() => onCellClick(index)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
