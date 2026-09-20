import { holeLengthYards, type CourseHole } from "./discGolfCourse";
import {
  compassPointFromHeadingDegrees,
  type CourseWind,
} from "./discGolfWind";

export function DiscGolfHoleIntro(props: {
  courseHole: CourseHole;
  courseWind: CourseWind;
}) {
  const windSpeedMph = Math.round(props.courseWind.speedMph);
  const windPoint = compassPointFromHeadingDegrees(
    props.courseWind.blowToHeadingDegrees,
  );

  return (
    <div className="golf-hole-intro disc-golf-card" role="status">
      <p className="golf-dash-kicker">Hole {props.courseHole.holeNumber} / 9</p>
      <h2>{props.courseHole.name}</h2>
      <p className="golf-hole-intro-line">
        Par {props.courseHole.par} · {holeLengthYards(props.courseHole)} yd
      </p>
      <p className="golf-hole-intro-wind">
        Wind {windSpeedMph} mph {windPoint}
      </p>
      <p className="golf-round-copy">{props.courseHole.brief}</p>
    </div>
  );
}
