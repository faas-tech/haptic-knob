import type { DiscGolfDisc } from "./discGolfDiscs";
import {
  BASKET_CATCH_RADIUS_YARDS,
  distanceYards,
  firstTreeHitOnPath,
  headingDegreesToBasket,
  surfaceAtPosition,
  type CourseHole,
  type CoursePointYards,
  type CourseSurface,
} from "./discGolfCourse";
import {
  windAcrossThrow01,
  windAlongThrow01,
  type CourseWind,
} from "./discGolfWind";

export type FlightPointYards = CoursePointYards & {
  heightYards: number;
};

export type ThrowResult = {
  landing: CoursePointYards;
  rest: CoursePointYards;
  travelYards: number;
  surfaceAtRest: CourseSurface;
  isInBasket: boolean;
  tookWaterPenalty: boolean;
  hitTree: boolean;
  treePoint: CoursePointYards | null;
  displayPath: FlightPointYards[];
};

export const BASKET_CATCH_MAX_REMAINING_YARDS = 12;
export const TARGET_BASKET_CATCH_MAX_REMAINING_YARDS = 16;
export const FULL_WIND_DEGREES = 90;
const FLIGHT_STEP_YARDS = 1.2;
const SKIP_RATIO = 0.16;
const TURN_DEGREES_PER_RATING_PER_YARD = 0.42;
const FADE_DEGREES_PER_RATING_PER_YARD = 0.48;

export function clampPower(power: number): number {
  return Math.min(1, Math.max(0, power));
}

const THROW_POWER_LINEAR_UNTIL = 0.72;

export function throwPowerFromHold01(hold01: number): number {
  const t = clampPower(hold01);
  if (t <= THROW_POWER_LINEAR_UNTIL) {
    return t;
  }
  const tail01 = (t - THROW_POWER_LINEAR_UNTIL) / (1 - THROW_POWER_LINEAR_UNTIL);
  return (
    THROW_POWER_LINEAR_UNTIL +
    (1 - THROW_POWER_LINEAR_UNTIL) * tail01 * tail01
  );
}

export function throwFromKnobDelta(deltaDegrees: number): {
  power: number;
  hyzer01: number;
} {
  const signed01 = deltaDegrees / FULL_WIND_DEGREES;
  const power = throwPowerFromHold01(Math.abs(signed01));
  if (power < 0.04) {
    return { power: 0, hyzer01: 0 };
  }
  const hyzer01 = Math.max(-1, Math.min(1, signed01));
  return { power, hyzer01 };
}

export function liePowerScale(surface: CourseSurface): number {
  if (surface === "tall-rough") {
    return 0.7;
  }
  if (surface === "rough") {
    return 0.82;
  }
  return 1;
}

export function liePowerLabel(surface: CourseSurface): string {
  if (surface === "tall-rough") {
    return "Under trees · 70% power";
  }
  if (surface === "rough") {
    return "Rough · 82% power";
  }
  if (surface === "tee") {
    return "Tee · full power";
  }
  if (surface === "basket") {
    return "In the basket";
  }
  return "Fairway · full power";
}

export function hyzerLabel(hyzer01: number): string {
  if (hyzer01 < -0.12) {
    return "Hyzer";
  }
  if (hyzer01 > 0.12) {
    return "Anhyzer";
  }
  return "Flat";
}

export function punchOutHeadingDegrees(
  restAtBase: CoursePointYards,
  target: CoursePointYards,
  courseHole: CourseHole,
): number {
  const preferredHeadingDegrees = headingDegreesToBasket(restAtBase, target);
  for (let offsetDegrees = 0; offsetDegrees <= 170; offsetDegrees += 8) {
    const headings =
      offsetDegrees === 0
        ? [preferredHeadingDegrees]
        : [
            preferredHeadingDegrees + offsetDegrees,
            preferredHeadingDegrees - offsetDegrees,
          ];
    for (const headingDegrees of headings) {
      const probe = pointAlongHeading(restAtBase, headingDegrees, 24);
      if (!firstTreeHitOnPath(courseHole, restAtBase, probe)) {
        return headingDegrees;
      }
    }
  }
  return preferredHeadingDegrees;
}

