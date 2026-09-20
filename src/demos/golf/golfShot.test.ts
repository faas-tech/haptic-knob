import { describe, expect, it } from "vitest";
import { PUTTER, SWING_CLUBS, swingClubAtDetentIndex } from "./golfClubs";
import {
  COURSE_NAME,
  COURSE_PAR,
  courseHoleByNumber,
  distanceYards,
  headingDegreesToCup,
  surfaceAtPosition,
  TREE_CANOPY_RADIUS_YARDS,
  TREE_TRUNK_RADIUS_YARDS,
  type CourseHole,
} from "./golfCourse";
import {
  liePowerScale,
  playGolfShot,
  aimFlightArcPoints,
  punchOutHeadingDegrees,
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
});

describe("Engineer Alley", () => {
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

  it("halves leftover run when an on-line putt would go well past the cup", () => {
    const hole = flatPuttHole();
    const shot = puttOnFlatGreen(4, 4 + 6, 0);
    expect(shot.isInCup).toBe(false);
    expect(shot.rest.xYards).toBeCloseTo(hole.cup.xYards, 1);
    expect(shot.rest.yYards).toBeGreaterThan(hole.cup.yYards + 2);
    expect(shot.rest.yYards).toBeLessThan(hole.cup.yYards + 4);
  });

  it("leaves a short putt short of the cup", () => {
    const hole = flatPuttHole();
    const shot = puttOnFlatGreen(4, 2.6, 0);
    expect(shot.isInCup).toBe(false);
    expect(shot.rest.yYards).toBeLessThan(hole.cup.yYards - 0.6);
  });

  it("does not hole a putt that misses the cup wide", () => {
    const hole = flatPuttHole();
    const shot = puttOnFlatGreen(4, 5, 22);
    expect(shot.isInCup).toBe(false);
    expect(distanceYards(shot.rest, hole.cup)).toBeGreaterThan(1.3);
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
    expect(shot.rest.xYards).toBeLessThan(ball.xYards - 0.9);
    expect(shot.rest.xYards).toBeGreaterThan(ball.xYards - 2.8);
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
