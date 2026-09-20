import { describe, expect, it } from "vitest";
import {
  PUTTER,
  SWING_CLUBS,
  swingClubAfterDetentSteps,
  swingClubAfterLeftDetentSteps,
  swingClubAtDetentIndex,
} from "./golfClubs";
import {
  COURSE_NAME,
  COURSE_PAR,
  courseHoleByNumber,
  distanceYards,
  headingDegreesToCup,
  startingAimHeadingDegrees,
  surfaceAtPosition,
  TREE_CANOPY_RADIUS_YARDS,
  TREE_TRUNK_RADIUS_YARDS,
  type CourseHole,
} from "./golfCourse";
import {
  liePowerScale,
  playGolfShot,
  aimFlightArcPoints,
  previewGolfShotPath,
  punchOutHeadingDegrees,
  puttPowerFromHold01,
  shotLateralYards,
  shotShapeLabel,
  swingFromKnobDelta,
  swingPowerFromHold01,
} from "./golfShot";
import type { CourseWind } from "./golfWind";

const CALM_WIND: CourseWind = { speedMph: 0, blowToHeadingDegrees: 0 };

describe("swingClubAtDetentIndex", () => {
  it("maps five detents onto the five swing clubs", () => {
    expect(swingClubAtDetentIndex(0).id).toBe("pitching-wedge");
    expect(swingClubAtDetentIndex(4).id).toBe("driver");
    expect(swingClubAtDetentIndex(5).id).toBe("pitching-wedge");
  });

  it("walks the bag both ways from a dedicated club detent", () => {
    expect(swingClubAfterDetentSteps("five-iron", 1)).toBe("hybrid");
    expect(swingClubAfterDetentSteps("five-iron", -1)).toBe("eight-iron");
    expect(swingClubAfterDetentSteps("pitching-wedge", -1)).toBe("driver");
  });

  it("keeps rotating through the bag as left detents continue", () => {
    expect(swingClubAfterLeftDetentSteps("five-iron", 0)).toBe("five-iron");
    expect(swingClubAfterLeftDetentSteps("five-iron", 1)).toBe("hybrid");
    expect(swingClubAfterLeftDetentSteps("five-iron", 3)).toBe("pitching-wedge");
    expect(swingClubAfterLeftDetentSteps("driver", 1)).toBe("pitching-wedge");
    expect(swingClubAfterLeftDetentSteps("pitching-wedge", 9)).toBe("driver");
    expect(swingClubAfterLeftDetentSteps("pitching-wedge", 10)).toBe(
      "pitching-wedge",
    );
  });
});

describe("Engineer Alley", () => {
  it("aims every shot at the pin", () => {
    const cam = courseHoleByNumber(3);
    const teeHeading = startingAimHeadingDegrees(cam, cam.tee);
    const pinHeading = headingDegreesToCup(cam.tee, cam.cup);
    expect(teeHeading).toBeCloseTo(pinHeading, 5);
    const fromFairway = startingAimHeadingDegrees(cam, {
      xYards: 76,
      yYards: 186,
    });
    expect(fromFairway).toBeCloseTo(
      headingDegreesToCup({ xYards: 76, yYards: 186 }, cam.cup),
      5,
    );
  });

  it("is a par-36 nine with mixed 3s, 4s, and 5s", () => {
    expect(COURSE_NAME).toBe("Engineer Alley");
    expect(COURSE_PAR).toBe(36);
    expect(courseHoleByNumber(1).par).toBe(4);
    expect(courseHoleByNumber(2).par).toBe(3);
    expect(courseHoleByNumber(4).par).toBe(5);
    expect(courseHoleByNumber(6).par).toBe(3);
    expect(courseHoleByNumber(8).par).toBe(5);
    expect(courseHoleByNumber(9).par).toBe(4);
  });

  it("bends Cam around a bunker in the elbow", () => {
    const cam = courseHoleByNumber(3);
    expect(cam.fairwayWaypoints.length).toBeGreaterThan(2);
    expect(surfaceAtPosition(cam, cam.fairwayWaypoints[1])).toBe("fairway");
    expect(surfaceAtPosition(cam, cam.sands[0].center)).toBe("sand");
    expect(
      cam.treePoints.some(
        (treePoint) => distanceYards(treePoint, cam.sands[0].center) < 28,
      ),
    ).toBe(true);
  });

  it("backs Spline pinch bunkers with trees and leaves Gauge open", () => {
    const spline = courseHoleByNumber(5);
    const gauge = courseHoleByNumber(2);
    expect(gauge.treePoints.length).toBeLessThan(10);
    expect(
      spline.treePoints.some(
        (treePoint) => distanceYards(treePoint, spline.sands[0].center) < 28,
      ),
    ).toBe(true);
    expect(
      spline.treePoints.some(
        (treePoint) => distanceYards(treePoint, spline.sands[1].center) < 28,
      ),
    ).toBe(true);
  });
});

