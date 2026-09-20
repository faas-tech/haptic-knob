import { describe, expect, it } from "vitest";
import {
  DISC_BAG,
  discAfterDetentSteps,
  discAtBagIndex,
  discById,
} from "./discGolfDiscs";
import {
  COURSE_NAME,
  COURSE_PAR,
  courseHoleByNumber,
  distanceYards,
  headingDegreesToBasket,
  surfaceAtPosition,
} from "./discGolfCourse";
import {
  playDiscThrow,
  throwFromKnobDelta,
  throwPowerFromHold01,
} from "./discGolfThrow";
import type { CourseWind } from "./discGolfWind";

const CALM_WIND: CourseWind = { speedMph: 0, blowToHeadingDegrees: 0 };

function openHole() {
  return {
    ...courseHoleByNumber(3),
    treePoints: [],
    waters: [],
  };
}

describe("disc bag", () => {
  it("has long-shot, standard, and target in that order", () => {
    expect(DISC_BAG.map((disc) => disc.id)).toEqual([
      "long-shot",
      "standard",
      "target",
    ]);
    expect(discAtBagIndex(3).id).toBe("long-shot");
    expect(discById("target").carryYards).toBeLessThan(
      discById("standard").carryYards,
    );
    expect(discAfterDetentSteps("standard", 1)).toBe("target");
    expect(discAfterDetentSteps("standard", -1)).toBe("long-shot");
    expect(discAfterDetentSteps("target", 1)).toBe("long-shot");
  });

  it("makes long-shot the most wind-sensitive and the most bendy", () => {
    const longShot = discById("long-shot");
    const standard = discById("standard");
    const target = discById("target");
    expect(longShot.windSensitivity).toBeGreaterThan(standard.windSensitivity);
    expect(standard.windSensitivity).toBeGreaterThan(target.windSensitivity);
    expect(Math.abs(longShot.turnRating) + longShot.fadeRating).toBeGreaterThan(
      Math.abs(standard.turnRating) + standard.fadeRating,
    );
    expect(Math.abs(target.turnRating) + target.fadeRating).toBeLessThan(
      Math.abs(standard.turnRating) + standard.fadeRating,
    );
  });
});

describe("Neon Circuit", () => {
  it("is a par-32 nine with mixed 3s, 4s, and a 5", () => {
    expect(COURSE_NAME).toBe("Neon Circuit");
    expect(COURSE_PAR).toBe(32);
    expect(courseHoleByNumber(1).par).toBe(3);
    expect(courseHoleByNumber(3).par).toBe(4);
    expect(courseHoleByNumber(7).par).toBe(5);
    expect(courseHoleByNumber(8).name).toBe("Island");
  });

  it("keeps the Island pad dry inside the water ring", () => {
    const island = courseHoleByNumber(8);
    expect(surfaceAtPosition(island, island.basket)).toBe("basket");
    expect(
      surfaceAtPosition(island, {
        xYards: island.basket.xYards + 4,
        yYards: island.basket.yYards,
      }),
    ).toBe("fairway");
    expect(
      surfaceAtPosition(island, {
        xYards: island.basket.xYards + 16,
        yYards: island.basket.yYards,
      }),
    ).toBe("water");
  });
});

describe("throwFromKnobDelta", () => {
  it("treats left wind-up as hyzer and right wind-up as anhyzer", () => {
    expect(throwFromKnobDelta(-90).hyzer01).toBeLessThan(0);
    expect(throwFromKnobDelta(90).hyzer01).toBeGreaterThan(0);
    expect(throwFromKnobDelta(-90).power).toBeCloseTo(1, 2);
    expect(throwFromKnobDelta(90).power).toBeCloseTo(1, 2);
    expect(throwFromKnobDelta(2).power).toBe(0);
  });
});

describe("throwPowerFromHold01", () => {
  it("stays linear then eases in through the last quarter", () => {
    expect(throwPowerFromHold01(0.36)).toBeCloseTo(0.36, 5);
    expect(throwPowerFromHold01(0.9)).toBeLessThan(0.9);
    expect(throwPowerFromHold01(1)).toBe(1);
  });
});

