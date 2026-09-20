export type CoursePointYards = {
  xYards: number;
  yYards: number;
};

export type CourseSurface =
  | "tee"
  | "fairway"
  | "rough"
  | "tall-rough"
  | "sand"
  | "water"
  | "green"
  | "cup";

export type CourseCircle = {
  center: CoursePointYards;
  radiusYards: number;
};

export type GreenTiltRisePerYard = {
  xRisePerYard: number;
  yRisePerYard: number;
};

export type CourseHole = {
  holeNumber: number;
  par: 3 | 4 | 5;
  name: string;
  tee: CoursePointYards;
  cup: CoursePointYards;
  greenRadiusYards: number;
  fairwayHalfWidthYards: number;
  fairwayWaypoints: CoursePointYards[];
  waters: CourseCircle[];
  sands: CourseCircle[];
  treePoints: CoursePointYards[];
  greenUndulationScale?: number;
  greenTiltRisePerYard?: GreenTiltRisePerYard;
};

export const CUP_RADIUS_YARDS = 0.5;
export const COURSE_WORLD_WIDTH_YARDS = 220;
export const COURSE_WORLD_DEPTH_YARDS = 560;
export const COURSE_NAME = "Engineer Alley";
export const TREE_TRUNK_RADIUS_YARDS = 2.2;
export const TREE_CANOPY_RADIUS_YARDS = 6;

/**
 * Engineer Alley, par 36. Sequence 4-3-4-5-4-3-4-5-4.
 * MacKenzie: each hole a different problem, a wide first tee, a heroic
 * carry with a short lay-up, and two par 3s / two par 5s at different lengths.
 * Fairway waypoints bend the hole. Extra bunkers and water sit off the
 * safe line so the player can take a worse angle instead of a wet one.
 */
