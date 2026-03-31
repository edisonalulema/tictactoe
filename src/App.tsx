import "./global.css";
import { useGame } from "./hooks/useGame";
import type { Difficulty } from "./game/engine";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

function App() {
  const game = useGame();

  return (
    <div className="game">
      <h1>Tic-Tac-Toe</h1>

      {/* Screen-reader live region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {game.announcement}
      </div>

      <p className="status">{game.status}</p>

      {/* ---- Menu phase ---- */}
      {game.phase === "menu" && (
        <div className="menu">
          <div className="score-line">
            W {game.scores.wins} / D {game.scores.draws} / L{" "}
            {game.scores.losses}
          </div>
          <div className="difficulty-buttons">
            {DIFFICULTIES.map((d) => (
              <button key={d} className="action-btn" onClick={() => game.startGame(d)}>
                {d[0].toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---- Playing / Result phases ---- */}
      {(game.phase === "playing" || game.phase === "result") && (
        <>
          <div className="board">
            {game.board.map((cell, i) => (
              <button
                key={i}
                className={
                  "cell" +
                  (game.winningLine.includes(i) ? " winning" : "") +
                  (cell === "X" ? " x" : cell === "O" ? " o" : "")
                }
                onClick={() => game.handleCellClick(i)}
                disabled={
                  game.phase !== "playing" || !game.isPlayerTurn || !!cell
                }
              >
                {cell}
              </button>
            ))}
          </div>

          {game.phase === "result" && (
            <div className="result-actions">
              <button className="action-btn" onClick={game.playAgain}>
                Play Again
              </button>
              <button className="action-btn" onClick={game.returnToMenu}>
                Menu
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
