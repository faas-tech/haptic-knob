import { describe, expect, it } from "vitest";
import { knobTurnSideFromSample } from "./golfKnobTurn";

describe("knobTurnSideFromSample", () => {
  it("reads a right turn from positive velocity", () => {
    expect(
      knobTurnSideFromSample({
        velocityDegreesPerSecond: 40,
        deltaChangeDegrees: 0.2,
      }),
    ).toBe("right");
  });

  it("reads a left turn from negative velocity", () => {
    expect(
      knobTurnSideFromSample({
        velocityDegreesPerSecond: -40,
        deltaChangeDegrees: -0.2,
      }),
    ).toBe("left");
  });

  it("treats a quiet sample as still", () => {
    expect(
      knobTurnSideFromSample({
        velocityDegreesPerSecond: 3,
        deltaChangeDegrees: 0.2,
      }),
    ).toBe("still");
  });

  it("uses a rightward delta change when velocity is quiet", () => {
    expect(
      knobTurnSideFromSample({
        velocityDegreesPerSecond: 2,
        deltaChangeDegrees: 2,
      }),
    ).toBe("right");
  });
});
