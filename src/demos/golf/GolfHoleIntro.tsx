import { holeLengthYards, type CourseHole } from "./golfCourse";
import { compassPointFromHeadingDegrees, type CourseWind } from "./golfWind";

export function GolfHoleIntro(props: {
  courseHole: CourseHole;
  courseWind: CourseWind;
  progress01: number;
  onSkip: () => void;
}) {
  const windSpeedMph = Math.round(props.courseWind.speedMph);
  const windPoint = compassPointFromHeadingDegrees(
    props.courseWind.blowToHeadingDegrees,
  );

  return (
    <div className="golf-hole-intro" role="status">
      <span className="course-intro-number" aria-hidden="true">
        {String(props.courseHole.holeNumber).padStart(2, "0")}
      </span>
      <p className="golf-dash-kicker">Hole {props.courseHole.holeNumber} / 9</p>
      <h2>{props.courseHole.name}</h2>
      <p className="golf-hole-intro-line">
        Par {props.courseHole.par} · {holeLengthYards(props.courseHole)} yd
      </p>
      <p className="golf-hole-intro-wind">
        Wind {windSpeedMph} mph {windPoint}
      </p>
      <div className="course-intro-footer">
        <span>SCOUT YOUR LINE</span>
        <button type="button" onClick={props.onSkip}>
          Skip flyover ↗
        </button>
      </div>
      <div className="course-intro-progress">
        <span style={{ transform: `scaleX(${props.progress01})` }} />
      </div>
    </div>
  );
}