export function playDiscThrow(args: {
  courseHole: CourseHole;
  disc: DiscGolfDisc;
  lie: CoursePointYards;
  lastSafeLie: CoursePointYards;
  headingDegrees: number;
  power: number;
  hyzer01: number;
  courseWind: CourseWind;
}): ThrowResult {
  const flight = simulateDiscFlight({
    ...args,
    ignoreHazards: false,
  });
  return flight;
}

export function previewThrowFlight(args: {
  courseHole: CourseHole;
  disc: DiscGolfDisc;
  lie: CoursePointYards;
  headingDegrees: number;
  power: number;
  hyzer01: number;
  courseWind: CourseWind;
}): FlightPointYards[] {
  return simulateDiscFlight({
    ...args,
    lastSafeLie: args.lie,
    ignoreHazards: true,
  }).displayPath;
}

function simulateDiscFlight(args: {
  courseHole: CourseHole;
  disc: DiscGolfDisc;
  lie: CoursePointYards;
  lastSafeLie: CoursePointYards;
  headingDegrees: number;
  power: number;
  hyzer01: number;
  courseWind: CourseWind;
  ignoreHazards: boolean;
}): ThrowResult {
  const lieSurface = surfaceAtPosition(args.courseHole, args.lie);
  const power = clampPower(args.power) * liePowerScale(lieSurface);
  const hyzer01 = Math.max(-1, Math.min(1, args.hyzer01));
  const hyzerLoss = 1 - Math.abs(hyzer01) * 0.08;
  const flightYards = Math.max(0.4, args.disc.carryYards * power * hyzerLoss);
  const peakHeightYards =
    (flightYards * Math.tan((args.disc.loftDegrees * Math.PI) / 180)) / 3.4;
  const path: FlightPointYards[] = [
    { ...args.lie, heightYards: 0.12 },
  ];

  let xYards = args.lie.xYards;
  let yYards = args.lie.yYards;
  let headingDegrees = args.headingDegrees;
  let remainingYards = flightYards;
  let hasEnteredBasket = false;

  while (remainingYards > 0.15) {
    const speed01 = remainingYards / flightYards;
    const alongWind01 = windAlongThrow01({
      courseWind: args.courseWind,
      throwHeadingDegrees: headingDegrees,
    });
    const acrossWind01 = windAcrossThrow01({
      courseWind: args.courseWind,
      throwHeadingDegrees: headingDegrees,
    });
    const airspeed01 = Math.max(
      0.05,
      Math.min(
        1.25,
        speed01 +
          alongWind01 * (args.courseWind.speedMph / 28) * args.disc.windSensitivity,
      ),
    );
    const anhyzer01 = Math.max(0, hyzer01);
    const hyzerAmount01 = Math.max(0, -hyzer01);
    const turnDegrees =
      -args.disc.turnRating *
      TURN_DEGREES_PER_RATING_PER_YARD *
      airspeed01 *
      (1 + anhyzer01 * 1.15) *
      (1 - hyzerAmount01 * 0.7);
    const fadeDegrees =
      args.disc.fadeRating *
      FADE_DEGREES_PER_RATING_PER_YARD *
      (1 - speed01) *
      (1 + hyzerAmount01 * 1.05) *
      (1 - anhyzer01 * 0.4);
    headingDegrees += turnDegrees - fadeDegrees;

    const stepYards = Math.min(FLIGHT_STEP_YARDS, remainingYards);
    const headingRadians = (headingDegrees * Math.PI) / 180;
    const crossPushYards =
      acrossWind01 *
      (args.courseWind.speedMph / 22) *
      args.disc.windSensitivity *
      stepYards;
    const nextPoint = {
      xYards:
        xYards +
        Math.sin(headingRadians) * stepYards +
        Math.cos(headingRadians) * crossPushYards,
      yYards:
        yYards +
        Math.cos(headingRadians) * stepYards -
        Math.sin(headingRadians) * crossPushYards,
    };

    if (!args.ignoreHazards) {
      const treeHit = firstTreeHitOnPath(args.courseHole, { xYards, yYards }, nextPoint);
      if (treeHit) {
        path.push({ ...treeHit.restAtBase, heightYards: 0.1 });
        return {
          landing: treeHit.restAtBase,
          rest: treeHit.restAtBase,
          travelYards: distanceYards(args.lie, treeHit.restAtBase),
          surfaceAtRest: surfaceAtPosition(args.courseHole, treeHit.restAtBase),
          isInBasket: false,
          tookWaterPenalty: false,
          hitTree: true,
          treePoint: treeHit.treePoint,
          displayPath: path,
        };
      }
    }

    remainingYards -= stepYards * (1 + Math.max(0, -alongWind01) * 0.08);
    xYards = nextPoint.xYards;
    yYards = nextPoint.yYards;
    const flown01 = 1 - remainingYards / flightYards;
    const heightYards = Math.max(
      0.08,
      4 * peakHeightYards * args.disc.glide * 0.22 * flown01 * (1 - flown01),
    );
    const point = { xYards, yYards, heightYards };
    path.push(point);

    const yardsToBasket = distanceYards(point, args.courseHole.basket);
    if (yardsToBasket <= BASKET_CATCH_RADIUS_YARDS && !hasEnteredBasket) {
      hasEnteredBasket = true;
      const catchRemainingYards =
        args.disc.id === "target"
          ? TARGET_BASKET_CATCH_MAX_REMAINING_YARDS
          : BASKET_CATCH_MAX_REMAINING_YARDS;
      if (remainingYards <= catchRemainingYards) {
        path.push({ ...args.courseHole.basket, heightYards: 0.9 });
        return {
          landing: args.courseHole.basket,
          rest: args.courseHole.basket,
          travelYards: distanceYards(args.lie, args.courseHole.basket),
          surfaceAtRest: "basket",
          isInBasket: true,
          tookWaterPenalty: false,
          hitTree: false,
          treePoint: null,
          displayPath: path,
        };
      }
      remainingYards *= 0.45;
    }

    if (path.length > 220) {
      break;
    }
  }

  const landing = { xYards, yYards };
  const landingSurface = surfaceAtPosition(args.courseHole, landing);

  if (!args.ignoreHazards && landingSurface === "water") {
    return {
      landing,
      rest: args.lastSafeLie,
      travelYards: distanceYards(args.lie, landing),
      surfaceAtRest: surfaceAtPosition(args.courseHole, args.lastSafeLie),
      isInBasket: false,
      tookWaterPenalty: true,
      hitTree: false,
      treePoint: null,
      displayPath: [...path, { ...landing, heightYards: 0.04 }],
    };
  }

  const skipYards = flightYards * SKIP_RATIO * (landingSurface === "fairway" || landingSurface === "tee" ? 1 : 0.4);
  const skip = pointAlongHeading(landing, headingDegrees, skipYards);
  if (!args.ignoreHazards) {
    const treeOnSkip = firstTreeHitOnPath(args.courseHole, landing, skip);
    if (treeOnSkip) {
      path.push({ ...treeOnSkip.restAtBase, heightYards: 0.08 });
      return {
        landing,
        rest: treeOnSkip.restAtBase,
        travelYards: distanceYards(args.lie, treeOnSkip.restAtBase),
        surfaceAtRest: surfaceAtPosition(args.courseHole, treeOnSkip.restAtBase),
        isInBasket: false,
        tookWaterPenalty: false,
        hitTree: true,
        treePoint: treeOnSkip.treePoint,
        displayPath: path,
      };
    }
    if (surfaceAtPosition(args.courseHole, skip) === "water") {
      return {
        landing,
        rest: landing,
        travelYards: distanceYards(args.lie, landing),
        surfaceAtRest: landingSurface,
        isInBasket: false,
        tookWaterPenalty: true,
        hitTree: false,
        treePoint: null,
        displayPath: [...path, { ...landing, heightYards: 0.04 }],
      };
    }
  }

  const rest =
    distanceYards(skip, args.courseHole.basket) <= BASKET_CATCH_RADIUS_YARDS
      ? args.courseHole.basket
      : skip;
  const isInBasket =
    distanceYards(rest, args.courseHole.basket) <= BASKET_CATCH_RADIUS_YARDS;
  path.push({ ...rest, heightYards: isInBasket ? 0.9 : 0.08 });

  return {
    landing,
    rest: isInBasket ? args.courseHole.basket : rest,
    travelYards: distanceYards(args.lie, rest),
    surfaceAtRest: isInBasket
      ? "basket"
      : surfaceAtPosition(args.courseHole, rest),
    isInBasket,
    tookWaterPenalty: false,
    hitTree: false,
    treePoint: null,
    displayPath: path,
  };
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
