import { describe, expect, it } from "vitest";
import {
  isPlayerNameReady,
  normalizePlayerName,
  scoreVsParLabel,
  sortLeaderboardEntries,
  type DiscGolfLeaderboardEntry,
} from "./discGolfLeaderboard";

function entry(
  playerName: string,
  totalThrows: number,
  finishedAt: string,
): DiscGolfLeaderboardEntry {
  return {
    playerName,
    totalThrows,
    scoreVsPar: totalThrows - 32,
    holeScores: [3, 3, 4, 3, 4, 3, 5, 3, 4],
    waterPenaltyCount: 0,
    treeHitCount: 0,
    finishedAt,
  };
}

describe("disc golf leaderboard", () => {
  it("trims names and requires two characters", () => {
    expect(normalizePlayerName("  Neon  Ace ")).toBe("Neon Ace");
    expect(isPlayerNameReady("A")).toBe(false);
    expect(isPlayerNameReady("Al")).toBe(true);
  });

  it("labels even par as E", () => {
    expect(scoreVsParLabel(0)).toBe("E");
    expect(scoreVsParLabel(-3)).toBe("-3");
    expect(scoreVsParLabel(4)).toBe("+4");
  });

  it("sorts lower throw counts first", () => {
    const ranked = sortLeaderboardEntries([
      entry("B", 36, "2026-09-19T12:00:00.000Z"),
      entry("A", 31, "2026-09-19T11:00:00.000Z"),
    ]);
    expect(ranked[0].playerName).toBe("A");
  });
});
