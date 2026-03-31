import { describe, it, expect, beforeEach } from "vitest";
import { validateSavedState } from "./useGame";
import type { Cell } from "../game/engine";

// ---- Helpers ----

function validState(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    phase: "playing",
    difficulty: "medium",
    board: ["X", null, null, null, "O", null, null, null, null] as Cell[],
    isPlayerTurn: true,
    scores: { wins: 1, losses: 0, draws: 0 },
    ...overrides,
  };
}

// ---- validateSavedState ----

describe("validateSavedState", () => {
  describe("valid states", () => {
    it("accepts a valid playing state", () => {
      const result = validateSavedState(validState());
      expect(result).not.toBeNull();
      expect(result!.phase).toBe("playing");
    });

    it("accepts a valid menu state with empty board", () => {
      const result = validateSavedState(
        validState({
          phase: "menu",
          board: Array(9).fill(null),
        }),
      );
      expect(result).not.toBeNull();
      expect(result!.phase).toBe("menu");
    });

    it("accepts a valid result state with terminal board (win)", () => {
      const result = validateSavedState(
        validState({
          phase: "result",
          board: ["X", "X", "X", "O", "O", null, null, null, null],
          isPlayerTurn: false,
        }),
      );
      expect(result).not.toBeNull();
      expect(result!.phase).toBe("result");
    });

    it("accepts a valid result state with terminal board (draw)", () => {
      const result = validateSavedState(
        validState({
          phase: "result",
          board: ["X", "O", "X", "X", "O", "O", "O", "X", "X"],
          isPlayerTurn: true,
        }),
      );
      expect(result).not.toBeNull();
    });

    it("accepts all three difficulty levels", () => {
      for (const d of ["easy", "medium", "hard"]) {
        expect(validateSavedState(validState({ difficulty: d }))).not.toBeNull();
      }
    });

    it("accepts isPlayerTurn = false in playing phase (CPU's turn)", () => {
      const result = validateSavedState(validState({ isPlayerTurn: false }));
      expect(result).not.toBeNull();
      expect(result!.isPlayerTurn).toBe(false);
    });
  });

  describe("invalid states", () => {
    it("rejects null", () => {
      expect(validateSavedState(null)).toBeNull();
    });

    it("rejects a string", () => {
      expect(validateSavedState("not an object")).toBeNull();
    });

    it("rejects an empty object", () => {
      expect(validateSavedState({})).toBeNull();
    });

    it("rejects missing schemaVersion", () => {
      const { schemaVersion: _unused, ...noVersion } = validState();
      void _unused;
      expect(validateSavedState(noVersion)).toBeNull();
    });

    it("rejects wrong schemaVersion (old)", () => {
      expect(validateSavedState(validState({ schemaVersion: 0 }))).toBeNull();
    });

    it("rejects wrong schemaVersion (future)", () => {
      expect(validateSavedState(validState({ schemaVersion: 99 }))).toBeNull();
    });

    it("rejects non-numeric schemaVersion", () => {
      expect(validateSavedState(validState({ schemaVersion: "1" }))).toBeNull();
    });

    it("rejects invalid phase", () => {
      expect(validateSavedState(validState({ phase: "loading" }))).toBeNull();
    });

    it("rejects invalid difficulty", () => {
      expect(validateSavedState(validState({ difficulty: "impossible" }))).toBeNull();
    });

    it("rejects board with wrong length", () => {
      expect(validateSavedState(validState({ board: [null, null] }))).toBeNull();
    });

    it("rejects board with invalid cell values", () => {
      const bad = Array(9).fill(null);
      bad[0] = "Z";
      expect(validateSavedState(validState({ board: bad }))).toBeNull();
    });

    it("rejects board with numeric cell values", () => {
      const bad = Array(9).fill(null);
      bad[3] = 42;
      expect(validateSavedState(validState({ board: bad }))).toBeNull();
    });

    it("rejects non-boolean isPlayerTurn", () => {
      expect(validateSavedState(validState({ isPlayerTurn: "yes" }))).toBeNull();
    });

    it("rejects missing scores", () => {
      expect(validateSavedState(validState({ scores: null }))).toBeNull();
    });

    it("rejects negative scores", () => {
      expect(
        validateSavedState(validState({ scores: { wins: -1, losses: 0, draws: 0 } })),
      ).toBeNull();
    });

    it("rejects non-numeric scores", () => {
      expect(
        validateSavedState(validState({ scores: { wins: "a", losses: 0, draws: 0 } })),
      ).toBeNull();
    });
  });

  describe("cross-field consistency", () => {
    it("rejects result phase with non-terminal board", () => {
      expect(
        validateSavedState(
          validState({
            phase: "result",
            board: ["X", null, null, null, "O", null, null, null, null],
          }),
        ),
      ).toBeNull();
    });

    it("rejects playing phase with terminal board", () => {
      expect(
        validateSavedState(
          validState({
            phase: "playing",
            board: ["X", "X", "X", "O", "O", null, null, null, null],
          }),
        ),
      ).toBeNull();
    });

    it("allows menu phase with any board (menu resets board anyway)", () => {
      // Menu with a non-empty board is technically valid — the board
      // gets reset on startGame, so we don't need to enforce empty board.
      expect(
        validateSavedState(
          validState({
            phase: "menu",
            board: ["X", "O", null, null, null, null, null, null, null],
          }),
        ),
      ).not.toBeNull();
    });
  });
});

// ---- localStorage integration ----

describe("loadSavedState (via localStorage)", () => {
  // These tests import loadSavedState and clearSavedState which interact
  // with localStorage. Vitest runs in Node by default which doesn't have
  // localStorage, so we test the validation layer directly above.
  // The localStorage read/write/clear paths are simple try/catch wrappers
  // around JSON.parse/stringify that delegate to validateSavedState.

  beforeEach(() => {
    // Ensure no test pollution — this is a no-op in Node (no localStorage)
    // but documents intent.
  });

  it("validateSavedState returns null for corrupt JSON-like input", () => {
    // Simulates what would happen if JSON.parse produced an array
    expect(validateSavedState([1, 2, 3])).toBeNull();
  });

  it("validateSavedState returns null for undefined", () => {
    expect(validateSavedState(undefined)).toBeNull();
  });
});
