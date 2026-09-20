export const RULER_LENGTH_INCHES = 12;
export const SIXTEENTHS_PER_INCH = 16;
export const HAPTIC_CLICKS_PER_REVOLUTION = 16;
export const INCHES_PER_HAPTIC_CLICK = 1 / HAPTIC_CLICKS_PER_REVOLUTION;
export const HAPTIC_SETTLE_MS = 180;
export const COMMITTED_TRAVEL_INCHES_PER_SECOND = 0.04;
export const DETENT_VALLEY_MIN_GAP_FRACTION = 0.52;
export const DETENT_VALLEY_MAX_GAP_FRACTION = 0.8;
export const HAPTIC_CLICK_HOLD_GAP_FRACTION = 0.55;
export const DISPLAY_CLICK_HOLD_GAP_FRACTION = 0.55;

const SIXTEENTH_FRACTION_LABELS = [
  "",
  "1/16",
  "1/8",
  "3/16",
  "1/4",
  "5/16",
  "3/8",
  "7/16",
  "1/2",
  "9/16",
  "5/8",
  "11/16",
  "3/4",
  "13/16",
  "7/8",
  "15/16",
];

export type RulerMarkKind =
  | "inch"
  | "half"
  | "quarter"
  | "eighth"
  | "sixteenth";

export type RulerHapticMarkKind = RulerMarkKind;

export type RulerMark = {
  positionInches: number;
  kind: RulerMarkKind;
};

export type RulerDetentSettings = {
  stiffnessPercent: number;
  dampingPercent: number;
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
  if (sixteenths % 2 === 0) {
    return "eighth";
  }
  return "sixteenth";
}

export function hapticMarkKind(positionInches: number): RulerHapticMarkKind {
  return rulerMarkKind(positionInches);
}

export function detentGapFraction(positionInches: number): number {
  const clicksExact =
    clampRulerPositionInches(positionInches) / INCHES_PER_HAPTIC_CLICK;
  return clicksExact - Math.floor(clicksExact);
}

export function isInDetentValley(positionInches: number): boolean {
  const gapFraction = detentGapFraction(positionInches);
  return (
    gapFraction >= DETENT_VALLEY_MIN_GAP_FRACTION &&
    gapFraction <= DETENT_VALLEY_MAX_GAP_FRACTION
  );
}

export function hasCommittedRulerTravel(
  travelInchesPerSecond: number,
): boolean {
  return Math.abs(travelInchesPerSecond) >= COMMITTED_TRAVEL_INCHES_PER_SECOND;
}

export function upcomingHapticMarkKind(args: {
  positionInches: number;
  travelInchesPerSecond: number;
}): RulerHapticMarkKind {
  const clampedInches = clampRulerPositionInches(args.positionInches);
  if (!hasCommittedRulerTravel(args.travelInchesPerSecond)) {
    return hapticMarkKind(clampedInches);
  }

  const clicksExact = clampedInches / INCHES_PER_HAPTIC_CLICK;
  const maxClicks = RULER_LENGTH_INCHES / INCHES_PER_HAPTIC_CLICK;
  const nextClicks =
    args.travelInchesPerSecond > 0
      ? Math.min(maxClicks, Math.ceil(clicksExact + 1e-4))
      : Math.max(0, Math.floor(clicksExact - 1e-4));
  return hapticMarkKind(nextClicks * INCHES_PER_HAPTIC_CLICK);
}

export function shouldRetuneRulerDetents(args: {
  positionInches: number;
  travelInchesPerSecond: number;
  isHapticSettling: boolean;
}): boolean {
  if (args.isHapticSettling) {
    return false;
  }
  if (!hasCommittedRulerTravel(args.travelInchesPerSecond)) {
    return false;
  }
  return isInDetentValley(args.positionInches);
}

export function stepHapticClickIndex(args: {
  positionInches: number;
  lastClickIndex: number | null;
  holdGapFraction?: number;
}): number {
  const holdGapFraction =
    args.holdGapFraction ?? HAPTIC_CLICK_HOLD_GAP_FRACTION;
  const clicksExact =
    clampRulerPositionInches(args.positionInches) / INCHES_PER_HAPTIC_CLICK;
  const maxClickIndex = RULER_LENGTH_INCHES / INCHES_PER_HAPTIC_CLICK;
  if (args.lastClickIndex == null) {
    return Math.round(clicksExact);
  }
  if (clicksExact > args.lastClickIndex + holdGapFraction) {
    return Math.min(maxClickIndex, args.lastClickIndex + 1);
  }
  if (clicksExact < args.lastClickIndex - holdGapFraction) {
    return Math.max(0, args.lastClickIndex - 1);
  }
  return args.lastClickIndex;
}

export function hapticClickReading(clickIndex: number): {
  positionInches: number;
  wholeInches: number;
  sixteenths: number;
  fractionLabel: string;
  displayLabel: string;
} {
  const clampedIndex = Math.max(
    0,
    Math.min(RULER_LENGTH_INCHES / INCHES_PER_HAPTIC_CLICK, clickIndex),
  );
  const positionInches = clampedIndex * INCHES_PER_HAPTIC_CLICK;
  const wholeInches = Math.floor(clampedIndex / HAPTIC_CLICKS_PER_REVOLUTION);
  const sixteenths = clampedIndex % HAPTIC_CLICKS_PER_REVOLUTION;
  const fractionLabel = SIXTEENTH_FRACTION_LABELS[sixteenths] ?? "";
  const displayLabel = fractionLabel
    ? wholeInches > 0
      ? `${wholeInches} ${fractionLabel}`
      : fractionLabel
    : String(wholeInches);
  return {
    positionInches,
    wholeInches,
    sixteenths,
    fractionLabel,
    displayLabel,
  };
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

export function detentSettingsForRulerMark(
  kind: RulerMarkKind,
): RulerDetentSettings {
  if (kind === "inch") {
    return { stiffnessPercent: 92, dampingPercent: 76 };
  }
  if (kind === "half") {
    return { stiffnessPercent: 56, dampingPercent: 50 };
  }
  if (kind === "quarter") {
    return { stiffnessPercent: 38, dampingPercent: 36 };
  }
  if (kind === "eighth") {
    return { stiffnessPercent: 22, dampingPercent: 24 };
  }
  return { stiffnessPercent: 6, dampingPercent: 14 };
}

export function detentSettingsMatch(
  left: RulerDetentSettings,
  right: RulerDetentSettings,
): boolean {
  return (
    left.stiffnessPercent === right.stiffnessPercent &&
    left.dampingPercent === right.dampingPercent
  );
}