describe("playGolfShot", () => {
  const gaugeHole = courseHoleByNumber(2);
  const wedge = SWING_CLUBS[0];

  it("sends a full pitching wedge about 100 yards down the hole", () => {
    const shot = playGolfShot({
      courseHole: gaugeHole,
      ball: gaugeHole.tee,
      lastSafeLie: gaugeHole.tee,
      club: wedge,
      headingDegrees: headingDegreesToCup(gaugeHole.tee, gaugeHole.cup),
      power: 1,
      courseWind: CALM_WIND,
    });
    expect(shot.travelYards).toBeGreaterThan(105);
    expect(shot.travelYards).toBeLessThan(120);
    expect(shot.tookWaterPenalty).toBe(false);
  });

  it("drops back to the last safe lie after a water landing", () => {
    const spanHole = courseHoleByNumber(4);
    const driver = SWING_CLUBS[4];
    const lake = spanHole.waters[0];
    const yardsToWater = distanceYards(spanHole.tee, lake.center);
    const shot = playGolfShot({
      courseHole: spanHole,
      ball: spanHole.tee,
      lastSafeLie: spanHole.tee,
      club: driver,
      headingDegrees: headingDegreesToCup(spanHole.tee, lake.center),
      power: yardsToWater / driver.carryYards,
      courseWind: CALM_WIND,
    });
    expect(shot.tookWaterPenalty).toBe(true);
    expect(shot.rest).toEqual(spanHole.tee);
  });

  it("holes a short putt aimed at the cup", () => {
    const shot = puttOnFlatGreen(4, 4, 0);
    expect(shot.isInCup).toBe(true);
  });

  it("holes an on-line putt that would stop up to about seven feet past", () => {
    const shot = puttOnFlatGreen(4, 4 + 2, 0);
    expect(shot.isInCup).toBe(true);
  });

  it("holes an on-line putt that is a bit long", () => {
    expect(puttOnFlatGreen(8, 8 + 5, 0).isInCup).toBe(true);
  });

  it("holes a dying putt that is a little offline", () => {
    expect(puttOnFlatGreen(4, 4.2, 8).isInCup).toBe(true);
  });

  it("holes a putt that dies in the cup well", () => {
    expect(puttOnFlatGreen(4, 3.45, 0).isInCup).toBe(true);
  });

  it("stops a holed putt at the cup instead of rolling past", () => {
    const hole = flatPuttHole();
    const shot = puttOnFlatGreen(4, 6, 0);
    expect(shot.isInCup).toBe(true);
    expect(shot.displayPath.at(-1)).toEqual(hole.cup);
    const farthestPastYards = Math.max(
      ...shot.displayPath.map((point) => point.yYards),
    );
    expect(farthestPastYards).toBeLessThan(hole.cup.yYards + 1.2);
  });

  it("lips out a rocket and keeps only a short leftover run", () => {
    const hole = flatPuttHole();
    const shot = puttOnFlatGreen(4, 4 + 16, 0);
    expect(shot.isInCup).toBe(false);
    expect(shot.rest.xYards).toBeCloseTo(hole.cup.xYards, 1);
    expect(shot.rest.yYards).toBeGreaterThan(hole.cup.yYards + 2);
    expect(shot.rest.yYards).toBeLessThan(hole.cup.yYards + 10);
  });

  it("leaves a putt that never reaches the cup well short", () => {
    const hole = flatPuttHole();
    const shot = puttOnFlatGreen(4, 2.2, 0);
    expect(shot.isInCup).toBe(false);
    expect(shot.rest.yYards).toBeLessThan(hole.cup.yYards - 1.1);
  });

  it("does not hole a putt that misses the cup wide", () => {
    const hole = flatPuttHole();
    const shot = puttOnFlatGreen(4, 5, 36);
    expect(shot.isInCup).toBe(false);
    expect(distanceYards(shot.rest, hole.cup)).toBeGreaterThan(1.6);
  });

  it("breaks a north putt west on an east-rising green", () => {
    const hole = flatPuttHole({
      greenTiltRisePerYard: { xRisePerYard: 0.03, yRisePerYard: 0 },
    });
    const ball = { xYards: hole.cup.xYards, yYards: hole.cup.yYards - 12 };
    const shot = playGolfShot({
      courseHole: hole,
      ball,
      lastSafeLie: ball,
      club: PUTTER,
      headingDegrees: 0,
      power: 8 / PUTTER.puttYards,
      courseWind: CALM_WIND,
    });
    expect(shot.isInCup).toBe(false);
    expect(shot.rest.xYards).toBeLessThan(ball.xYards - 0.45);
    expect(shot.rest.xYards).toBeGreaterThan(ball.xYards - 2.4);
  });

  it("pushes a full wedge east when the wind blows east", () => {
    const shot = playGolfShot({
      courseHole: gaugeHole,
      ball: gaugeHole.tee,
      lastSafeLie: gaugeHole.tee,
      club: wedge,
      headingDegrees: headingDegreesToCup(gaugeHole.tee, gaugeHole.cup),
      power: 1,
      courseWind: { speedMph: 16, blowToHeadingDegrees: 90 },
    });
    expect(shot.landing.xYards).toBeGreaterThan(gaugeHole.tee.xYards + 4);
  });
});

