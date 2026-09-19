export const RULER_LENGTH_INCHES = 12;
export const SIXTEENTHS_PER_INCH = 16;

export type RulerMarkKind = "inch" | "half" | "quarter" | "sixteenth";

export type RulerMark = {
  positionInches: number;
  kind: RulerMarkKind;
};

export function rulerMarkKind(positionInches: number): RulerMarkKind {
  const sixteenths = Math.round(positionInches * SIXTEENTHS_PER_INCH);
  if (sixteenths % 16 === 0) {
    return "inch";
  }
  if (sixteenths % 8 === 0) {
    return "half";
  }
  if (sixteenths % 4 === 0) {
    return "quarter";
  }
  return "sixteenth";
}

export function buildRulerMarks(): RulerMark[] {
  const rulerMarks: RulerMark[] = [];
  const totalSixteenths = RULER_LENGTH_INCHES * SIXTEENTHS_PER_INCH;
  for (let index = 0; index <= totalSixteenths; index += 1) {
    const positionInches = index / SIXTEENTHS_PER_INCH;
    rulerMarks.push({
      positionInches,
      kind: rulerMarkKind(positionInches),
    });
  }
  return rulerMarks;
}

export function clampRulerPositionInches(positionInches: number): number {
  return Math.min(RULER_LENGTH_INCHES, Math.max(0, positionInches));
}

export function detentSettingsForRulerMark(kind: RulerMarkKind): {
  stiffnessPercent: number;
  dampingPercent: number;
} {
  if (kind === "inch") {
    return { stiffnessPercent: 70, dampingPercent: 35 };
  }
  if (kind === "half") {
    return { stiffnessPercent: 45, dampingPercent: 25 };
  }
  if (kind === "quarter") {
    return { stiffnessPercent: 25, dampingPercent: 15 };
  }
  return { stiffnessPercent: 10, dampingPercent: 10 };
}
