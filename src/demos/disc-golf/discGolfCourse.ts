export type CoursePointYards = {
  xYards: number;
  yYards: number;
};

export type CourseSurface =
  | "tee"
  | "fairway"
  | "rough"
  | "tall-rough"
  | "water"
  | "basket";

export type CourseCircle = {
  center: CoursePointYards;
  radiusYards: number;
};

export type CourseHole = {
  holeNumber: number;
  par: 3 | 4 | 5;
  name: string;
  brief: string;
  tee: CoursePointYards;
  basket: CoursePointYards;
  basketPadRadiusYards: number;
  fairwayHalfWidthYards: number;
  fairwayWaypoints: CoursePointYards[];
  waters: CourseCircle[];
  treePoints: CoursePointYards[];
};

export const BASKET_CATCH_RADIUS_YARDS = 1.55;
export const COURSE_WORLD_WIDTH_YARDS = 200;
export const COURSE_WORLD_DEPTH_YARDS = 280;
export const COURSE_NAME = "Neon Circuit";
export const TREE_TRUNK_RADIUS_YARDS = 2;
export const TREE_CANOPY_RADIUS_YARDS = 5.4;

export const NINE_HOLE_COURSE: CourseHole[] = [
  completeHole(
    {
      holeNumber: 1,
      par: 3,
      name: "Spark",
      brief: "Straight pad. Target or Standard.",
      tee: { xYards: 100, yYards: 18 },
      fairwayWaypoints: [{ xYards: 100, yYards: 48 }],
      basket: { xYards: 100, yYards: 86 },
      basketPadRadiusYards: 9,
      fairwayHalfWidthYards: 16,
      waters: [],
    },
    [
      { center: { xYards: 68, yYards: 56 }, count: 3, spreadYards: 8 },
      { center: { xYards: 132, yYards: 58 }, count: 3, spreadYards: 8 },
    ],
  ),
  completeHole(
    {
      holeNumber: 2,
      par: 3,
      name: "Hyzer Gate",
      brief: "Dogleg left. Wind left and let it fade.",
      tee: { xYards: 148, yYards: 18 },
      fairwayWaypoints: [
        { xYards: 132, yYards: 52 },
        { xYards: 96, yYards: 78 },
      ],
      basket: { xYards: 68, yYards: 104 },
      basketPadRadiusYards: 8,
      fairwayHalfWidthYards: 12,
      waters: [],
    },
    [
      { center: { xYards: 168, yYards: 62 }, count: 5, spreadYards: 10 },
      { center: { xYards: 118, yYards: 96 }, count: 4, spreadYards: 8 },
    ],
  ),
  completeHole(
    {
      holeNumber: 3,
      par: 4,
      name: "Voltage",
      brief: "Open bomb. Long-shot if the wind is kind.",
      tee: { xYards: 100, yYards: 16 },
      fairwayWaypoints: [
        { xYards: 102, yYards: 72 },
        { xYards: 100, yYards: 128 },
      ],
      basket: { xYards: 98, yYards: 176 },
      basketPadRadiusYards: 10,
      fairwayHalfWidthYards: 20,
      waters: [],
    },
    [
      { center: { xYards: 54, yYards: 90 }, count: 3, spreadYards: 8 },
      { center: { xYards: 148, yYards: 96 }, count: 3, spreadYards: 8 },
      { center: { xYards: 70, yYards: 188 }, count: 3, spreadYards: 7 },
    ],
  ),
  completeHole(
    {
      holeNumber: 4,
      par: 3,
      name: "Flip",
      brief: "Bend right. Wind right and hold anhyzer.",
      tee: { xYards: 48, yYards: 18 },
      fairwayWaypoints: [
        { xYards: 68, yYards: 50 },
        { xYards: 108, yYards: 74 },
      ],
      basket: { xYards: 148, yYards: 102 },
      basketPadRadiusYards: 8,
      fairwayHalfWidthYards: 12,
      waters: [],
    },
    [
      { center: { xYards: 36, yYards: 64 }, count: 5, spreadYards: 10 },
      { center: { xYards: 88, yYards: 96 }, count: 4, spreadYards: 8 },
    ],
  ),
  completeHole(
    {
      holeNumber: 5,
      par: 4,
      name: "Current",
      brief: "Water left. Stay on the right rail.",
      tee: { xYards: 72, yYards: 16 },
      fairwayWaypoints: [
        { xYards: 88, yYards: 70 },
        { xYards: 116, yYards: 118 },
      ],
      basket: { xYards: 136, yYards: 168 },
      basketPadRadiusYards: 9,
      fairwayHalfWidthYards: 14,
      waters: [{ center: { xYards: 58, yYards: 96 }, radiusYards: 22 }],
    },
    [
      { center: { xYards: 154, yYards: 88 }, count: 4, spreadYards: 9 },
      { center: { xYards: 168, yYards: 172 }, count: 3, spreadYards: 7 },
    ],
  ),
  completeHole(
    {
      holeNumber: 6,
      par: 3,
      name: "Tunnel",
      brief: "Tight woods. Target only.",
      tee: { xYards: 100, yYards: 18 },
      fairwayWaypoints: [{ xYards: 100, yYards: 44 }],
      basket: { xYards: 100, yYards: 78 },
      basketPadRadiusYards: 7,
      fairwayHalfWidthYards: 8,
      waters: [],
    },
    [
      { center: { xYards: 78, yYards: 46 }, count: 5, spreadYards: 7 },
      { center: { xYards: 122, yYards: 48 }, count: 5, spreadYards: 7 },
      { center: { xYards: 76, yYards: 72 }, count: 3, spreadYards: 6 },
      { center: { xYards: 124, yYards: 74 }, count: 3, spreadYards: 6 },
    ],
  ),
  completeHole(
    {
      holeNumber: 7,
      par: 5,
      name: "Long Grid",
      brief: "S-curve. Two shapes, then a Target.",
      tee: { xYards: 42, yYards: 16 },
      fairwayWaypoints: [
        { xYards: 70, yYards: 70 },
        { xYards: 128, yYards: 118 },
        { xYards: 108, yYards: 168 },
      ],
      basket: { xYards: 86, yYards: 226 },
      basketPadRadiusYards: 10,
      fairwayHalfWidthYards: 15,
      waters: [{ center: { xYards: 168, yYards: 140 }, radiusYards: 16 }],
    },
    [
      { center: { xYards: 36, yYards: 96 }, count: 4, spreadYards: 9 },
      { center: { xYards: 150, yYards: 86 }, count: 3, spreadYards: 8 },
      { center: { xYards: 62, yYards: 176 }, count: 4, spreadYards: 8 },
      { center: { xYards: 58, yYards: 236 }, count: 3, spreadYards: 7 },
    ],
  ),
  completeHole(
    {
      holeNumber: 8,
      par: 3,
      name: "Island",
      brief: "Carry the water. Leave extra fade.",
      tee: { xYards: 100, yYards: 18 },
      fairwayWaypoints: [{ xYards: 100, yYards: 46 }],
      basket: { xYards: 100, yYards: 98 },
      basketPadRadiusYards: 8,
      fairwayHalfWidthYards: 10,
      waters: [{ center: { xYards: 100, yYards: 98 }, radiusYards: 22 }],
    },
    [
      { center: { xYards: 58, yYards: 50 }, count: 3, spreadYards: 7 },
      { center: { xYards: 142, yYards: 52 }, count: 3, spreadYards: 7 },
    ],
  ),
  completeHole(
    {
      holeNumber: 9,
      par: 4,
      name: "Night Line",
      brief: "Finish around the grove. Hyzer home.",
      tee: { xYards: 154, yYards: 16 },
      fairwayWaypoints: [
        { xYards: 136, yYards: 68 },
        { xYards: 102, yYards: 112 },
      ],
      basket: { xYards: 70, yYards: 164 },
      basketPadRadiusYards: 10,
      fairwayHalfWidthYards: 13,
      waters: [],
    },
    [
      { center: { xYards: 172, yYards: 78 }, count: 5, spreadYards: 10 },
      { center: { xYards: 118, yYards: 132 }, count: 6, spreadYards: 11 },
      { center: { xYards: 48, yYards: 176 }, count: 3, spreadYards: 8 },
    ],
  ),
];