describe("aimFlightArcPoints", () => {
  it("raises a wedge higher than a driver for the same carry", () => {
    const wedge = aimFlightArcPoints({
      loftDegrees: 46,
      carryYards: 100,
      pointCount: 9,
    });
    const driver = aimFlightArcPoints({
      loftDegrees: 10,
      carryYards: 100,
      pointCount: 9,
    });
    expect(wedge[0]).toEqual({ alongYards: 0, heightYards: 0 });
    expect(wedge[8].alongYards).toBeCloseTo(100, 5);
    expect(wedge[8].heightYards).toBeCloseTo(0, 5);
    expect(wedge[4].heightYards).toBeGreaterThan(driver[4].heightYards);
  });
});

describe("swingFromKnobDelta", () => {
  it("maps a right wind to fade and a left wind to draw", () => {
    const fade = swingFromKnobDelta(90);
    expect(fade.power).toBeCloseTo(1, 5);
    expect(fade.shape01).toBeCloseTo(1, 5);
    expect(shotShapeLabel(fade.shape01)).toBe("Fade");
    const draw = swingFromKnobDelta(-45);
    expect(draw.power).toBeGreaterThan(0.4);
    expect(draw.shape01).toBeLessThan(-0.4);
    expect(shotShapeLabel(draw.shape01)).toBe("Draw");
    expect(swingFromKnobDelta(3).power).toBe(0);
  });
});

describe("shotLateralYards", () => {
  it("starts on the aim line and bends like a spin banana", () => {
    expect(shotLateralYards({ progress01: 0, shape01: 1, carryYards: 100 })).toBeCloseTo(0, 5);
    expect(
      shotLateralYards({ progress01: 0.5, shape01: 1, carryYards: 100 }),
    ).toBeCloseTo(6, 5);
    expect(shotLateralYards({ progress01: 1, shape01: 1, carryYards: 100 })).toBeCloseTo(12, 5);
    expect(
      shotLateralYards({ progress01: 0.25, shape01: 1, carryYards: 100 }),
    ).toBeLessThan(
      shotLateralYards({ progress01: 0.5, shape01: 1, carryYards: 100 }),
    );
    expect(
      shotLateralYards({ progress01: 0.5, shape01: -1, carryYards: 100 }),
    ).toBeCloseTo(-6, 5);
  });
});

