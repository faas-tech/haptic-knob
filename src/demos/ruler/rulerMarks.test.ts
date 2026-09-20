import { describe, expect, it } from "vitest";
import {
  detentGapFraction,
  detentSettingsForRulerMark,
  hapticClickReading,
  hapticMarkKind,
  HAPTIC_CLICKS_PER_REVOLUTION,
  isInDetentValley,
  shouldRetuneRulerDetents,
  stepHapticClickIndex,
  upcomingHapticMarkKind,
} from "./rulerMarks";

describe("haptic spacing", () => {
  it("uses sixteen clicks per turn so each gap is a sixteenth inch", () => {
    expect(HAPTIC_CLICKS_PER_REVOLUTION).toBe(16);
  });

  it("names sixteenth, eighth, quarter, half, and inch haptic clicks", () => {
    expect(hapticMarkKind(3)).toBe("inch");
    expect(hapticMarkKind(3.5)).toBe("half");
    expect(hapticMarkKind(3.25)).toBe("quarter");
    expect(hapticMarkKind(3.125)).toBe("eighth");
    expect(hapticMarkKind(3.0625)).toBe("sixteenth");
    expect(hapticMarkKind(0.875)).toBe("eighth");
  });
});

describe("detent valley", () => {
  it("is 0 on a click and 0.5 halfway to the next sixteenth", () => {
    expect(detentGapFraction(1)).toBeCloseTo(0);
    expect(detentGapFraction(1.03125)).toBeCloseTo(0.5);
  });

  it("is only true late in a gap", () => {
    expect(isInDetentValley(1)).toBe(false);
    expect(isInDetentValley(1.01)).toBe(false);
    expect(isInDetentValley(1.035)).toBe(true);
    expect(isInDetentValley(1.06)).toBe(false);
  });
});

describe("upcomingHapticMarkKind", () => {
  it("keeps the current click when the knob is still", () => {
    expect(
      upcomingHapticMarkKind({
        positionInches: 0.88,
        travelInchesPerSecond: 0,
      }),
    ).toBe("eighth");
    expect(
      upcomingHapticMarkKind({
        positionInches: 1,
        travelInchesPerSecond: 0,
      }),
    ).toBe("inch");
  });

  it("loads the next sixteenth click only after travel is committed", () => {
    expect(
      upcomingHapticMarkKind({
        positionInches: 0.88,
        travelInchesPerSecond: 0.02,
      }),
    ).toBe("eighth");
    expect(
      upcomingHapticMarkKind({
        positionInches: 0.94,
        travelInchesPerSecond: 0.2,
      }),
    ).toBe("inch");
    expect(
      upcomingHapticMarkKind({
        positionInches: 1.06,
        travelInchesPerSecond: -0.2,
      }),
    ).toBe("inch");
  });
});

describe("shouldRetuneRulerDetents", () => {
  it("waits for the valley and a committed turn", () => {
    expect(
      shouldRetuneRulerDetents({
        positionInches: 1.01,
        travelInchesPerSecond: 0.2,
        isHapticSettling: false,
      }),
    ).toBe(false);
    expect(
      shouldRetuneRulerDetents({
        positionInches: 1.035,
        travelInchesPerSecond: 0,
        isHapticSettling: false,
      }),
    ).toBe(false);
    expect(
      shouldRetuneRulerDetents({
        positionInches: 1.035,
        travelInchesPerSecond: 0.2,
        isHapticSettling: true,
      }),
    ).toBe(false);
    expect(
      shouldRetuneRulerDetents({
        positionInches: 1.035,
        travelInchesPerSecond: 0.2,
        isHapticSettling: false,
      }),
    ).toBe(true);
  });
});

describe("stepHapticClickIndex", () => {
  it("advances one sixteenth after the midpoint and never skips", () => {
    expect(
      stepHapticClickIndex({
        positionInches: 1.02,
        lastClickIndex: 16,
      }),
    ).toBe(16);
    expect(
      stepHapticClickIndex({
        positionInches: 1.04,
        lastClickIndex: 16,
      }),
    ).toBe(17);
    expect(
      stepHapticClickIndex({
        positionInches: 1.15,
        lastClickIndex: 16,
      }),
    ).toBe(17);
  });

  it("steps backward one sixteenth at a time", () => {
    expect(
      stepHapticClickIndex({
        positionInches: 0.9,
        lastClickIndex: 16,
      }),
    ).toBe(15);
  });
});

describe("hapticClickReading", () => {
  it("prints sixteenths through whole inches", () => {
    expect(hapticClickReading(0).displayLabel).toBe("0");
    expect(hapticClickReading(1).displayLabel).toBe("1/16");
    expect(hapticClickReading(2).displayLabel).toBe("1/8");
    expect(hapticClickReading(15).displayLabel).toBe("15/16");
    expect(hapticClickReading(16).displayLabel).toBe("1");
    expect(hapticClickReading(17).displayLabel).toBe("1 1/16");
  });
});

describe("detentSettingsForRulerMark", () => {
  it("steps stiffness in wide ranks from sixteenth to inch", () => {
    const sixteenth = detentSettingsForRulerMark("sixteenth");
    const eighth = detentSettingsForRulerMark("eighth");
    const quarter = detentSettingsForRulerMark("quarter");
    const half = detentSettingsForRulerMark("half");
    const inch = detentSettingsForRulerMark("inch");
    expect(eighth.stiffnessPercent - sixteenth.stiffnessPercent).toBeGreaterThanOrEqual(
      12,
    );
    expect(quarter.stiffnessPercent - eighth.stiffnessPercent).toBeGreaterThanOrEqual(
      16,
    );
    expect(half.stiffnessPercent - quarter.stiffnessPercent).toBeGreaterThanOrEqual(
      18,
    );
    expect(inch.stiffnessPercent - half.stiffnessPercent).toBeGreaterThanOrEqual(
      20,
    );
    expect(sixteenth.dampingPercent).toBeLessThan(eighth.dampingPercent);
    expect(eighth.dampingPercent).toBeLessThan(quarter.dampingPercent);
    expect(quarter.dampingPercent).toBeLessThan(half.dampingPercent);
    expect(half.dampingPercent).toBeLessThan(inch.dampingPercent);
  });
});
