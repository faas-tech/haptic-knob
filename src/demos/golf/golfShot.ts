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

export const PUTT_CAPTURE_RADIUS_YARDS = 1.7;
export const PUTT_HOLE_OUT_MAX_OVERSHOOT_YARDS = 8;
const PUTT_LIP_SPEED_KEEP_RATIO = 0.35;
const PUTT_STEP_YARDS = 0.2;
const PUTT_BREAK_DEGREES_PER_SLOPE_PER_YARD = 48;
const PUTT_GRADE_CONSUME = 1.2;
const APPROACH_HOLE_OUT_YARDS = 1.2;
const ROLL_STEP_YARDS = 0.5;

const SURFACE_ROLL: Record<CourseSurface, number> = {
  tee: 0.85,
  fairway: 1,
  rough: 0.32,
  "tall-rough": 0.12,
  sand: 0.1,
  water: 0,
  green: 0.52,
  cup: 0,
};

const ROLL_CONSUME_BY_SURFACE: Record<CourseSurface, number> = {
  tee: 1,
  fairway: 1,
  rough: 1.85,
  "tall-rough": 2.8,
  sand: 3.2,
  water: 80,
  green: 1.12,
  cup: 80,
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

export function puttPowerFromHold01(hold01: number): number {
  const t = clampPower(hold01);
  return t ** 1.15;
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

export const FULL_WIND_DEGREES = 90;
export const MINIMUM_SHOT_POWER = 0.05;

export type GolfFlightPointYards = CoursePointYards & {
  heightYards: number;
};

export type ShotShapeName = "Draw" | "Fade" | "Straight";

export function swingFromKnobDelta(deltaDegrees: number): {
  power: number;
  shape01: number;
} {
  const signed01 = deltaDegrees / FULL_WIND_DEGREES;
  const power = swingPowerFromHold01(Math.abs(signed01));
  if (power < MINIMUM_SHOT_POWER) {
    return { power: 0, shape01: 0 };
  }
  return {
    power,
    shape01: Math.max(-1, Math.min(1, signed01)),
  };
}

export function shotShapeLabel(shape01: number): ShotShapeName {
  if (shape01 < -0.12) {
    return "Draw";
  }
  if (shape01 > 0.12) {
    return "Fade";
  }
  return "Straight";
}

const SIDE_SPIN_CURVE_FRACTION = 0.12;

export function shotLateralYards(args: {
  progress01: number;
  shape01: number;
  carryYards: number;
}): number {
  const t = Math.max(0, Math.min(1, args.progress01));
  const shape01 = Math.max(-1, Math.min(1, args.shape01));
  const bananaArc01 = (1 - Math.cos(Math.PI * t)) / 2;
  return shape01 * args.carryYards * SIDE_SPIN_CURVE_FRACTION * bananaArc01;
}

export function pointAlongShotShape(args: {
  origin: CoursePointYards;
  headingDegrees: number;
  alongYards: number;
  carryYards: number;
  shape01: number;
}): CoursePointYards {
  const headingRadians = (args.headingDegrees * Math.PI) / 180;
  const alongX = Math.sin(headingRadians);
  const alongY = Math.cos(headingRadians);
  const rightX = Math.cos(headingRadians);
  const rightY = -Math.sin(headingRadians);
  const progress01 =
    args.carryYards > 0 ? args.alongYards / args.carryYards : 0;
  const lateralYards = shotLateralYards({
    progress01,
    shape01: args.shape01,
    carryYards: args.carryYards,
  });
  return {
    xYards:
      args.origin.xYards + alongX * args.alongYards + rightX * lateralYards,
    yYards:
      args.origin.yYards + alongY * args.alongYards + rightY * lateralYards,
  };
}

export function headingDegreesBetweenPoints(
  from: CoursePointYards,
  to: CoursePointYards,
): number {
  return (
    (Math.atan2(to.xYards - from.xYards, to.yYards - from.yYards) * 180) /
    Math.PI
  );
}

export function previewGolfShotPath(args: {
  ball: CoursePointYards;
  headingDegrees: number;
  loftDegrees: number;
  carryYards: number;
  shape01: number;
  pointCount?: number;
}): GolfFlightPointYards[] {
  const pointCount = Math.max(2, args.pointCount ?? 22);
  const carryYards = Math.max(0, args.carryYards);
  const arcPoints = aimFlightArcPoints({
    loftDegrees: args.loftDegrees,
    carryYards,
    pointCount,
  });
  return arcPoints.map((point) => {
    const ground = pointAlongShotShape({
      origin: args.ball,
      headingDegrees: args.headingDegrees,
      alongYards: point.alongYards,
      carryYards,
      shape01: args.shape01,
    });
    return {
      ...ground,
      heightYards: point.heightYards,
    };
  });
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
  shape01?: number;
}): ShotResult {
  const lieSurface = surfaceAtPosition(args.courseHole, args.ball);
  const power = clampPower(args.power) * liePowerScale(lieSurface);
  const isPutter = args.club.id === "putter";
  const shape01 = isPutter ? 0 : Math.max(-1, Math.min(1, args.shape01 ?? 0));
  const carryYards = isPutter
    ? args.club.puttYards * power
    : args.club.carryYards * power;

  const carryPoints = sampleShapedShotPoints({
    origin: args.ball,
    headingDegrees: args.headingDegrees,
    carryYards,
    shape01,
  });
  const uncorrectedLanding =
    carryPoints[carryPoints.length - 1] ??
    pointAlongHeading(args.ball, args.headingDegrees, carryYards);
  const windOffset = windPushYards({
    courseWind: args.courseWind,
    carryYards,
    loftDegrees: args.club.loftDegrees,
    isPutter,
  });
  const landing = {
    xYards: uncorrectedLanding.xYards + windOffset.xYards,
    yYards: uncorrectedLanding.yYards + windOffset.yYards,
  };

  const treeOnCarry = firstTreeHitOnShapedPath(
    args.courseHole,
    carryPoints,
    landing,
  );
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
      displayPath: carryPoints,
    };
  }

  const previousCarryPoint =
    carryPoints.length > 1
      ? carryPoints[carryPoints.length - 2]
      : args.ball;
  const rollHeadingDegrees = headingDegreesBetweenPoints(
    previousCarryPoint,
    landing,
  );
  const rollYards = isPutter
    ? 0
    : carryYards * args.club.rollFactor * SURFACE_ROLL[landingSurface];
  const roll = rollBallAfterLanding({
    courseHole: args.courseHole,
    landing,
    headingDegrees: rollHeadingDegrees,
    rollYards,
  });
  const rest = roll.rest;

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
      displayPath: carryPoints,
    };
  }

  const isInCup =
    (restSurface === "green" || restSurface === "cup") &&
    distanceYards(rest, args.courseHole.cup) <=
      (landingSurface === "green" ? APPROACH_HOLE_OUT_YARDS : CUP_RADIUS_YARDS);
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
    displayPath:
      distanceYards(landing, restPoint) < 0.2
        ? carryPoints
        : [...carryPoints, restPoint],
  };
}

