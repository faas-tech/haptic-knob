import { ClubSelectorReel } from "./ClubSelectorReel";
import type { ClubId } from "./golfClubs";
import { COURSE_NAME, type CourseHole } from "./golfCourse";
import {
  compassPointFromHeadingDegrees,
  type CourseWind,
} from "./golfWind";

export type GolfPlayMode = "direction" | "shoot";

export type GolfShotResultBanner = {
  bannerKey: number;
  powerPercent: number;
  travelYards: number;
};

export function GolfPlayerDashboard(props: {
  playerName: string;
  courseHole: CourseHole;
  playMode: GolfPlayMode;
  selectedClubId: ClubId;
  isPutterLocked: boolean;
  windPower: number;
  courseWind: CourseWind;
  strokesThisHole: number;
  yardsToCup: number;
  scoreVsPar: number;
  totalStrokes: number;
  completedHoleCount: number;
  operatorMessage: string;
  lieLabel: string;
  shotResultBanner: GolfShotResultBanner | null;
  onSelectDirectionMode: () => void;
  onSelectShootMode: () => void;
}) {
  const scoreLabel =
    props.completedHoleCount === 0
      ? "E"
      : `${props.scoreVsPar > 0 ? "+" : ""}${props.scoreVsPar}`;
  const windSpeedMph = Math.round(props.courseWind.speedMph);
  const windPoint = compassPointFromHeadingDegrees(
    props.courseWind.blowToHeadingDegrees,
  );

  return (
    <div className="golf-hud">
      <div className="golf-hud-mode">
        <div className="golf-mode-switch" role="group" aria-label="Play mode">
          <button
            type="button"
            className={
              props.playMode === "direction"
                ? "golf-mode-button is-active"
                : "golf-mode-button"
            }
            onClick={props.onSelectDirectionMode}
          >
            Direction
          </button>
          <button
            type="button"
            className={
              props.playMode === "shoot"
                ? "golf-mode-button is-active"
                : "golf-mode-button"
            }
            onClick={props.onSelectShootMode}
          >
            Shoot
          </button>
        </div>
        <ClubSelectorReel
          selectedClubId={props.selectedClubId}
          isPutterLocked={props.isPutterLocked}
        />
      </div>

      <div
        className="golf-hud-wind"
        aria-label={`${windSpeedMph} mph ${windPoint}`}
      >
        <div className="golf-wind-rose" aria-hidden="true">
          <span
            className="golf-wind-needle"
            style={{
              transform: `rotate(${props.courseWind.blowToHeadingDegrees}deg)`,
            }}
          />
          <span className="golf-wind-hub">
            {windSpeedMph}
            <small>mph</small>
          </span>
        </div>
      </div>

      <div className="golf-hud-power" aria-label="Swing Power">
        <div className="golf-power-rail">
          <span
            className={
              props.windPower > 0.02
                ? "golf-power-fill is-winding"
                : "golf-power-fill"
            }
            style={{ height: `${props.windPower * 100}%` }}
          />
        </div>
        <p className="golf-power-label">Swing Power</p>
      </div>

      <div className="golf-hud-score">
        <p className="golf-dash-kicker">
          {props.playerName} · {COURSE_NAME} · Hole {props.courseHole.holeNumber} / 9
        </p>
        <p className="golf-score-hole">
          {props.courseHole.name}
          <span>Par {props.courseHole.par}</span>
        </p>
        <div className="golf-dash-meters">
          <DashMeter label="Strokes" value={String(props.strokesThisHole)} />
          <DashMeter
            label="To pin"
            value={`${Math.round(props.yardsToCup)}`}
            unit="yd"
          />
          <DashMeter label="Score" value={scoreLabel} />
          <DashMeter label="Total" value={String(props.totalStrokes)} />
        </div>
        <p className="golf-lie-label">{props.lieLabel}</p>
        {props.operatorMessage ? (
          <p className="golf-score-note">{props.operatorMessage}</p>
        ) : null}
      </div>

      {props.shotResultBanner ? (
        <div
          key={props.shotResultBanner.bannerKey}
          className="golf-shot-banner"
          role="status"
        >
          <p className="golf-shot-banner-power">
            {props.shotResultBanner.powerPercent}%
          </p>
          <p className="golf-shot-banner-distance">
            {props.shotResultBanner.travelYards} yd
          </p>
        </div>
      ) : null}
    </div>
  );
}

function DashMeter(props: { label: string; value: string; unit?: string }) {
  return (
    <div className="golf-meter">
      <p className="golf-dash-kicker">{props.label}</p>
      <p className="golf-meter-value">
        {props.value}
        {props.unit ? <small>{props.unit}</small> : null}
      </p>
    </div>
  );
}
