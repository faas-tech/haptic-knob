import type { CourseHole, CoursePointYards, GreenTiltRisePerYard } from "./golfCourse";

const HEIGHT_SAMPLE_STEP_YARDS = 0.35;

export function greenHeightYards(
  courseHole: CourseHole,
  point: CoursePointYards,
): number {
  const scale = courseHole.greenUndulationScale ?? 1;
  if (scale <= 0 && !courseHole.greenTiltRisePerYard) {
    return 0;
  }

  const dx = point.xYards - courseHole.cup.xYards;
  const dy = point.yYards - courseHole.cup.yYards;
  const yardsToCup = Math.hypot(dx, dy);
  if (yardsToCup > courseHole.greenRadiusYards + 6) {
    return 0;
  }

  const tilt = courseHole.greenTiltRisePerYard;
  const tiltHeightYards = tilt
    ? tilt.xRisePerYard * dx + tilt.yRisePerYard * dy
    : 0;
  const seed = courseHole.holeNumber * 2.15;
  const waveHeightYards =
    0.15 * Math.sin(dx * 0.16 + seed) * Math.cos(dy * 0.13 + seed * 0.6) +
    0.08 * Math.sin((dx + dy) * 0.1 + seed * 1.4);
  const cupHeightYards = tilt
    ? 0
    : 0.15 * Math.sin(seed) * Math.cos(seed * 0.6) +
      0.08 * Math.sin(seed * 1.4);
  const bowlHeightYards = -0.03 * Math.exp(-(dx * dx + dy * dy) / 2.4);
  return (waveHeightYards - cupHeightYards) * scale + tiltHeightYards + bowlHeightYards;
}

export function greenSlopeRisePerYard(
  courseHole: CourseHole,
  point: CoursePointYards,
): GreenTiltRisePerYard {
  if (courseHole.greenTiltRisePerYard && (courseHole.greenUndulationScale ?? 1) <= 0) {
    return courseHole.greenTiltRisePerYard;
  }
  const step = HEIGHT_SAMPLE_STEP_YARDS;
  const east = greenHeightYards(courseHole, {
    xYards: point.xYards + step,
    yYards: point.yYards,
  });
  const west = greenHeightYards(courseHole, {
    xYards: point.xYards - step,
    yYards: point.yYards,
  });
  const north = greenHeightYards(courseHole, {
    xYards: point.xYards,
    yYards: point.yYards + step,
  });
  const south = greenHeightYards(courseHole, {
    xYards: point.xYards,
    yYards: point.yYards - step,
  });
  return {
    xRisePerYard: (east - west) / (step * 2),
    yRisePerYard: (north - south) / (step * 2),
  };
}