function sampleShapedShotPoints(args: {
  origin: CoursePointYards;
  headingDegrees: number;
  carryYards: number;
  shape01: number;
  stepYards?: number;
}): CoursePointYards[] {
  const carryYards = Math.max(0, args.carryYards);
  if (carryYards < 0.2) {
    return [args.origin];
  }
  const pointCount = Math.max(32, Math.ceil(carryYards) + 1);
  return previewGolfShotPath({
    ball: args.origin,
    headingDegrees: args.headingDegrees,
    loftDegrees: 12,
    carryYards,
    shape01: args.shape01,
    pointCount,
  }).map((point) => ({
    xYards: point.xYards,
    yYards: point.yYards,
  }));
}

function firstTreeHitOnShapedPath(
  courseHole: CourseHole,
  carryPoints: CoursePointYards[],
  landing: CoursePointYards,
) {
  const path =
    carryPoints[carryPoints.length - 1] === landing
      ? carryPoints
      : [...carryPoints, landing];
  for (let index = 0; index < path.length - 1; index += 1) {
    const hit = firstTreeHitOnPath(courseHole, path[index], path[index + 1]);
    if (hit) {
      return hit;
    }
  }
  return null;
}

export function simulatePutt(args: {
  courseHole: CourseHole;
  ball: CoursePointYards;
  headingDegrees: number;
  travelYards: number;
}): { rest: CoursePointYards; isInCup: boolean; path: CoursePointYards[] } {
  const path: CoursePointYards[] = [args.ball];
  const cup = args.courseHole.cup;
  const startDistanceYards = Math.max(0.4, distanceYards(args.ball, cup));
  let xYards = args.ball.xYards;
  let yYards = args.ball.yYards;
  let headingDegrees = args.headingDegrees;
  let remainingYards = Math.max(0, args.travelYards);
  let closestMissYards = startDistanceYards;
  let leftoverAtClosestYards = remainingYards;
  let hasPassedClosest = false;

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
    remainingYards -= Math.max(0.03, consumeYards);
    xYards += alongX * stepYards;
    yYards += alongY * stepYards;
    const point = { xYards, yYards };
    path.push(point);
    const yardsToCup = distanceYards(point, cup);
    if (yardsToCup < closestMissYards) {
      closestMissYards = yardsToCup;
      leftoverAtClosestYards = remainingYards;
    } else if (
      !hasPassedClosest &&
      path.length > 2 &&
      yardsToCup > closestMissYards + 0.15
    ) {
      hasPassedClosest = true;
      if (
        puttCanFallIn({
          missYards: closestMissYards,
          remainingYards: leftoverAtClosestYards,
          startDistanceYards,
        })
      ) {
        return { rest: cup, isInCup: true, path: [...path, cup] };
      }
      remainingYards *= PUTT_LIP_SPEED_KEEP_RATIO;
    }
    if (path.length > 260) {
      break;
    }
  }

  const last = path[path.length - 1] ?? args.ball;
  if (
    puttCanFallIn({
      missYards: distanceYards(last, cup),
      remainingYards: 0,
      startDistanceYards,
    })
  ) {
    return { rest: cup, isInCup: true, path: [...path, cup] };
  }
  return { rest: last, isInCup: false, path };
}

