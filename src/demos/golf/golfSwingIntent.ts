export type SwingWindState = {
  peakDeltaDegrees: number;
  lastWoundAtMs: number;
  hasHeldPeak: boolean;
};

export const SWING_HOLD_MS = 500;
export const MINIMUM_SWING_WIND_DEGREES = 5;
export const SWING_HOLD_WINDOW_DEGREES = 5;
export const SWING_HOLD_MAX_VELOCITY_DEGREES_PER_SECOND = 22;

export function emptySwingWindState(): SwingWindState {
  return {
    peakDeltaDegrees: 0,
    lastWoundAtMs: 0,
    hasHeldPeak: false,
  };
}

export function updateSwingWindState(args: {
  previous: SwingWindState;
  deltaDegrees: number;
  velocityDegreesPerSecond: number;
  nowMs: number;
  minimumWindDegrees?: number;
  holdMs?: number;
}): SwingWindState {
  const minimumWindDegrees =
    args.minimumWindDegrees ?? MINIMUM_SWING_WIND_DEGREES;
  const holdMs = args.holdMs ?? SWING_HOLD_MS;
  const windDeltaDegrees = Math.max(0, args.deltaDegrees);

  if (windDeltaDegrees > args.previous.peakDeltaDegrees + 0.8) {
    return {
      peakDeltaDegrees: windDeltaDegrees,
      lastWoundAtMs: args.nowMs,
      hasHeldPeak: false,
    };
  }

  const isNearPeak =
    args.previous.peakDeltaDegrees >= minimumWindDegrees &&
    Math.abs(windDeltaDegrees - args.previous.peakDeltaDegrees) <=
      SWING_HOLD_WINDOW_DEGREES &&
    Math.abs(args.velocityDegreesPerSecond) <=
      SWING_HOLD_MAX_VELOCITY_DEGREES_PER_SECOND;

  if (
    isNearPeak &&
    args.nowMs - args.previous.lastWoundAtMs >= holdMs
  ) {
    return {
      ...args.previous,
      hasHeldPeak: true,
    };
  }

  return args.previous;
}

export function shouldReleaseHeldSwing(args: {
  state: SwingWindState;
  isReturningTowardAddress: boolean;
}): boolean {
  return args.state.hasHeldPeak && args.isReturningTowardAddress;
}
