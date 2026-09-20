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

export function windAlongThrow01(args: {
  courseWind: CourseWind;
  throwHeadingDegrees: number;
}): number {
  const headingRadians =
    ((args.courseWind.blowToHeadingDegrees - args.throwHeadingDegrees) *
      Math.PI) /
    180;
  return Math.cos(headingRadians);
}

export function windAcrossThrow01(args: {
  courseWind: CourseWind;
  throwHeadingDegrees: number;
}): number {
  const headingRadians =
    ((args.courseWind.blowToHeadingDegrees - args.throwHeadingDegrees) *
      Math.PI) /
    180;
  return Math.sin(headingRadians);
}
