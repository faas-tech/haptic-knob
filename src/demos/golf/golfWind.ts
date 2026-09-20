export type CourseWind = {
  speedMph: number;
  blowToHeadingDegrees: number;
};

export const MIN_WIND_SPEED_MPH = 2;
export const MAX_WIND_SPEED_MPH = 16;

const COMPASS_POINTS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

export function rollCourseWind(): CourseWind {
  return {
    speedMph:
      MIN_WIND_SPEED_MPH +
      Math.random() * (MAX_WIND_SPEED_MPH - MIN_WIND_SPEED_MPH),
    blowToHeadingDegrees: Math.random() * 360,
  };
}

export function compassPointFromHeadingDegrees(headingDegrees: number): string {
  const wrappedDegrees = ((headingDegrees % 360) + 360) % 360;
  const index = Math.round(wrappedDegrees / 45) % COMPASS_POINTS.length;
  return COMPASS_POINTS[index];
}

export function windPushYards(args: {
  courseWind: CourseWind;
  carryYards: number;
  loftDegrees: number;
  isPutter: boolean;
}): { xYards: number; yYards: number } {
  const loftScale = args.isPutter ? 0.08 : 0.18 + args.loftDegrees / 220;
  const pushYards =
    args.courseWind.speedMph * (args.carryYards / 110) * loftScale;
  const headingRadians = (args.courseWind.blowToHeadingDegrees * Math.PI) / 180;
  return {
    xYards: Math.sin(headingRadians) * pushYards,
    yYards: Math.cos(headingRadians) * pushYards,
  };
}
