import "./global.css";
import { useGame } from "./hooks/useGame";
import { LiveAnnouncer } from "./components/LiveAnnouncer";
import { Menu } from "./components/Menu";
import { Board } from "./components/Board";
import { ScoreBoard } from "./components/ScoreBoard";
import { ResultOverlay } from "./components/ResultOverlay";

function App() {
  const game = useGame();
  const isCpuThinking =
    game.phase === "playing" && !game.isPlayerTurn;

  return (
    <main className="game">
      <h1 className="game-title">Tic-Tac-Toe</h1>
      <LiveAnnouncer message={game.announcement} />
      <p className={"status" + (isCpuThinking ? " status-thinking" : "")}>
        {game.status}
      </p>

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
            isCpuThinking={isCpuThinking}
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
    </main>
  );
}

export default App;
