export const DISC_GOLF_LEADERBOARD_STORAGE_KEY = "neon-circuit-leaderboard";
export const DISC_GOLF_LEADERBOARD_MAX_ROWS = 20;

export type DiscGolfLeaderboardEntry = {
  playerName: string;
  totalThrows: number;
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
  entries: DiscGolfLeaderboardEntry[],
): DiscGolfLeaderboardEntry[] {
  return [...entries]
    .sort((left, right) => {
      if (left.totalThrows !== right.totalThrows) {
        return left.totalThrows - right.totalThrows;
      }
      if (left.scoreVsPar !== right.scoreVsPar) {
        return left.scoreVsPar - right.scoreVsPar;
      }
      return left.finishedAt < right.finishedAt ? 1 : -1;
    })
    .slice(0, DISC_GOLF_LEADERBOARD_MAX_ROWS);
}

export function readDiscGolfLeaderboard(): DiscGolfLeaderboardEntry[] {
  const raw = window.localStorage.getItem(DISC_GOLF_LEADERBOARD_STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as DiscGolfLeaderboardEntry[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return sortLeaderboardEntries(parsed.filter(isLeaderboardEntry));
  } catch {
    return [];
  }
}

export function writeDiscGolfLeaderboardEntry(
  entry: DiscGolfLeaderboardEntry,
): DiscGolfLeaderboardEntry[] {
  const nextEntries = sortLeaderboardEntries([
    ...readDiscGolfLeaderboard(),
    entry,
  ]);
  window.localStorage.setItem(
    DISC_GOLF_LEADERBOARD_STORAGE_KEY,
    JSON.stringify(nextEntries),
  );
  return nextEntries;
}

function isLeaderboardEntry(value: DiscGolfLeaderboardEntry): boolean {
  return (
    typeof value.playerName === "string" &&
    typeof value.totalThrows === "number" &&
    typeof value.scoreVsPar === "number" &&
    Array.isArray(value.holeScores) &&
    typeof value.finishedAt === "string"
  );
}