export const COURSE_PAR = NINE_HOLE_COURSE.reduce(
  (sum, courseHole) => sum + courseHole.par,
  0,
);

export function courseHoleByNumber(holeNumber: number): CourseHole {
  const courseHole = NINE_HOLE_COURSE.find(
    (entry) => entry.holeNumber === holeNumber,
  );
  if (!courseHole) {
    throw new Error(`No hole ${holeNumber}`);
  }
  return courseHole;
}

export function fairwayPath(courseHole: CourseHole): CoursePointYards[] {
  return [courseHole.tee, ...courseHole.fairwayWaypoints, courseHole.basket];
}

export function holeLengthYards(courseHole: CourseHole): number {
  const path = fairwayPath(courseHole);
  let totalYards = 0;
  for (let index = 0; index < path.length - 1; index += 1) {
    totalYards += distanceYards(path[index], path[index + 1]);
  }
  return Math.round(totalYards);
}

export function sampledFairwayPath(
  courseHole: CourseHole,
  spacingYards: number,
): CoursePointYards[] {
  const corners = fairwayPath(courseHole);
  const samples: CoursePointYards[] = [corners[0]];
  for (let index = 0; index < corners.length - 1; index += 1) {
    const start = corners[index];
    const end = corners[index + 1];
    const lengthYards = distanceYards(start, end);
    const stepCount = Math.max(1, Math.round(lengthYards / spacingYards));
    for (let step = 1; step <= stepCount; step += 1) {
      const t = step / stepCount;
      samples.push({
        xYards: start.xYards + (end.xYards - start.xYards) * t,
        yYards: start.yYards + (end.yYards - start.yYards) * t,
      });
    }
  }
  return samples;
}

