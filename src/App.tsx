import "./global.css";
import { useGame } from "./hooks/useGame";
import { LiveAnnouncer } from "./components/LiveAnnouncer";
import { Menu } from "./components/Menu";
import { Board } from "./components/Board";
import { ScoreBoard } from "./components/ScoreBoard";
import { ResultOverlay } from "./components/ResultOverlay";

function App() {
  const game = useGame();

  return (
    <div className="game">
      <h1>Tic-Tac-Toe</h1>
      <LiveAnnouncer message={game.announcement} />
      <p className="status">{game.status}</p>

      {game.phase === "menu" && (
        <Menu
          scores={game.scores}
          difficulty={game.difficulty}
          onStartGame={game.startGame}
        />
      )}

      {(game.phase === "playing" || game.phase === "result") && (
        <>
          <ScoreBoard scores={game.scores} />
          <Board
            board={game.board}
            winningLine={game.winningLine}
            disabled={game.phase !== "playing" || !game.isPlayerTurn}
            onCellClick={game.handleCellClick}
          />
        </>
      )}

      {game.phase === "result" && (
        <ResultOverlay
          result={game.result}
          humanPlayer="X"
          onPlayAgain={game.playAgain}
          onReturnToMenu={game.returnToMenu}
        />
      )}
    </div>
  );
}

export default App;