export const NINE_HOLE_COURSE: CourseHole[] = [
  completeHole(
    {
      holeNumber: 1,
      par: 4,
      name: "Datum",
      tee: { xYards: 110, yYards: 22 },
      fairwayWaypoints: [
        { xYards: 112, yYards: 108 },
        { xYards: 118, yYards: 198 },
        { xYards: 110, yYards: 278 },
      ],
      cup: { xYards: 102, yYards: 340 },
      greenRadiusYards: 16,
      fairwayHalfWidthYards: 22,
      waters: [],
      sands: [
        { center: { xYards: 148, yYards: 200 }, radiusYards: 12 },
        { center: { xYards: 82, yYards: 328 }, radiusYards: 9 },
      ],
    },
    [
      { center: { xYards: 166, yYards: 206 }, count: 5, spreadYards: 11 },
      { center: { xYards: 90, yYards: 368 }, count: 4, spreadYards: 10 },
      { center: { xYards: 70, yYards: 214 }, count: 2, spreadYards: 7 },
    ],
  ),
  completeHole(
    {
      holeNumber: 2,
      par: 3,
      name: "Gauge",
      tee: { xYards: 108, yYards: 24 },
      fairwayWaypoints: [{ xYards: 116, yYards: 92 }],
      cup: { xYards: 124, yYards: 160 },
      greenRadiusYards: 11,
      fairwayHalfWidthYards: 14,
      waters: [{ center: { xYards: 138, yYards: 186 }, radiusYards: 11 }],
      sands: [{ center: { xYards: 100, yYards: 144 }, radiusYards: 8 }],
    },
    [
      { center: { xYards: 84, yYards: 138 }, count: 3, spreadYards: 8 },
      { center: { xYards: 150, yYards: 166 }, count: 3, spreadYards: 8 },
    ],
  ),
  completeHole(
    {
      holeNumber: 3,
      par: 4,
      name: "Cam",
      tee: { xYards: 46, yYards: 22 },
      fairwayWaypoints: [
        { xYards: 56, yYards: 108 },
        { xYards: 76, yYards: 186 },
        { xYards: 114, yYards: 258 },
        { xYards: 148, yYards: 318 },
      ],
      cup: { xYards: 170, yYards: 366 },
      greenRadiusYards: 15,
      fairwayHalfWidthYards: 18,
      waters: [],
      sands: [
        { center: { xYards: 110, yYards: 200 }, radiusYards: 14 },
        { center: { xYards: 150, yYards: 358 }, radiusYards: 9 },
      ],
    },
    [
      { center: { xYards: 130, yYards: 188 }, count: 6, spreadYards: 12 },
      { center: { xYards: 48, yYards: 192 }, count: 3, spreadYards: 8 },
      { center: { xYards: 186, yYards: 390 }, count: 4, spreadYards: 10 },
    ],
  ),
  completeHole(
    {
      holeNumber: 4,
      par: 5,
      name: "Span",
      tee: { xYards: 110, yYards: 18 },
      fairwayWaypoints: [
        { xYards: 110, yYards: 108 },
        { xYards: 108, yYards: 176 },
        { xYards: 118, yYards: 328 },
        { xYards: 112, yYards: 418 },
      ],
      cup: { xYards: 108, yYards: 498 },
      greenRadiusYards: 17,
      fairwayHalfWidthYards: 20,
      waters: [{ center: { xYards: 110, yYards: 248 }, radiusYards: 26 }],
      sands: [
        { center: { xYards: 150, yYards: 352 }, radiusYards: 12 },
        { center: { xYards: 86, yYards: 486 }, radiusYards: 10 },
      ],
    },
    [
      { center: { xYards: 72, yYards: 168 }, count: 4, spreadYards: 10 },
      { center: { xYards: 148, yYards: 248 }, count: 3, spreadYards: 8 },
      { center: { xYards: 168, yYards: 356 }, count: 4, spreadYards: 10 },
      { center: { xYards: 70, yYards: 510 }, count: 3, spreadYards: 8 },
    ],
  ),
  completeHole(
    {
      holeNumber: 5,
      par: 4,
      name: "Spline",
      tee: { xYards: 82, yYards: 22 },
      fairwayWaypoints: [
        { xYards: 84, yYards: 96 },
        { xYards: 88, yYards: 168 },
        { xYards: 92, yYards: 238 },
      ],
      cup: { xYards: 94, yYards: 298 },
      greenRadiusYards: 13,
      fairwayHalfWidthYards: 13,
      waters: [],
      sands: [
        { center: { xYards: 60, yYards: 168 }, radiusYards: 10 },
        { center: { xYards: 118, yYards: 172 }, radiusYards: 10 },
        { center: { xYards: 76, yYards: 288 }, radiusYards: 8 },
      ],
    },
    [
      { center: { xYards: 42, yYards: 166 }, count: 4, spreadYards: 9 },
      { center: { xYards: 136, yYards: 174 }, count: 4, spreadYards: 9 },
      { center: { xYards: 62, yYards: 300 }, count: 3, spreadYards: 8 },
    ],
  ),
  completeHole(
    {
      holeNumber: 6,
      par: 3,
      name: "Fixture",
      tee: { xYards: 88, yYards: 26 },
      fairwayWaypoints: [{ xYards: 122, yYards: 112 }],
      cup: { xYards: 158, yYards: 196 },
      greenRadiusYards: 12,
      fairwayHalfWidthYards: 13,
      waters: [{ center: { xYards: 110, yYards: 150 }, radiusYards: 14 }],
      sands: [
        { center: { xYards: 144, yYards: 174 }, radiusYards: 9 },
        { center: { xYards: 176, yYards: 198 }, radiusYards: 8 },
      ],
    },
    [
      { center: { xYards: 90, yYards: 146 }, count: 4, spreadYards: 9 },
      { center: { xYards: 192, yYards: 208 }, count: 3, spreadYards: 8 },
      { center: { xYards: 168, yYards: 224 }, count: 3, spreadYards: 8 },
    ],
  ),
  completeHole(
    {
      holeNumber: 7,
      par: 4,
      name: "Stator",
      tee: { xYards: 140, yYards: 22 },
      fairwayWaypoints: [
        { xYards: 134, yYards: 118 },
        { xYards: 122, yYards: 228 },
        { xYards: 108, yYards: 328 },
      ],
      cup: { xYards: 94, yYards: 416 },
      greenRadiusYards: 15,
      fairwayHalfWidthYards: 16,
      waters: [],
      sands: [
        { center: { xYards: 92, yYards: 220 }, radiusYards: 13 },
        { center: { xYards: 72, yYards: 406 }, radiusYards: 10 },
        { center: { xYards: 116, yYards: 404 }, radiusYards: 8 },
      ],
    },
    [
      { center: { xYards: 72, yYards: 216 }, count: 5, spreadYards: 11 },
      { center: { xYards: 158, yYards: 242 }, count: 2, spreadYards: 7 },
      { center: { xYards: 56, yYards: 418 }, count: 3, spreadYards: 8 },
      { center: { xYards: 94, yYards: 448 }, count: 4, spreadYards: 10 },
    ],
  ),
  completeHole(
    {
      holeNumber: 8,
      par: 5,
      name: "Runout",
      tee: { xYards: 54, yYards: 20 },
      fairwayWaypoints: [
        { xYards: 78, yYards: 112 },
        { xYards: 102, yYards: 200 },
        { xYards: 132, yYards: 318 },
        { xYards: 152, yYards: 400 },
      ],
      cup: { xYards: 168, yYards: 468 },
      greenRadiusYards: 17,
      fairwayHalfWidthYards: 18,
      waters: [{ center: { xYards: 46, yYards: 208 }, radiusYards: 24 }],
      sands: [
        { center: { xYards: 162, yYards: 328 }, radiusYards: 12 },
        { center: { xYards: 186, yYards: 456 }, radiusYards: 10 },
      ],
    },
    [
      { center: { xYards: 26, yYards: 198 }, count: 4, spreadYards: 10 },
      { center: { xYards: 180, yYards: 334 }, count: 4, spreadYards: 10 },
      { center: { xYards: 200, yYards: 470 }, count: 3, spreadYards: 8 },
    ],
  ),
  completeHole(
    {
      holeNumber: 9,
      par: 4,
      name: "Bench",
      tee: { xYards: 126, yYards: 22 },
      fairwayWaypoints: [
        { xYards: 120, yYards: 112 },
        { xYards: 114, yYards: 196 },
        { xYards: 100, yYards: 278 },
      ],
      cup: { xYards: 86, yYards: 356 },
      greenRadiusYards: 15,
      fairwayHalfWidthYards: 17,
      waters: [{ center: { xYards: 100, yYards: 308 }, radiusYards: 13 }],
      sands: [{ center: { xYards: 114, yYards: 348 }, radiusYards: 11 }],
    },
    [
      { center: { xYards: 80, yYards: 188 }, count: 5, spreadYards: 11 },
      { center: { xYards: 130, yYards: 360 }, count: 4, spreadYards: 9 },
      { center: { xYards: 64, yYards: 378 }, count: 3, spreadYards: 8 },
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
  return [courseHole.tee, ...courseHole.fairwayWaypoints, courseHole.cup];
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

export function teeAimPoint(courseHole: CourseHole): CoursePointYards {
  return courseHole.fairwayWaypoints[0] ?? courseHole.cup;
}

export function nextAimPoint(
  courseHole: CourseHole,
  from: CoursePointYards,
): CoursePointYards {
  const path = fairwayPath(courseHole);
  for (const point of path.slice(1)) {
    if (distanceYards(from, point) > 28) {
      return point;
    }
  }
  return courseHole.cup;
}

export function distanceYards(
  from: CoursePointYards,
  to: CoursePointYards,
): number {
  return Math.hypot(to.xYards - from.xYards, to.yYards - from.yYards);
}

export function headingDegreesToCup(
  from: CoursePointYards,
  cup: CoursePointYards,
): number {
  return (
    (Math.atan2(cup.xYards - from.xYards, cup.yYards - from.yYards) * 180) /
    Math.PI
  );
}

export function surfaceAtPosition(
  courseHole: CourseHole,
  position: CoursePointYards,
): CourseSurface {
  const yardsToCup = distanceYards(position, courseHole.cup);
  if (yardsToCup <= CUP_RADIUS_YARDS) {
    return "cup";
  }
  if (yardsToCup <= courseHole.greenRadiusYards) {
    return "green";
  }
  if (
    courseHole.waters.some(
      (water) =>
        distanceYards(position, water.center) <= water.radiusYards,
    )
  ) {
    return "water";
  }
  if (
    courseHole.sands.some(
      (sand) => distanceYards(position, sand.center) <= sand.radiusYards,
    )
  ) {
    return "sand";
  }
  if (distanceYards(position, courseHole.tee) <= 8) {
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

export function isBallOnGreen(
  courseHole: CourseHole,
  position: CoursePointYards,
): boolean {
  const surface = surfaceAtPosition(courseHole, position);
  return surface === "green" || surface === "cup";
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
  if (distanceYards(treePoint, draft.tee) < 22) {
    return false;
  }
  if (distanceYards(treePoint, draft.cup) < draft.greenRadiusYards + 10) {
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
  if (
    draft.sands.some(
      (sand) => distanceYards(treePoint, sand.center) <= sand.radiusYards + 2.4,
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
  const raw = Math.sin(xYards * 12.9898 + yYards * 78.233 + side * 4.123) * 43758.5453;
  return (raw - Math.floor(raw)) * 2 - 1;
}

function clampTreeX(xYards: number): number {
  return Math.min(212, Math.max(8, xYards));
}

function clampTreeY(yYards: number): number {
  return Math.min(548, Math.max(8, yYards));
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