export function distanceYards(
  from: CoursePointYards,
  to: CoursePointYards,
): number {
  return Math.hypot(to.xYards - from.xYards, to.yYards - from.yYards);
}

export function headingDegreesToBasket(
  from: CoursePointYards,
  basket: CoursePointYards,
): number {
  return (
    (Math.atan2(basket.xYards - from.xYards, basket.yYards - from.yYards) *
      180) /
    Math.PI
  );
}

export function surfaceAtPosition(
  courseHole: CourseHole,
  position: CoursePointYards,
): CourseSurface {
  if (distanceYards(position, courseHole.basket) <= BASKET_CATCH_RADIUS_YARDS) {
    return "basket";
  }
  if (
    distanceYards(position, courseHole.basket) <=
    courseHole.basketPadRadiusYards
  ) {
    return "fairway";
  }
  if (
    courseHole.waters.some(
      (water) => distanceYards(position, water.center) <= water.radiusYards,
    )
  ) {
    return "water";
  }
  if (distanceYards(position, courseHole.tee) <= 6) {
    return "tee";
  }
  if (isUnderTreeCanopy(courseHole, position)) {
    return "tall-rough";
  }
  if (distanceToFairwayYards(courseHole, position) <= courseHole.fairwayHalfWidthYards) {
    return "fairway";
  }
  return "rough";
}

export function isUnderTreeCanopy(
  courseHole: CourseHole,
  position: CoursePointYards,
): boolean {
  return courseHole.treePoints.some(
    (treePoint) =>
      distanceYards(position, treePoint) <= TREE_CANOPY_RADIUS_YARDS,
  );
}

export function firstTreeHitOnPath(
  courseHole: CourseHole,
  start: CoursePointYards,
  end: CoursePointYards,
): { treePoint: CoursePointYards; restAtBase: CoursePointYards } | null {
  let nearestHit:
    | { treePoint: CoursePointYards; restAtBase: CoursePointYards; t: number }
    | null = null;

  for (const treePoint of courseHole.treePoints) {
    if (distanceYards(start, treePoint) <= TREE_TRUNK_RADIUS_YARDS + 0.45) {
      continue;
    }
    const hit = firstCircleHitOnSegment(
      start,
      end,
      treePoint,
      TREE_TRUNK_RADIUS_YARDS,
    );
    if (!hit) {
      continue;
    }
    if (!nearestHit || hit.t < nearestHit.t) {
      nearestHit = {
        treePoint,
        restAtBase: pointAtTreeBase(start, treePoint),
        t: hit.t,
      };
    }
  }

  return nearestHit
    ? { treePoint: nearestHit.treePoint, restAtBase: nearestHit.restAtBase }
    : null;
}

type TreeGrove = {
  center: CoursePointYards;
  count: number;
  spreadYards: number;
};

function completeHole(
  draft: Omit<CourseHole, "treePoints">,
  groves: TreeGrove[],
): CourseHole {
  return {
    ...draft,
    treePoints: groves.flatMap((grove, groveIndex) =>
      treeGrove(draft, grove, groveIndex),
    ),
  };
}

function treeGrove(
  draft: Omit<CourseHole, "treePoints">,
  grove: TreeGrove,
  groveIndex: number,
): CoursePointYards[] {
  const planted: CoursePointYards[] = [];
  for (let treeIndex = 0; treeIndex < grove.count; treeIndex += 1) {
    const angleRadians =
      (treeIndex / grove.count) * Math.PI * 2 + groveIndex * 0.7;
    const jitter = treeJitter(
      grove.center.xYards + treeIndex,
      grove.center.yYards,
      groveIndex,
    );
    const radiusYards = grove.spreadYards * (0.28 + (jitter * 0.5 + 0.5) * 0.72);
    const treePoint = {
      xYards: clampTreeX(
        grove.center.xYards + Math.cos(angleRadians) * radiusYards,
      ),
      yYards: clampTreeY(
        grove.center.yYards + Math.sin(angleRadians) * radiusYards,
      ),
    };
    if (isTreeClearOfPlay(draft, treePoint)) {
      planted.push(treePoint);
    }
  }
  return planted;
}

