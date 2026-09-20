export const GOLF_LEADERBOARD_STORAGE_KEY = "engineer-alley-leaderboard";
export const GOLF_LEADERBOARD_MAX_ROWS = 20;

export type GolfLeaderboardEntry = {
  playerName: string;
  totalStrokes: number;
  scoreVsPar: number;
  holeScores: number[];
  waterPenaltyCount: number;
  treeHitCount: number;
  finishedAt: string;
};

export function normalizePlayerName(rawName: string): string {
  return rawName.trim().replace(/\s+/g, " ").slice(0, 20);
}

export function isPlayerNameReady(playerName: string): boolean {
  return playerName.length >= 2;
}

export function scoreVsParLabel(scoreVsPar: number): string {
  if (scoreVsPar === 0) {
    return "E";
  }
  return scoreVsPar > 0 ? `+${scoreVsPar}` : String(scoreVsPar);
}

export function sortLeaderboardEntries(
  entries: GolfLeaderboardEntry[],
): GolfLeaderboardEntry[] {
  return [...entries]
    .sort((left, right) => {
      if (left.totalStrokes !== right.totalStrokes) {
        return left.totalStrokes - right.totalStrokes;
      }
      if (left.scoreVsPar !== right.scoreVsPar) {
        return left.scoreVsPar - right.scoreVsPar;
      }
      return left.finishedAt < right.finishedAt ? 1 : -1;
    })
    .slice(0, GOLF_LEADERBOARD_MAX_ROWS);
}

export function readGolfLeaderboard(): GolfLeaderboardEntry[] {
  const raw = window.localStorage.getItem(GOLF_LEADERBOARD_STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as GolfLeaderboardEntry[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return sortLeaderboardEntries(parsed.filter(isLeaderboardEntry));
  } catch {
    return [];
  }
}

export function writeGolfLeaderboardEntry(
  entry: GolfLeaderboardEntry,
): GolfLeaderboardEntry[] {
  const nextEntries = sortLeaderboardEntries([
    ...readGolfLeaderboard(),
    entry,
  ]);
  window.localStorage.setItem(
    GOLF_LEADERBOARD_STORAGE_KEY,
    JSON.stringify(nextEntries),
  );
  return nextEntries;
}

function isLeaderboardEntry(value: GolfLeaderboardEntry): boolean {
  return (
    typeof value.playerName === "string" &&
    typeof value.totalStrokes === "number" &&
    typeof value.scoreVsPar === "number" &&
    Array.isArray(value.holeScores) &&
    typeof value.finishedAt === "string"
  );
}
