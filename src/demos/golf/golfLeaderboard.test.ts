import { describe, expect, it } from "vitest";
import { holeLengthYards, courseHoleByNumber } from "./golfCourse";
import {
  isPlayerNameReady,
  normalizePlayerName,
  scoreVsParLabel,
  sortLeaderboardEntries,
  type GolfLeaderboardEntry,
} from "./golfLeaderboard";

function entry(
  playerName: string,
  totalStrokes: number,
  finishedAt: string,
): GolfLeaderboardEntry {
  return {
    playerName,
    totalStrokes,
    scoreVsPar: totalStrokes - 36,
    holeScores: [4, 4, 4, 4, 4, 4, 4, 4, 4],
    waterPenaltyCount: 0,
    treeHitCount: 0,
    finishedAt,
  };
}

describe("player name", () => {
  it("trims and caps a name at 20 characters", () => {
    expect(normalizePlayerName("  Ada   Lovelace  ")).toBe("Ada Lovelace");
    expect(normalizePlayerName("A".repeat(24)).length).toBe(20);
    expect(isPlayerNameReady("A")).toBe(false);
    expect(isPlayerNameReady("Al")).toBe(true);
  });
});

describe("sortLeaderboardEntries", () => {
  it("ranks fewer strokes first and keeps the newest tied card first", () => {
    const ranked = sortLeaderboardEntries([
      entry("Pat", 40, "2026-09-19T12:00:00.000Z"),
      entry("Sam", 38, "2026-09-19T11:00:00.000Z"),
      entry("Lee", 38, "2026-09-19T13:00:00.000Z"),
    ]);
    expect(ranked.map((row) => row.playerName)).toEqual(["Lee", "Sam", "Pat"]);
  });
});

describe("scoreVsParLabel", () => {
  it("prints E, plus, or minus", () => {
    expect(scoreVsParLabel(0)).toBe("E");
    expect(scoreVsParLabel(3)).toBe("+3");
    expect(scoreVsParLabel(-2)).toBe("-2");
  });
});

describe("holeLengthYards", () => {
  it("measures Cam along the fairway, not as a straight cut", () => {
    const cam = courseHoleByNumber(3);
    const alongFairway = holeLengthYards(cam);
    const cutYards = Math.hypot(
      cam.cup.xYards - cam.tee.xYards,
      cam.cup.yYards - cam.tee.yYards,
    );
    expect(alongFairway).toBeGreaterThan(Math.round(cutYards));
    expect(alongFairway).toBeGreaterThan(340);
  });
});
