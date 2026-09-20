import { DiscSelectorReel } from "./DiscSelectorReel";
import { ThrowBendMeter } from "./ThrowBendMeter";
import type { DiscId } from "./discGolfDiscs";
import { COURSE_NAME, type CourseHole } from "./discGolfCourse";
import {
  compassPointFromHeadingDegrees,
  type CourseWind,
} from "./discGolfWind";

export type DiscGolfPlayMode = "direction" | "throw";

export type DiscGolfThrowBanner = {
  bannerKey: number;
  powerPercent: number;
  travelYards: number;
  hyzerLabel: string;
};

export function DiscGolfPlayerDashboard(props: {
  playerName: string;
  courseHole: CourseHole;
  playMode: DiscGolfPlayMode;
  selectedDiscId: DiscId;
  throwPower: number;
  throwHyzer01: number;
  courseWind: CourseWind;
  throwsThisHole: number;
  yardsToBasket: number;
  scoreVsPar: number;
  totalThrows: number;
  completedHoleCount: number;
  operatorMessage: string;
  lieLabel: string;
  throwBanner: DiscGolfThrowBanner | null;
  onSelectDirectionMode: () => void;
  onSelectThrowMode: () => void;
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
              props.playMode === "throw"
                ? "golf-mode-button is-active"
                : "golf-mode-button"
            }
            onClick={props.onSelectThrowMode}
          >
            Throw
          </button>
        </div>
        <DiscSelectorReel selectedDiscId={props.selectedDiscId} />
      </div>

      <div
        className="golf-hud-wind"
        aria-label={`${windSpeedMph} mph ${windPoint}`}
      >
        <div className="golf-wind-rose">
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

      <ThrowBendMeter
        throwPower={props.throwPower}
        throwHyzer01={props.throwHyzer01}
      />

      <div className="golf-hud-score">
        <p className="golf-dash-kicker">
          {COURSE_NAME} · {props.playerName}
        </p>
        <p className="golf-score-hole">
          Hole {props.courseHole.holeNumber}
          <span>
            Par {props.courseHole.par} · throw {props.throwsThisHole}
          </span>
        </p>
        <div className="golf-dash-meters">
          <p className="golf-meter-value">
            {Math.round(props.yardsToBasket)}
            <small>yd</small>
          </p>
          <p className="golf-meter-value">
            {scoreLabel}
            <small>{props.totalThrows} total</small>
          </p>
        </div>
        <p className="golf-lie-label">{props.lieLabel}</p>
        {props.operatorMessage ? (
          <p className="golf-score-note">{props.operatorMessage}</p>
        ) : null}
      </div>

      {props.throwBanner ? (
        <div key={props.throwBanner.bannerKey} className="golf-shot-banner">
          <p className="golf-shot-banner-power">
            {props.throwBanner.powerPercent}% · {props.throwBanner.hyzerLabel}
          </p>
          <p className="golf-shot-banner-distance">
            {props.throwBanner.travelYards} yd
          </p>
        </div>
      ) : null}
    </div>
  );
}
