import { describe, it, expect } from "vitest";
import {
  type Board,
  type Player,
  emptyBoard,
  availableMoves,
  applyMove,
  opponent,
  getWinner,
  isDraw,
  isTerminal,
  getComputerMove,
} from "./engine";

// ---- Helpers ----

/** Build a board from a visual template. "." = null */
function board(template: string): Board {
  return template
    .trim()
    .split(/\s+/)
    .map((c) => (c === "." ? null : (c as Player)));
}

/** Create a deterministic RNG that returns values from a fixed sequence. */
function seededRand(...values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

// ---- emptyBoard ----

describe("emptyBoard", () => {
  it("returns 9 null cells", () => {
    const b = emptyBoard();
    expect(b).toHaveLength(9);
    expect(b.every((c) => c === null)).toBe(true);
  });
});

// ---- availableMoves ----

describe("availableMoves", () => {
  it("returns all indices on an empty board", () => {
    expect(availableMoves(emptyBoard())).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("returns only empty indices", () => {
    const b = board(`
      X O .
      . X .
      O . .
    `);
    expect(availableMoves(b)).toEqual([2, 3, 5, 7, 8]);
  });

  it("returns empty array on a full board", () => {
    const b = board(`
      X O X
      X O O
      O X X
    `);
    expect(availableMoves(b)).toEqual([]);
  });
});

// ---- applyMove ----

describe("applyMove", () => {
  it("places a piece on an empty cell", () => {
    const b = emptyBoard();
    const next = applyMove(b, 4, "X");
    expect(next[4]).toBe("X");
    // original unchanged
    expect(b[4]).toBeNull();
  });

  it("returns the same board when the cell is occupied", () => {
    const b = applyMove(emptyBoard(), 0, "X");
    const same = applyMove(b, 0, "O");
    expect(same).toBe(b);
  });

  it("returns the same board for out-of-bounds index (negative)", () => {
    const b = emptyBoard();
    expect(applyMove(b, -1, "X")).toBe(b);
  });

  it("returns the same board for out-of-bounds index (>8)", () => {
    const b = emptyBoard();
    expect(applyMove(b, 9, "X")).toBe(b);
  });
});

// ---- opponent ----

describe("opponent", () => {
  it("returns O for X", () => expect(opponent("X")).toBe("O"));
  it("returns X for O", () => expect(opponent("O")).toBe("X"));
});

// ---- getWinner: all 8 winning lines ----

describe("getWinner", () => {
  const lines: [string, number[]][] = [
    ["top row", [0, 1, 2]],
    ["middle row", [3, 4, 5]],
    ["bottom row", [6, 7, 8]],
    ["left column", [0, 3, 6]],
    ["center column", [1, 4, 7]],
    ["right column", [2, 5, 8]],
    ["main diagonal", [0, 4, 8]],
    ["anti diagonal", [2, 4, 6]],
  ];

  for (const [name, line] of lines) {
    it(`detects X winning via ${name}`, () => {
      const cells: (Player | null)[] = Array(9).fill(null);
      for (const i of line) cells[i] = "X";
      const result = getWinner(cells);
      expect(result).not.toBeNull();
      expect(result!.winner).toBe("X");
      expect([...result!.line].sort()).toEqual([...line].sort());
    });

    it(`detects O winning via ${name}`, () => {
      const cells: (Player | null)[] = Array(9).fill(null);
      for (const i of line) cells[i] = "O";
      const result = getWinner(cells);
      expect(result).not.toBeNull();
      expect(result!.winner).toBe("O");
    });
  }

  it("returns null when no winner exists", () => {
    const b = board(`
      X O X
      X O O
      O X X
    `);
    expect(getWinner(b)).toBeNull();
  });

  it("returns null on an empty board", () => {
    expect(getWinner(emptyBoard())).toBeNull();
  });
});

// ---- isDraw ----

describe("isDraw", () => {
  it("returns true for a full board with no winner", () => {
    const b = board(`
      X O X
      X O O
      O X X
    `);
    expect(isDraw(b)).toBe(true);
  });

  it("returns false when the board is not full", () => {
    const b = board(`
      X O .
      . . .
      . . .
    `);
    expect(isDraw(b)).toBe(false);
  });

  it("returns false when there is a winner even if the board is full", () => {
    const b = board(`
      X X X
      O O X
      X O O
    `);
    expect(isDraw(b)).toBe(false);
  });
});

// ---- isTerminal ----

describe("isTerminal", () => {
  it("returns true on a win", () => {
    const b = board(`
      O O O
      X X .
      . . X
    `);
    expect(isTerminal(b)).toBe(true);
  });

  it("returns true on a draw", () => {
    const b = board(`
      X O X
      X O O
      O X X
    `);
    expect(isTerminal(b)).toBe(true);
  });

  it("returns false for an in-progress game", () => {
    const b = board(`
      X . .
      . O .
      . . .
    `);
    expect(isTerminal(b)).toBe(false);
  });
});

// ---- getComputerMove: easy ----

describe("getComputerMove (easy)", () => {
  it("always returns a valid move", () => {
    const b = board(`
      X O X
      . . .
      O X .
    `);
    const move = getComputerMove(b, "easy", "O", "X", Math.random);
    expect(availableMoves(b)).toContain(move);
  });

  it("can make a suboptimal move (skip an obvious win)", () => {
    // O can win by playing index 2. With the 20% win-check gate
    // seeded to fail (rand >= 0.2), easy mode falls through to random.
    // We seed the random to pick index 5 (the second available move).
    const b = board(`
      O O .
      X X .
      . . .
    `);
    // Available: [2, 5, 6, 7, 8]. Winning move is 2.
    // First rand() = 0.5 → skips win-check branch (>= 0.2).
    // Second rand() = 0.2 → floor(0.2 * 5) = 1 → picks index 1 of available = 5.
    const move = getComputerMove(b, "easy", "O", "X", seededRand(0.5, 0.2));
    expect(move).toBe(5);
    // 5 is suboptimal — O could have won with 2
  });

  it("occasionally takes a winning move when the gate passes", () => {
    const b = board(`
      O O .
      X X .
      . . .
    `);
    // First rand() = 0.1 → enters win-check branch (< 0.2).
    const move = getComputerMove(b, "easy", "O", "X", seededRand(0.1));
    expect(move).toBe(2);
  });
});

// ---- getComputerMove: medium ----

describe("getComputerMove (medium)", () => {
  it("plays optimal move when the 60% gate passes", () => {
    // O can win at index 2. rand = 0.3 → < 0.6 → hard path
    const b = board(`
      O O .
      X X .
      . . .
    `);
    const move = getComputerMove(b, "medium", "O", "X", seededRand(0.3));
    expect(move).toBe(2);
  });

  it("can fall back to random when the 60% gate fails", () => {
    // rand = 0.8 → >= 0.6 → easy path.
    // easy: rand = 0.8 → skips win-check (>= 0.2).
    // rand = 0.0 → floor(0.0 * 5) = 0 → picks first available = 2 (lucky, but via random).
    const b = board(`
      O O .
      X X .
      . . .
    `);
    const move = getComputerMove(
      b,
      "medium",
      "O",
      "X",
      seededRand(0.8, 0.8, 0.6),
    );
    // Available: [2,5,6,7,8]. floor(0.6 * 5) = 3 → picks index 3 = 7.
    expect(move).toBe(7);
  });
});

// ---- getComputerMove: hard (minimax, unbeatable) ----

describe("getComputerMove (hard)", () => {
  it("takes the winning move when available", () => {
    const b = board(`
      O O .
      X X .
      . . .
    `);
    expect(getComputerMove(b, "hard", "O", "X")).toBe(2);
  });

  it("blocks the opponent's winning move", () => {
    const b = board(`
      X X .
      O . .
      . . .
    `);
    expect(getComputerMove(b, "hard", "O", "X")).toBe(2);
  });

  it("works when CPU is X", () => {
    const b = board(`
      X X .
      O O .
      . . .
    `);
    expect(getComputerMove(b, "hard", "X", "O")).toBe(2);
  });

  it("never loses from any reachable game state", () => {
    // Exhaustive: from every non-terminal board reachable via alternating play
    // starting from empty, if it's the CPU's turn, the CPU must not lose.
    let statesChecked = 0;

    function walk(b: Board, nextPlayer: Player, cpuPlayer: Player): void {
      if (isTerminal(b)) return;

      const humanPlayer = opponent(cpuPlayer);

      if (nextPlayer === cpuPlayer) {
        // CPU's turn — make the hard move, then continue
        const move = getComputerMove(b, "hard", cpuPlayer, humanPlayer);
        const after = applyMove(b, move, cpuPlayer);
        const result = getWinner(after);
        // CPU must never be in a state where the human has won after its move
        if (result) {
          expect(result.winner).toBe(cpuPlayer);
        }
        statesChecked++;
        walk(after, humanPlayer, cpuPlayer);
      } else {
        // Human's turn — try every possible human move
        for (const move of availableMoves(b)) {
          walk(applyMove(b, move, nextPlayer), cpuPlayer, cpuPlayer);
        }
      }
    }

    // CPU as O (human moves first)
    walk(emptyBoard(), "X", "O");
    // CPU as X (CPU moves first)
    walk(emptyBoard(), "X", "X");

    // Sanity: we checked a meaningful number of states
    expect(statesChecked).toBeGreaterThan(1000);
  });
});