function puttCanFallIn(args: {
  missYards: number;
  remainingYards: number;
  startDistanceYards: number;
}): boolean {
  const startYards = Math.max(1, args.startDistanceYards);
  const leftover01 = args.remainingYards / startYards;
  const shortPuttBonusYards =
    startYards <= 3.5 ? 0.4 : startYards <= 7 ? 0.18 : 0;
  const captureYards = Math.min(
    PUTT_CAPTURE_RADIUS_YARDS,
    CUP_RADIUS_YARDS +
      (1 - Math.min(1, leftover01 / 0.65)) * 1.2 +
      shortPuttBonusYards,
  );
  if (args.missYards > captureYards) {
    return false;
  }
  const maxLeftoverYards = Math.max(
    PUTT_HOLE_OUT_MAX_OVERSHOOT_YARDS,
    startYards * 0.75,
  );
  return args.remainingYards <= maxLeftoverYards;
}

function rollBallAfterLanding(args: {
  courseHole: CourseHole;
  landing: CoursePointYards;
  headingDegrees: number;
  rollYards: number;
}): { rest: CoursePointYards } {
  if (args.rollYards < 0.08) {
    return { rest: args.landing };
  }
  const headingRadians = (args.headingDegrees * Math.PI) / 180;
  const alongX = Math.sin(headingRadians);
  const alongY = Math.cos(headingRadians);
  let xYards = args.landing.xYards;
  let yYards = args.landing.yYards;
  let remainingYards = args.rollYards;
  let rest = args.landing;
  for (let stepIndex = 0; stepIndex < 90 && remainingYards > 0.08; stepIndex += 1) {
    const surface = surfaceAtPosition(args.courseHole, { xYards, yYards });
    const consumeScale = ROLL_CONSUME_BY_SURFACE[surface];
    if (surface === "water" || surface === "cup") {
      return { rest };
    }
    const stepYards = Math.min(ROLL_STEP_YARDS, remainingYards / consumeScale);
    remainingYards -= stepYards * consumeScale;
    xYards += alongX * stepYards;
    yYards += alongY * stepYards;
    const next = { xYards, yYards };
    if (surfaceAtPosition(args.courseHole, next) === "water") {
      return { rest };
    }
    rest = next;
  }
  return { rest };
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
