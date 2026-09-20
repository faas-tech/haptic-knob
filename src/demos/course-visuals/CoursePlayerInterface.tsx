import { useRef, type ReactNode } from "react";

type CoursePoint = { xYards: number; yYards: number };

export function CoursePlayerInterface(props: {
  sport: "golf" | "disc-golf";
  courseName: string;
  holeName: string;
  holeNumber: number;
  par: number;
  playerName: string;
  scoreLabel: string;
  strokes: number;
  totalStrokes: number;
  distanceYards: number;
  lieLabel: string;
  message: string;
  power: number;
  isInFlight: boolean;
  isComplete: boolean;
  isAiming: boolean;
  windSpeedMph: number;
  windHeadingDegrees: number;
  equipmentName: string;
  equipmentDetail: string;
  canChangeEquipment: boolean;
  onPreviousEquipment: () => void;
  onNextEquipment: () => void;
  onAim: () => void;
  onPrepareShot: () => void;
  onAimLeft: () => void;
  onAimRight: () => void;
  onCharge: () => void;
  onRelease: () => void;
  onCancelCharge: () => void;
  tee: CoursePoint;
  target: CoursePoint;
  position: CoursePoint;
  fairwayWaypoints: CoursePoint[];
  waters: { center: CoursePoint; radiusYards: number }[];
  headingDegrees: number;
  bendMeter?: ReactNode;
  result: {
    key: number;
    powerPercent: number;
    travelYards: number;
    detail?: string;
  } | null;
}) {
  const pointerChargeRef = useRef(false);
  const action =
    props.sport === "golf"
      ? props.equipmentName === "Putter"
        ? "Putt"
        : "Swing"
      : "Throw";
  const isDisabled = props.isInFlight || props.isComplete;
  const releaseCharge = () => {
    if (!pointerChargeRef.current) return;
    pointerChargeRef.current = false;
    props.onRelease();
  };
  return (
    <div className="course-interface">
      <div className="course-vignette" />
      <section className="course-score-panel" aria-label="Round score">
        <div className="course-hole-number">
          {String(props.holeNumber).padStart(2, "0")}
          <small>/ 09</small>
        </div>
        <div className="course-hole-details">
          <p className="course-eyebrow">{props.courseName}</p>
          <h2>{props.holeName}</h2>
          <p>
            Par {props.par}
            <span>·</span>
            {props.playerName}
          </p>
        </div>
        <div className="course-round-score">
          <strong>{props.scoreLabel}</strong>
          <small>TO PAR</small>
        </div>
        <div
          className="course-hole-progress"
          aria-label={`Hole ${props.holeNumber} of 9`}
        >
          {Array.from({ length: 9 }, (_, index) => (
            <span
              key={index}
              className={
                index < props.holeNumber - 1
                  ? "is-complete"
                  : index === props.holeNumber - 1
                    ? "is-current"
                    : ""
              }
            />
          ))}
        </div>
      </section>

      <aside className="course-overview-panel" aria-label="Hole overview">
        <div className="course-overview-heading">
          <span>COURSE VIEW</span>
          <span>N ↑</span>
        </div>
        <CourseOverview {...props} />
        <div className="course-wind">
          <span
            className="course-wind-arrow"
            style={{ transform: `rotate(${props.windHeadingDegrees}deg)` }}
          >
            ↑
          </span>
          <strong>
            {props.windSpeedMph}
            <small> mph</small>
          </strong>
          <span>WIND</span>
        </div>
      </aside>

      <div className="course-distance-panel">
        <p className="course-eyebrow">
          {props.isInFlight
            ? "IN FLIGHT"
            : props.sport === "golf"
              ? "TO THE PIN"
              : "TO THE BASKET"}
        </p>
        <strong>
          {Math.round(props.distanceYards)}
          <small>yd</small>
        </strong>
        <p className="course-lie">
          <span />
          {props.isInFlight ? "Tracking your shot" : props.lieLabel}
        </p>
        <p className="course-strokes">
          {props.strokes} {props.sport === "golf" ? "strokes" : "throws"} this
          hole <span>· {props.totalStrokes} total</span>
        </p>
      </div>

      <section className="course-controls" aria-label="Shot controls">
        <div className="course-equipment">
          <button
            type="button"
            aria-label="Previous equipment"
            disabled={!props.canChangeEquipment || isDisabled}
            onClick={props.onPreviousEquipment}
          >
            ‹
          </button>
          <div className="course-equipment-icon" aria-hidden="true">
            {props.sport === "golf" ? (
              <svg viewBox="0 0 48 48">
                <path d="M30 5 17 35q-3 7 5 7h10q5-1 4-5l-2-3-12 1" />
                <path d="m27 6 5 2" />
              </svg>
            ) : (
              <svg viewBox="0 0 48 48">
                <ellipse cx="24" cy="26" rx="19" ry="9" />
                <path d="M5 26v4c0 12 38 12 38 0v-4M12 23c6-5 18-5 24 0" />
              </svg>
            )}
          </div>
          <div>
            <strong>{props.equipmentName}</strong>
            <small>{props.equipmentDetail}</small>
          </div>
          <button
            type="button"
            aria-label="Next equipment"
            disabled={!props.canChangeEquipment || isDisabled}
            onClick={props.onNextEquipment}
          >
            ›
          </button>
        </div>
        <div className="course-control-row">
          <div className="course-mode-tabs" role="group" aria-label="Play mode">
            <button
              type="button"
              aria-pressed={props.isAiming}
              disabled={isDisabled}
              className={props.isAiming ? "is-active" : ""}
              onClick={props.onAim}
            >
              <kbd>A</kbd> Aim
            </button>
            <button
              type="button"
              aria-pressed={!props.isAiming}
              disabled={isDisabled}
              className={!props.isAiming ? "is-active" : ""}
              onClick={props.onPrepareShot}
            >
              <kbd>S</kbd> {action}
            </button>
          </div>
          <div className="course-aim-buttons">
            <button
              type="button"
              aria-label="Aim left"
              disabled={isDisabled}
              onClick={props.onAimLeft}
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Aim right"
              disabled={isDisabled}
              onClick={props.onAimRight}
            >
              →
            </button>
          </div>
          <button
            type="button"
            className={`course-charge-button${props.power > 0.02 ? " is-charging" : ""}`}
            disabled={isDisabled}
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              pointerChargeRef.current = true;
              props.onCharge();
            }}
            onPointerUp={releaseCharge}
            onPointerCancel={() => {
              pointerChargeRef.current = false;
              props.onCancelCharge();
            }}
            onLostPointerCapture={() => {
              if (pointerChargeRef.current) {
                pointerChargeRef.current = false;
                props.onCancelCharge();
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.repeat) {
                pointerChargeRef.current = true;
                props.onCharge();
              }
            }}
            onKeyUp={(event) => {
              if (event.key === "Enter") releaseCharge();
            }}
            onBlur={() => {
              if (pointerChargeRef.current) {
                pointerChargeRef.current = false;
                props.onCancelCharge();
              }
            }}
          >
            {props.isComplete
              ? "Hole complete"
              : props.isInFlight
                ? "Follow the flight"
                : props.power > 0.02
                  ? `Release · ${Math.round(props.power * 100)}%`
                  : `Hold to ${action.toLowerCase()}`}
          </button>
        </div>
        <p className="course-control-hint">
          {props.sport === "golf" ? (
            <>
              <kbd>← →</kbd> Aim <kbd>[ ]</kbd> Clubs <kbd>SPACE</kbd> Hold,
              then release
            </>
          ) : (
            <>
              <kbd>Z</kbd> Hyzer <kbd>X</kbd> Anhyzer <kbd>SPACE</kbd> Flat
              throw
            </>
          )}
        </p>
      </section>

      <div
        className="course-power-panel"
        aria-label={`${action} power ${Math.round(props.power * 100)} percent`}
      >
        {props.bendMeter ?? (
          <>
            <div className="course-power-scale">
              <span>100</span>
              <span>50</span>
              <span>0</span>
            </div>
            <div className="course-power-track">
              <div style={{ height: `${props.power * 100}%` }} />
              <span />
              <span />
              <span />
            </div>
            <strong>
              {Math.round(props.power * 100)}
              <small>%</small>
            </strong>
            <p>POWER</p>
          </>
        )}
      </div>
      {props.message && !props.isInFlight && !props.isComplete ? (
        <p className="course-status-message" role="status">
          {props.message}
        </p>
      ) : null}
      {props.isInFlight ? (
        <div className="course-flight-label">
          <span /> SHOT IN MOTION
        </div>
      ) : null}
      {props.result && !props.isInFlight ? (
        <div
          className="course-shot-result"
          key={props.result.key}
          role="status"
        >
          <div className="course-result-mark" aria-hidden="true">
            ↗
          </div>
          <div>
            <p className="course-eyebrow">SHOT COMPLETE</p>
            <strong>
              {props.result.travelYards}
              <small> yd</small>
            </strong>
          </div>
          <p>
            {props.result.powerPercent}% power
            {props.result.detail ? <span>{props.result.detail}</span> : null}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function CourseOverview(props: {
  tee: CoursePoint;
  target: CoursePoint;
  position: CoursePoint;
  fairwayWaypoints: CoursePoint[];
  waters: { center: CoursePoint; radiusYards: number }[];
  headingDegrees: number;
}) {
  const path = [props.tee, ...props.fairwayWaypoints, props.target];
  const allPoints = [
    ...path,
    props.position,
    ...props.waters.map((water) => water.center),
  ];
  const minX = Math.min(...allPoints.map((point) => point.xYards)) - 24;
  const maxX = Math.max(...allPoints.map((point) => point.xYards)) + 24;
  const minY = Math.min(...allPoints.map((point) => point.yYards)) - 20;
  const maxY = Math.max(...allPoints.map((point) => point.yYards)) + 20;
  const scale = Math.min(142 / (maxX - minX), 140 / (maxY - minY));
  const project = (point: CoursePoint) => ({
    x: 80 + (point.xYards - (minX + maxX) / 2) * scale,
    y: 80 - (point.yYards - (minY + maxY) / 2) * scale,
  });
  const current = project(props.position);
  const target = project(props.target);
  const tee = project(props.tee);
  return (
    <svg
      className="course-overview-map"
      viewBox="0 0 160 160"
      role="img"
      aria-label="Overhead course with your position and target"
    >
      <polyline
        points={path
          .map((point) => {
            const projected = project(point);
            return `${projected.x},${projected.y}`;
          })
          .join(" ")}
        fill="none"
        stroke="currentColor"
        strokeOpacity=".18"
        strokeWidth={Math.max(10, 26 * scale)}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {props.waters.map((water, index) => {
        const center = project(water.center);
        return (
          <circle
            key={index}
            cx={center.x}
            cy={center.y}
            r={water.radiusYards * scale}
            fill="#62bed5"
            opacity=".65"
          />
        );
      })}
      <path
        d={`M${current.x},${current.y} L${target.x},${target.y}`}
        stroke="currentColor"
        strokeOpacity=".35"
        strokeDasharray="2 4"
      />
      <rect
        x={tee.x - 2.5}
        y={tee.y - 2.5}
        width="5"
        height="5"
        fill="currentColor"
        opacity=".5"
      />
      <circle
        cx={target.x}
        cy={target.y}
        r="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx={target.x} cy={target.y} r="1.5" fill="currentColor" />
      <g
        transform={`translate(${current.x} ${current.y}) rotate(${props.headingDegrees})`}
      >
        <path d="M0 -11 -4 -5 4 -5Z" fill="#fff" />
        <circle r="3.5" fill="#fff" />
      </g>
    </svg>
  );
}

export function holeScoreName(strokes: number, par: number) {
  if (strokes === 1) return "Hole in one!";
  const difference = strokes - par;
  if (difference <= -3) return "Albatross!";
  if (difference === -2) return "Eagle!";
  if (difference === -1) return "Birdie!";
  if (difference === 0) return "Par!";
  if (difference === 1) return "Bogey";
  if (difference === 2) return "Double bogey";
  return "Hole complete";
}
