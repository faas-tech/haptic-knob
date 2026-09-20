import { useState } from "react";
import { COURSE_NAME, COURSE_PAR } from "./discGolfCourse";
import {
  isPlayerNameReady,
  normalizePlayerName,
  scoreVsParLabel,
  type DiscGolfLeaderboardEntry,
} from "./discGolfLeaderboard";

export function DiscGolfNameScreen(props: {
  lastPlayerName: string;
  leaderboard: DiscGolfLeaderboardEntry[];
  onStartRound: (playerName: string) => void;
}) {
  const [playerName, setPlayerName] = useState(props.lastPlayerName);
  const readyName = normalizePlayerName(playerName);

  return (
    <div className="golf-round-overlay">
      <div className="golf-round-card disc-golf-card">
        <p className="golf-dash-kicker">{COURSE_NAME}</p>
        <h2>Nine holes. Par {COURSE_PAR}.</h2>
        <p className="golf-round-copy">
          Name the card. Direction aims. Throw winds left or right.
        </p>
        <form
          className="golf-name-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (isPlayerNameReady(readyName)) {
              props.onStartRound(readyName);
            }
          }}
        >
          <label className="golf-name-label" htmlFor="disc-golf-player-name">
            Player name
          </label>
          <input
            id="disc-golf-player-name"
            autoComplete="nickname"
            autoFocus
            maxLength={20}
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
          />
          <button
            type="submit"
            className="button-primary"
            disabled={!isPlayerNameReady(readyName)}
          >
            Start round
          </button>
        </form>
        <DiscGolfLeaderboardTable
          entries={props.leaderboard}
          emptyCopy="No cards yet. The first name on the board is yours."
        />
      </div>
    </div>
  );
}

export function DiscGolfLeaderboardTable(props: {
  entries: DiscGolfLeaderboardEntry[];
  highlightFinishedAt?: string | null;
  emptyCopy: string;
}) {
  if (props.entries.length === 0) {
    return <p className="golf-leaderboard-empty">{props.emptyCopy}</p>;
  }

  return (
    <table className="golf-leaderboard">
      <caption>Leaderboard</caption>
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Name</th>
          <th scope="col">Score</th>
          <th scope="col">To par</th>
          <th scope="col">Water</th>
          <th scope="col">Trees</th>
        </tr>
      </thead>
      <tbody>
        {props.entries.map((entry, index) => (
          <tr
            key={`${entry.playerName}-${entry.finishedAt}`}
            className={
              entry.finishedAt === props.highlightFinishedAt
                ? "is-current-card"
                : undefined
            }
          >
            <td>{index + 1}</td>
            <td>{entry.playerName}</td>
            <td>{entry.totalThrows}</td>
            <td>{scoreVsParLabel(entry.scoreVsPar)}</td>
            <td>{entry.waterPenaltyCount}</td>
            <td>{entry.treeHitCount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
