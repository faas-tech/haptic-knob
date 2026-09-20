export type KnobTurnSide = "left" | "right" | "still";

const TURN_VELOCITY_DEGREES_PER_SECOND = 10;
const TURN_DELTA_CHANGE_DEGREES = 0.7;

export function knobTurnSideFromSample(args: {
  velocityDegreesPerSecond: number;
  deltaChangeDegrees: number;
}): KnobTurnSide {
  if (
    args.velocityDegreesPerSecond > TURN_VELOCITY_DEGREES_PER_SECOND ||
    args.deltaChangeDegrees > TURN_DELTA_CHANGE_DEGREES
  ) {
    return "right";
  }
  if (
    args.velocityDegreesPerSecond < -TURN_VELOCITY_DEGREES_PER_SECOND ||
    args.deltaChangeDegrees < -TURN_DELTA_CHANGE_DEGREES
  ) {
    return "left";
  }
  return "still";
}