describe("playDiscThrow", () => {
  it("sends a full long-shot farther than standard and target", () => {
    const hole = openHole();
    const headingDegrees = headingDegreesToBasket(hole.tee, hole.basket);
    const longShot = playDiscThrow({
      courseHole: hole,
      disc: discById("long-shot"),
      lie: hole.tee,
      lastSafeLie: hole.tee,
      headingDegrees,
      power: 1,
      hyzer01: 0,
      courseWind: CALM_WIND,
    });
    const standard = playDiscThrow({
      courseHole: hole,
      disc: discById("standard"),
      lie: hole.tee,
      lastSafeLie: hole.tee,
      headingDegrees,
      power: 1,
      hyzer01: 0,
      courseWind: CALM_WIND,
    });
    const target = playDiscThrow({
      courseHole: hole,
      disc: discById("target"),
      lie: hole.tee,
      lastSafeLie: hole.tee,
      headingDegrees,
      power: 1,
      hyzer01: 0,
      courseWind: CALM_WIND,
    });
    expect(longShot.travelYards).toBeGreaterThan(standard.travelYards + 20);
    expect(standard.travelYards).toBeGreaterThan(target.travelYards + 14);
    expect(longShot.travelYards).toBeGreaterThan(95);
    expect(target.travelYards).toBeLessThan(55);
  });

  it("curves a long-shot more than a target on a flat throw", () => {
    const hole = openHole();
    const headingDegrees = 0;
    const start = { xYards: 100, yYards: 20 };
    const longShot = playDiscThrow({
      courseHole: hole,
      disc: discById("long-shot"),
      lie: start,
      lastSafeLie: start,
      headingDegrees,
      power: 1,
      hyzer01: 0,
      courseWind: CALM_WIND,
    });
    const target = playDiscThrow({
      courseHole: hole,
      disc: discById("target"),
      lie: start,
      lastSafeLie: start,
      headingDegrees,
      power: 1,
      hyzer01: 0,
      courseWind: CALM_WIND,
    });
    const longShotBendYards = Math.abs(longShot.rest.xYards - start.xYards);
    const targetBendYards = Math.abs(target.rest.xYards - start.xYards);
    expect(longShotBendYards).toBeGreaterThan(targetBendYards + 4);
  });

  it("sends a hyzer left of a flat throw and an anhyzer right of it", () => {
    const hole = openHole();
    const start = { xYards: 100, yYards: 20 };
    const headingDegrees = 0;
    const flat = playDiscThrow({
      courseHole: hole,
      disc: discById("long-shot"),
      lie: start,
      lastSafeLie: start,
      headingDegrees,
      power: 1,
      hyzer01: 0,
      courseWind: CALM_WIND,
    });
    const hyzer = playDiscThrow({
      courseHole: hole,
      disc: discById("long-shot"),
      lie: start,
      lastSafeLie: start,
      headingDegrees,
      power: 1,
      hyzer01: -0.85,
      courseWind: CALM_WIND,
    });
    const anhyzer = playDiscThrow({
      courseHole: hole,
      disc: discById("long-shot"),
      lie: start,
      lastSafeLie: start,
      headingDegrees,
      power: 1,
      hyzer01: 0.85,
      courseWind: CALM_WIND,
    });
    expect(hyzer.rest.xYards).toBeLessThan(flat.rest.xYards - 6);
    expect(anhyzer.rest.xYards).toBeGreaterThan(flat.rest.xYards + 6);
  });

  it("lets a headwind shove a long-shot more than a target", () => {
    const hole = openHole();
    const start = { xYards: 100, yYards: 20 };
    const headingDegrees = 0;
    const headwind: CourseWind = { speedMph: 16, blowToHeadingDegrees: 180 };
    const longShotCalm = playDiscThrow({
      courseHole: hole,
      disc: discById("long-shot"),
      lie: start,
      lastSafeLie: start,
      headingDegrees,
      power: 1,
      hyzer01: 0,
      courseWind: CALM_WIND,
    });
    const longShotWind = playDiscThrow({
      courseHole: hole,
      disc: discById("long-shot"),
      lie: start,
      lastSafeLie: start,
      headingDegrees,
      power: 1,
      hyzer01: 0,
      courseWind: headwind,
    });
    const targetCalm = playDiscThrow({
      courseHole: hole,
      disc: discById("target"),
      lie: start,
      lastSafeLie: start,
      headingDegrees,
      power: 1,
      hyzer01: 0,
      courseWind: CALM_WIND,
    });
    const targetWind = playDiscThrow({
      courseHole: hole,
      disc: discById("target"),
      lie: start,
      lastSafeLie: start,
      headingDegrees,
      power: 1,
      hyzer01: 0,
      courseWind: headwind,
    });
    const longShotLoss = longShotCalm.travelYards - longShotWind.travelYards;
    const targetLoss = targetCalm.travelYards - targetWind.travelYards;
    expect(longShotLoss).toBeGreaterThan(targetLoss + 4);
  });

  it("keeps a Target throw in the chain band as it reaches the basket", () => {
    const hole = openHole();
    const lie = {
      xYards: hole.basket.xYards,
      yYards: hole.basket.yYards - 12,
    };
    const shot = playDiscThrow({
      courseHole: hole,
      disc: discById("target"),
      lie,
      lastSafeLie: lie,
      headingDegrees: headingDegreesToBasket(lie, hole.basket),
      power: 0.34,
      hyzer01: 0,
      courseWind: CALM_WIND,
    });
    const nearBasket = shot.displayPath.find(
      (point) => distanceYards(point, hole.basket) < 3.2,
    );
    expect(nearBasket).toBeTruthy();
    expect(nearBasket?.heightYards).toBeGreaterThan(2.2);
    expect(shot.isInBasket).toBe(true);
  });

  it("catches a disc that flies through the chains a little offline", () => {
    const hole = openHole();
    const lie = {
      xYards: hole.basket.xYards - 1.6,
      yYards: hole.basket.yYards - 14,
    };
    const shot = playDiscThrow({
      courseHole: hole,
      disc: discById("target"),
      lie,
      lastSafeLie: lie,
      headingDegrees: 0,
      power: 0.4,
      hyzer01: 0,
      courseWind: CALM_WIND,
    });
    expect(shot.isInBasket).toBe(true);
  });

  it("misses a throw that stays wide of the chains", () => {
    const hole = openHole();
    const lie = {
      xYards: hole.basket.xYards - 6,
      yYards: hole.basket.yYards - 16,
    };
    const shot = playDiscThrow({
      courseHole: hole,
      disc: discById("target"),
      lie,
      lastSafeLie: lie,
      headingDegrees: 0,
      power: 0.45,
      hyzer01: 0,
      courseWind: CALM_WIND,
    });
    expect(shot.isInBasket).toBe(false);
  });

  it("catches a slow Target in the basket and stops the path there", () => {
    const hole = openHole();
    const lie = {
      xYards: hole.basket.xYards,
      yYards: hole.basket.yYards - 12,
    };
    const shot = playDiscThrow({
      courseHole: hole,
      disc: discById("target"),
      lie,
      lastSafeLie: lie,
      headingDegrees: headingDegreesToBasket(lie, hole.basket),
      power: 0.34,
      hyzer01: 0,
      courseWind: CALM_WIND,
    });
    expect(shot.isInBasket).toBe(true);
    expect(distanceYards(shot.rest, hole.basket)).toBeLessThan(0.2);
    const last = shot.displayPath[shot.displayPath.length - 1];
    expect(distanceYards(last, hole.basket)).toBeLessThan(0.3);
  });

  it("drops the disc at a tree base", () => {
    const hole = {
      ...openHole(),
      treePoints: [{ xYards: 100, yYards: 36 }],
    };
    const lie = { xYards: 100, yYards: 20 };
    const shot = playDiscThrow({
      courseHole: hole,
      disc: discById("target"),
      lie,
      lastSafeLie: lie,
      headingDegrees: 0,
      power: 1,
      hyzer01: 0,
      courseWind: CALM_WIND,
    });
    expect(shot.hitTree).toBe(true);
    expect(distanceYards(shot.rest, hole.treePoints[0])).toBeLessThan(4);
  });
});
