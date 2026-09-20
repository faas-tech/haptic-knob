import type { GolfClub } from "./golfClubs";
import {
  CUP_RADIUS_YARDS,
  distanceYards,
  firstTreeHitOnPath,
  headingDegreesToCup,
  surfaceAtPosition,
  type CourseHole,
  type CoursePointYards,
  type CourseSurface,
} from "./golfCourse";
import { greenSlopeRisePerYard } from "./golfGreen";
import { windPushYards, type CourseWind } from "./golfWind";

export type ShotResult = {
  landing: CoursePointYards;
  rest: CoursePointYards;
  travelYards: number;
  surfaceAtRest: CourseSurface;
  isInCup: boolean;
  tookWaterPenalty: boolean;
  hitTree: boolean;
  treePoint: CoursePointYards | null;
  dropPosition: CoursePointYards | null;
  displayPath: CoursePointYards[];
};

export const PUTT_CAPTURE_RADIUS_YARDS = 1.15;
export const PUTT_HOLE_OUT_MAX_OVERSHOOT_YARDS = 2.2;
const PUTT_KEPT_OVERSHOOT_RATIO = 0.5;
const PUTT_STEP_YARDS = 0.25;
const PUTT_BREAK_DEGREES_PER_SLOPE_PER_YARD = 80;
const PUTT_GRADE_CONSUME = 1.6;

const SURFACE_ROLL: Record<CourseSurface, number> = {
  tee: 0.85,
  fairway: 1,
  rough: 0.35,
  "tall-rough": 0.14,
  sand: 0.12,
  water: 0,
  green: 0.7,
  cup: 0,
};

export function clampPower(power: number): number {
  return Math.min(1, Math.max(0, power));
}

const SWING_POWER_LINEAR_UNTIL = 0.72;

export function swingPowerFromHold01(hold01: number): number {
  const t = clampPower(hold01);
  if (t <= SWING_POWER_LINEAR_UNTIL) {
    return t;
  }
  const tail01 = (t - SWING_POWER_LINEAR_UNTIL) / (1 - SWING_POWER_LINEAR_UNTIL);
  return SWING_POWER_LINEAR_UNTIL + (1 - SWING_POWER_LINEAR_UNTIL) * tail01 * tail01;
}

export function liePowerScale(surface: CourseSurface): number {
  if (surface === "sand") {
    return 0.5;
  }
  if (surface === "tall-rough") {
    return 0.7;
  }
  if (surface === "rough") {
    return 0.8;
  }
  return 1;
}

export function liePowerLabel(surface: CourseSurface): string {
  if (surface === "sand") {
    return "Sand · 50% power";
  }
  if (surface === "tall-rough") {
    return "Tall rough · 70% power";
  }
  if (surface === "rough") {
    return "Rough · 80% power";
  }
  if (surface === "green" || surface === "cup") {
    return "Green";
  }
  if (surface === "tee") {
    return "Tee · full power";
  }
  return "Fairway · full power";
}

export function punchOutHeadingDegrees(
  restAtBase: CoursePointYards,
  target: CoursePointYards,
  courseHole: CourseHole,
): number {
  const preferredHeadingDegrees = headingDegreesToCup(restAtBase, target);
  for (let offsetDegrees = 0; offsetDegrees <= 170; offsetDegrees += 8) {
    const headings =
      offsetDegrees === 0
        ? [preferredHeadingDegrees]
        : [
            preferredHeadingDegrees + offsetDegrees,
            preferredHeadingDegrees - offsetDegrees,
          ];
    for (const headingDegrees of headings) {
      const probe = pointAlongHeading(restAtBase, headingDegrees, 28);
      if (!firstTreeHitOnPath(courseHole, restAtBase, probe)) {
        return headingDegrees;
      }
    }
  }
  return preferredHeadingDegrees;
}