describe("shot shape", () => {
  it("curves a fade right in a smooth arc that starts on the aim line", () => {
    const hole = treeTestHole([]);
    const shot = playGolfShot({
      courseHole: hole,
      ball: hole.tee,
      lastSafeLie: hole.tee,
      club: SWING_CLUBS[0],
      headingDegrees: 0,
      power: 1,
      courseWind: CALM_WIND,
      shape01: 1,
    });
    const laterals = shot.displayPath.map(
      (point) => point.xYards - hole.tee.xYards,
    );
    expect(laterals[1]).toBeGreaterThanOrEqual(-0.2);
    expect(laterals[1]).toBeLessThan(1.2);
    expect(laterals[laterals.length - 1]).toBeGreaterThan(6);
    for (let index = 1; index < laterals.length; index += 1) {
      expect(laterals[index]).toBeGreaterThanOrEqual(laterals[index - 1] - 0.05);
    }
    for (let index = 2; index < laterals.length - 1; index += 1) {
      const incoming = laterals[index] - laterals[index - 1];
      const outgoing = laterals[index + 1] - laterals[index];
      expect(Math.abs(outgoing - incoming)).toBeLessThan(0.35);
    }
  });

  it("curves a draw left in a smooth arc that starts on the aim line", () => {
    const hole = treeTestHole([]);
    const shot = playGolfShot({
      courseHole: hole,
      ball: hole.tee,
      lastSafeLie: hole.tee,
      club: SWING_CLUBS[0],
      headingDegrees: 0,
      power: 1,
      courseWind: CALM_WIND,
      shape01: -1,
    });
    const laterals = shot.displayPath.map(
      (point) => point.xYards - hole.tee.xYards,
    );
    expect(laterals[1]).toBeLessThanOrEqual(0.2);
    expect(laterals[laterals.length - 1]).toBeLessThan(-6);
    for (let index = 1; index < laterals.length; index += 1) {
      expect(laterals[index]).toBeLessThanOrEqual(laterals[index - 1] + 0.05);
    }
  });

  it("previews fade as a lofted banana, not a polyline", () => {
    const path = previewGolfShotPath({
      ball: { xYards: 0, yYards: 0 },
      headingDegrees: 0,
      loftDegrees: 46,
      carryYards: 100,
      shape01: 1,
      pointCount: 33,
    });
    expect(path[0]).toMatchObject({ xYards: 0, yYards: 0, heightYards: 0 });
    expect(path[16].heightYards).toBeGreaterThan(8);
    expect(path[16].xYards).toBeGreaterThan(2);
    expect(path[32].xYards).toBeCloseTo(12, 5);
    expect(path[32].heightYards).toBeCloseTo(0, 5);
  });
});

describe("puttPowerFromHold01", () => {
  it("maps spring wind near linearly so a half stroke travels about half the putt", () => {
    expect(puttPowerFromHold01(0)).toBe(0);
    expect(puttPowerFromHold01(0.2)).toBeCloseTo(0.162, 2);
    expect(puttPowerFromHold01(0.5)).toBeGreaterThan(0.42);
    expect(puttPowerFromHold01(0.5)).toBeLessThan(0.52);
    expect(puttPowerFromHold01(0.2)).toBeLessThan(swingPowerFromHold01(0.2));
    expect(puttPowerFromHold01(1)).toBe(1);
  });
});

describe("swingPowerFromHold01", () => {
  it("fills linearly through most of the hold, then faster near full", () => {
    expect(swingPowerFromHold01(0)).toBe(0);
    expect(swingPowerFromHold01(0.36)).toBeCloseTo(0.36, 5);
    expect(swingPowerFromHold01(0.72)).toBeCloseTo(0.72, 5);
    expect(swingPowerFromHold01(0.86)).toBeLessThan(0.86);
    expect(swingPowerFromHold01(0.86)).toBeGreaterThan(0.72);
    expect(swingPowerFromHold01(1)).toBe(1);
    expect(swingPowerFromHold01(0.95) - swingPowerFromHold01(0.9)).toBeGreaterThan(
      swingPowerFromHold01(0.4) - swingPowerFromHold01(0.35),
    );
  });
});

describe("liePowerScale", () => {
  it("keeps tee and fairway at full power and discounts rough, tall rough, and sand", () => {
    expect(liePowerScale("tee")).toBe(1);
    expect(liePowerScale("fairway")).toBe(1);
    expect(liePowerScale("rough")).toBe(0.8);
    expect(liePowerScale("tall-rough")).toBe(0.7);
    expect(liePowerScale("sand")).toBe(0.5);
  });

  it("cuts a sand shot to half the carry of the same swing off the tee", () => {
    const sandHole = treeTestHole([]);
    const wedge = SWING_CLUBS[0];
    const teeShot = playGolfShot({
      courseHole: sandHole,
      ball: sandHole.tee,
      lastSafeLie: sandHole.tee,
      club: wedge,
      headingDegrees: 0,
      power: 1,
      courseWind: CALM_WIND,
    });
    const inSand = { xYards: 110, yYards: 40 };
    const sandOnlyHole: CourseHole = {
      ...sandHole,
      sands: [{ center: inSand, radiusYards: 8 }],
    };
    expect(surfaceAtPosition(sandOnlyHole, inSand)).toBe("sand");
    const sandShot = playGolfShot({
      courseHole: sandOnlyHole,
      ball: inSand,
      lastSafeLie: inSand,
      club: wedge,
      headingDegrees: 0,
      power: 1,
      courseWind: CALM_WIND,
    });
    expect(sandShot.travelYards).toBeGreaterThan(teeShot.travelYards * 0.4);
    expect(sandShot.travelYards).toBeLessThan(teeShot.travelYards * 0.55);
  });
});

