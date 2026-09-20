import { describe, expect, it } from "vitest";
import {
  emptySwingWindState,
  shouldReleaseHeldSwing,
  SWING_HOLD_MS,
  updateSwingWindState,
} from "./golfSwingIntent";

describe("updateSwingWindState", () => {
  it("does not mark a bump as a held swing", () => {
    let state = emptySwingWindState();
    state = updateSwingWindState({
      previous: state,
      deltaDegrees: 8,
      velocityDegreesPerSecond: 30,
      nowMs: 1000,
    });
    state = updateSwingWindState({
      previous: state,
      deltaDegrees: 3,
      velocityDegreesPerSecond: -40,
      nowMs: 1080,
    });
    expect(state.hasHeldPeak).toBe(false);
    expect(
      shouldReleaseHeldSwing({
        state,
        isReturningTowardAddress: true,
      }),
    ).toBe(false);
  });

  it("marks an intentional swing after a half-second pause at the peak", () => {
    let state = emptySwingWindState();
    state = updateSwingWindState({
      previous: state,
      deltaDegrees: 7,
      velocityDegreesPerSecond: 20,
      nowMs: 1000,
    });
    state = updateSwingWindState({
      previous: state,
      deltaDegrees: 7.2,
      velocityDegreesPerSecond: 4,
      nowMs: 1000 + SWING_HOLD_MS,
    });
    expect(state.hasHeldPeak).toBe(true);
    expect(
      shouldReleaseHeldSwing({
        state,
        isReturningTowardAddress: true,
      }),
    ).toBe(true);
  });

  it("accepts a light 5 degree wind once the pause is held", () => {
    let state = emptySwingWindState();
    state = updateSwingWindState({
      previous: state,
      deltaDegrees: 5.2,
      velocityDegreesPerSecond: 12,
      nowMs: 2000,
    });
    state = updateSwingWindState({
      previous: state,
      deltaDegrees: 5.1,
      velocityDegreesPerSecond: 3,
      nowMs: 2000 + SWING_HOLD_MS,
    });
    expect(state.hasHeldPeak).toBe(true);
  });
});