export function aimFlightArcPoints(args: {
  loftDegrees: number;
  carryYards: number;
  pointCount: number;
}): { alongYards: number; heightYards: number }[] {
  const pointCount = Math.max(2, args.pointCount);
  const carryYards = Math.max(0, args.carryYards);
  const launchRadians = (Math.max(2, args.loftDegrees) * Math.PI) / 180;
  const peakHeightYards =
    carryYards > 0 ? (carryYards * Math.tan(launchRadians)) / 4 : 0;
  const points: { alongYards: number; heightYards: number }[] = [];
  for (let index = 0; index < pointCount; index += 1) {
    const t = index / (pointCount - 1);
    points.push({
      alongYards: carryYards * t,
      heightYards: 4 * peakHeightYards * t * (1 - t),
    });
  }
  return points;
}

export function pointAlongHeading(
  origin: CoursePointYards,
  headingDegrees: number,
  yards: number,
): CoursePointYards {
  const headingRadians = (headingDegrees * Math.PI) / 180;
  return {
    xYards: origin.xYards + Math.sin(headingRadians) * yards,
    yYards: origin.yYards + Math.cos(headingRadians) * yards,
  };
}

export function playGolfShot(args: {
  courseHole: CourseHole;
  ball: CoursePointYards;
  lastSafeLie: CoursePointYards;
  club: GolfClub;
  headingDegrees: number;
  power: number;
  courseWind: CourseWind;
}): ShotResult {
  const lieSurface = surfaceAtPosition(args.courseHole, args.ball);
  const power = clampPower(args.power) * liePowerScale(lieSurface);
  const carryYards =
    args.club.id === "putter"
      ? args.club.puttYards * power
      : args.club.carryYards * power;

  const uncorrectedLanding = pointAlongHeading(
    args.ball,
    args.headingDegrees,
    carryYards,
  );
  const windOffset = windPushYards({
    courseWind: args.courseWind,
    carryYards,
    loftDegrees: args.club.loftDegrees,
    isPutter: args.club.id === "putter",
  });
  const landing = {
    xYards: uncorrectedLanding.xYards + windOffset.xYards,
    yYards: uncorrectedLanding.yYards + windOffset.yYards,
  };

  const treeOnCarry = firstTreeHitOnPath(args.courseHole, args.ball, landing);
  if (treeOnCarry) {
    return treeShotResult(
      args.ball,
      treeOnCarry.restAtBase,
      treeOnCarry.treePoint,
      args.courseHole,
    );
  }

  const landingSurface = surfaceAtPosition(args.courseHole, landing);

  if (landingSurface === "water") {
    return {
      landing,
      rest: args.lastSafeLie,
      travelYards: distanceYards(args.ball, landing),
      surfaceAtRest: surfaceAtPosition(args.courseHole, args.lastSafeLie),
      isInCup: false,
      tookWaterPenalty: true,
      hitTree: false,
      treePoint: null,
      dropPosition: args.lastSafeLie,
      displayPath: [args.ball, landing],
    };
  }

  const rollYards =
    args.club.id === "putter"
      ? 0
      : carryYards * args.club.rollFactor * SURFACE_ROLL[landingSurface];
  const rest = pointAlongHeading(landing, args.headingDegrees, rollYards);

  const treeOnRoll = firstTreeHitOnPath(args.courseHole, landing, rest);
  if (treeOnRoll) {
    return treeShotResult(
      args.ball,
      treeOnRoll.restAtBase,
      treeOnRoll.treePoint,
      args.courseHole,
    );
  }

  if (args.club.id === "putter") {
    const puttFinish = simulatePutt({
      courseHole: args.courseHole,
      ball: args.ball,
      headingDegrees: args.headingDegrees,
      travelYards: distanceYards(args.ball, landing),
    });
    return {
      landing: puttFinish.rest,
      rest: puttFinish.rest,
      travelYards: distanceYards(args.ball, puttFinish.rest),
      surfaceAtRest: puttFinish.isInCup
        ? "cup"
        : surfaceAtPosition(args.courseHole, puttFinish.rest),
      isInCup: puttFinish.isInCup,
      tookWaterPenalty: false,
      hitTree: false,
      treePoint: null,
      dropPosition: null,
      displayPath: puttFinish.path,
    };
  }

  const restSurface = surfaceAtPosition(args.courseHole, rest);

  if (restSurface === "water") {
    return {
      landing,
      rest: landing,
      travelYards: distanceYards(args.ball, landing),
      surfaceAtRest: landingSurface,
      isInCup: false,
      tookWaterPenalty: true,
      hitTree: false,
      treePoint: null,
      dropPosition: landing,
      displayPath: [args.ball, landing],
    };
  }

  const isInCup =
    distanceYards(rest, args.courseHole.cup) <= CUP_RADIUS_YARDS &&
    (restSurface === "green" || restSurface === "cup");
  const restPoint = isInCup ? args.courseHole.cup : rest;

  return {
    landing,
    rest: restPoint,
    travelYards: distanceYards(args.ball, restPoint),
    surfaceAtRest: isInCup ? "cup" : restSurface,
    isInCup,
    tookWaterPenalty: false,
    hitTree: false,
    treePoint: null,
    dropPosition: null,
    displayPath: [args.ball, restPoint],
  };
}