describe("tree collision", () => {
  const treePoint = { xYards: 110, yYards: 90 };
  const hole = treeTestHole([treePoint]);
  const wedge = SWING_CLUBS[0];

  it("stops the ball at the trunk base and leaves it in tall rough", () => {
    const shot = playGolfShot({
      courseHole: hole,
      ball: hole.tee,
      lastSafeLie: hole.tee,
      club: wedge,
      headingDegrees: 0,
      power: 1,
      courseWind: CALM_WIND,
    });
    expect(shot.hitTree).toBe(true);
    expect(shot.treePoint).toEqual(treePoint);
    expect(distanceYards(shot.rest, treePoint)).toBeCloseTo(
      TREE_TRUNK_RADIUS_YARDS + 0.9,
      5,
    );
    expect(shot.rest.yYards).toBeLessThan(treePoint.yYards);
    expect(surfaceAtPosition(hole, shot.rest)).toBe("tall-rough");
  });

  it("lets a punch-out leave the tree when the heading misses the trunk", () => {
    const atBase = { xYards: 110, yYards: 90 - TREE_TRUNK_RADIUS_YARDS - 0.9 };
    expect(surfaceAtPosition(hole, atBase)).toBe("tall-rough");
    const headingDegrees = punchOutHeadingDegrees(atBase, hole.cup, hole);
    const punch = playGolfShot({
      courseHole: hole,
      ball: atBase,
      lastSafeLie: atBase,
      club: wedge,
      headingDegrees,
      power: 0.45,
      courseWind: CALM_WIND,
    });
    expect(punch.hitTree).toBe(false);
    expect(distanceYards(punch.rest, treePoint)).toBeGreaterThan(
      TREE_CANOPY_RADIUS_YARDS,
    );
  });

  it("hits the same tree again if the next shot is aimed through it", () => {
    const atBase = { xYards: 110, yYards: 90 - TREE_TRUNK_RADIUS_YARDS - 0.9 };
    const punch = playGolfShot({
      courseHole: hole,
      ball: atBase,
      lastSafeLie: atBase,
      club: wedge,
      headingDegrees: 0,
      power: 0.4,
      courseWind: CALM_WIND,
    });
    expect(punch.hitTree).toBe(true);
    expect(punch.treePoint).toEqual(treePoint);
  });
});

function flatPuttHole(
  overrides: Partial<CourseHole> = {},
): CourseHole {
  return {
    holeNumber: 1,
    par: 3,
    name: "Putt test",
    tee: { xYards: 80, yYards: 40 },
    cup: { xYards: 80, yYards: 80 },
    greenRadiusYards: 18,
    fairwayHalfWidthYards: 16,
    fairwayWaypoints: [],
    waters: [],
    sands: [],
    treePoints: [],
    greenUndulationScale: 0,
    ...overrides,
  };
}

function puttOnFlatGreen(
  pinYards: number,
  travelYards: number,
  headingDegrees: number,
) {
  const hole = flatPuttHole();
  const ball = {
    xYards: hole.cup.xYards,
    yYards: hole.cup.yYards - pinYards,
  };
  expect(surfaceAtPosition(hole, ball)).toBe("green");
  return playGolfShot({
    courseHole: hole,
    ball,
    lastSafeLie: ball,
    club: PUTTER,
    headingDegrees,
    power: travelYards / PUTTER.puttYards,
    courseWind: CALM_WIND,
  });
}

function treeTestHole(treePoints: CourseHole["treePoints"]): CourseHole {
  return {
    holeNumber: 1,
    par: 4,
    name: "Tree test",
    tee: { xYards: 110, yYards: 20 },
    cup: { xYards: 110, yYards: 300 },
    greenRadiusYards: 14,
    fairwayHalfWidthYards: 18,
    fairwayWaypoints: [],
    waters: [],
    sands: [],
    treePoints,
  };
}
