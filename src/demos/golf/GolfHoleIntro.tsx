import { holeLengthYards, type CourseHole } from "./golfCourse";
import {
  compassPointFromHeadingDegrees,
  type CourseWind,
} from "./golfWind";

export function GolfHoleIntro(props: {
  courseHole: CourseHole;
  courseWind: CourseWind;
}) {
  const windSpeedMph = Math.round(props.courseWind.speedMph);
  const windPoint = compassPointFromHeadingDegrees(
    props.courseWind.blowToHeadingDegrees,
  );

  return (
    <div className="golf-hole-intro" role="status">
      <p className="golf-dash-kicker">Hole {props.courseHole.holeNumber} / 9</p>
      <h2>{props.courseHole.name}</h2>
      <p className="golf-hole-intro-line">
        Par {props.courseHole.par} · {holeLengthYards(props.courseHole)} yd
      </p>
      <p className="golf-hole-intro-wind">
        Wind {windSpeedMph} mph {windPoint}
      </p>
    </div>
  );
}