export function simulatePutt(args: {
  courseHole: CourseHole;
  ball: CoursePointYards;
  headingDegrees: number;
  travelYards: number;
}): { rest: CoursePointYards; isInCup: boolean; path: CoursePointYards[] } {
  const path: CoursePointYards[] = [args.ball];
  const cup = args.courseHole.cup;
  let xYards = args.ball.xYards;
  let yYards = args.ball.yYards;
  let headingDegrees = args.headingDegrees;
  let remainingYards = Math.max(0, args.travelYards);
  let hasCrossedCup = false;

  while (remainingYards > 0.02) {
    const slope = greenSlopeRisePerYard(args.courseHole, {
      xYards,
      yYards,
    });
    const headingRadians = (headingDegrees * Math.PI) / 180;
    const alongX = Math.sin(headingRadians);
    const alongY = Math.cos(headingRadians);
    const alongGrade = slope.xRisePerYard * alongX + slope.yRisePerYard * alongY;
    const crossGrade = slope.xRisePerYard * alongY - slope.yRisePerYard * alongX;
    headingDegrees +=
      -crossGrade * PUTT_BREAK_DEGREES_PER_SLOPE_PER_YARD * PUTT_STEP_YARDS;
    const stepYards = Math.min(PUTT_STEP_YARDS, remainingYards);
    const consumeYards = stepYards * (1 + alongGrade * PUTT_GRADE_CONSUME);
    remainingYards -= Math.max(0.04, consumeYards);
    xYards += alongX * stepYards;
    yYards += alongY * stepYards;
    const point = { xYards, yYards };
    path.push(point);
    const yardsToCup = distanceYards(point, cup);
    if (yardsToCup <= PUTT_CAPTURE_RADIUS_YARDS && !hasCrossedCup) {
      hasCrossedCup = true;
      if (remainingYards <= PUTT_HOLE_OUT_MAX_OVERSHOOT_YARDS + 0.001) {
        return { rest: cup, isInCup: true, path: [...path, cup] };
      }
      remainingYards *= PUTT_KEPT_OVERSHOOT_RATIO;
    }
    if (path.length > 220) {
      break;
    }
  }

  const last = path[path.length - 1] ?? args.ball;
  if (distanceYards(last, cup) <= CUP_RADIUS_YARDS) {
    return { rest: cup, isInCup: true, path: [...path, cup] };
  }
  return { rest: last, isInCup: false, path };
}

function treeShotResult(
  from: CoursePointYards,
  restAtBase: CoursePointYards,
  treePoint: CoursePointYards,
  courseHole: CourseHole,
): ShotResult {
  return {
    landing: restAtBase,
    rest: restAtBase,
    travelYards: distanceYards(from, restAtBase),
    surfaceAtRest: surfaceAtPosition(courseHole, restAtBase),
    isInCup: false,
    tookWaterPenalty: false,
    hitTree: true,
    treePoint,
    dropPosition: null,
    displayPath: [from, restAtBase],
  };
}
