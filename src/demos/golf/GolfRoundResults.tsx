import { COURSE_NAME, COURSE_PAR, NINE_HOLE_COURSE } from "./golfCourse";
import { scoreVsParLabel, type GolfLeaderboardEntry } from "./golfLeaderboard";
import { GolfLeaderboardTable } from "./GolfNameScreen";

export function GolfRoundResults(props: {
  playerName: string;
  holeScores: number[];
  waterPenaltyCount: number;
  treeHitCount: number;
  finishedAt: string | null;
  leaderboard: GolfLeaderboardEntry[];
  onStartNextSession: () => void;
}) {
  const totalStrokes = props.holeScores.reduce(
    (sum, strokes) => sum + strokes,
    0,
  );
  const scoreVsPar = props.holeScores.reduce(
    (sum, strokes, index) => sum + strokes - NINE_HOLE_COURSE[index].par,
    0,
  );

  return (
    <div className="golf-round-overlay">
      <div className="golf-round-card golf-round-card-results">
        <p className="golf-dash-kicker">{COURSE_NAME} · Round complete</p>
        <div className="course-results-badge" aria-hidden="true">
          ✦
        </div>
        <h2>
          Nicely played,
          <br />
          {props.playerName}.
        </h2>
        <p className="golf-round-total">
          {totalStrokes}
          <span>
            {scoreVsParLabel(scoreVsPar)} · par {COURSE_PAR}
          </span>
        </p>
        <ol className="golf-scorecard">
          {NINE_HOLE_COURSE.map((courseHole, index) => (
            <li
              key={courseHole.holeNumber}
              className={
                (props.holeScores[index] ?? courseHole.par) < courseHole.par
                  ? "is-under-par"
                  : (props.holeScores[index] ?? courseHole.par) > courseHole.par
                    ? "is-over-par"
                    : "is-par"
              }
            >
              <span>{courseHole.holeNumber}</span>
              <strong>{props.holeScores[index] ?? "-"}</strong>
              <em>p{courseHole.par}</em>
            </li>
          ))}
        </ol>
        <p className="golf-round-copy">
          Water penalties {props.waterPenaltyCount} · Tree hits{" "}
          {props.treeHitCount}
        </p>
        <GolfLeaderboardTable
          entries={props.leaderboard}
          highlightFinishedAt={props.finishedAt}
          emptyCopy="This card is the first on the board."
        />
        <button
          type="button"
          className="button-primary"
          onClick={props.onStartNextSession}
        >
          New round
        </button>
      </div>
    </div>
  );
}