function isTreeClearOfPlay(
  draft: Omit<CourseHole, "treePoints">,
  treePoint: CoursePointYards,
): boolean {
  if (distanceYards(treePoint, draft.tee) < 18) {
    return false;
  }
  if (distanceYards(treePoint, draft.basket) < draft.basketPadRadiusYards + 8) {
    return false;
  }
  if (
    draft.waters.some(
      (water) =>
        distanceYards(treePoint, water.center) <= water.radiusYards + 6,
    )
  ) {
    return false;
  }
  return true;
}

function firstCircleHitOnSegment(
  start: CoursePointYards,
  end: CoursePointYards,
  center: CoursePointYards,
  radiusYards: number,
): { t: number; point: CoursePointYards } | null {
  const spanX = end.xYards - start.xYards;
  const spanY = end.yYards - start.yYards;
  const fromCenterX = start.xYards - center.xYards;
  const fromCenterY = start.yYards - center.yYards;
  const a = spanX * spanX + spanY * spanY;
  if (a === 0) {
    return null;
  }
  const b = 2 * (fromCenterX * spanX + fromCenterY * spanY);
  const c =
    fromCenterX * fromCenterX +
    fromCenterY * fromCenterY -
    radiusYards * radiusYards;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) {
    return null;
  }
  const root = Math.sqrt(discriminant);
  const t0 = (-b - root) / (2 * a);
  const t1 = (-b + root) / (2 * a);
  const t = [t0, t1]
    .filter((value) => value > 0.02 && value <= 1)
    .sort((left, right) => left - right)[0];
  if (t == null) {
    return null;
  }
  return {
    t,
    point: {
      xYards: start.xYards + spanX * t,
      yYards: start.yYards + spanY * t,
    },
  };
}

function pointAtTreeBase(
  incomingFrom: CoursePointYards,
  treePoint: CoursePointYards,
): CoursePointYards {
  const awayX = incomingFrom.xYards - treePoint.xYards;
  const awayY = incomingFrom.yYards - treePoint.yYards;
  const awayLength = Math.hypot(awayX, awayY) || 1;
  const standOffYards = TREE_TRUNK_RADIUS_YARDS + 0.9;
  return {
    xYards: treePoint.xYards + (awayX / awayLength) * standOffYards,
    yYards: treePoint.yYards + (awayY / awayLength) * standOffYards,
  };
}

function treeJitter(xYards: number, yYards: number, side: number): number {
  const raw =
    Math.sin(xYards * 12.9898 + yYards * 78.233 + side * 4.123) * 43758.5453;
  return (raw - Math.floor(raw)) * 2 - 1;
}

function clampTreeX(xYards: number): number {
  return Math.min(192, Math.max(8, xYards));
}

function clampTreeY(yYards: number): number {
  return Math.min(268, Math.max(8, yYards));
}

function distanceToFairwayYards(
  courseHole: CourseHole,
  point: CoursePointYards,
): number {
  const path = fairwayPath(courseHole);
  let nearestYards = Number.POSITIVE_INFINITY;
  for (let index = 0; index < path.length - 1; index += 1) {
    nearestYards = Math.min(
      nearestYards,
      distanceToSegmentYards(point, path[index], path[index + 1]),
    );
  }
  return nearestYards;
}

function distanceToSegmentYards(
  point: CoursePointYards,
  start: CoursePointYards,
  end: CoursePointYards,
): number {
  const spanXYards = end.xYards - start.xYards;
  const spanYYards = end.yYards - start.yYards;
  const spanLengthSquared = spanXYards ** 2 + spanYYards ** 2;
  if (spanLengthSquared === 0) {
    return distanceYards(point, start);
  }
  const projection = Math.min(
    1,
    Math.max(
      0,
      ((point.xYards - start.xYards) * spanXYards +
        (point.yYards - start.yYards) * spanYYards) /
        spanLengthSquared,
    ),
  );
  return distanceYards(point, {
    xYards: start.xYards + projection * spanXYards,
    yYards: start.yYards + projection * spanYYards,
  });
}
