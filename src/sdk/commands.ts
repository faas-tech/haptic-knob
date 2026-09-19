import type {
  DamperSettings,
  DetentSettings,
  HapticModeName,
  SpringSettings,
} from "./types";

export function hapticModeCommand(modeName: HapticModeName): string {
  return `mode ${modeName}`;
}

export function damperSettingsCommand(settings: DamperSettings): string {
  return `damper b=${settings.dampingPercent}`;
}

export function springSettingsCommand(settings: SpringSettings): string {
  return `spring k=${settings.stiffnessPercent} b=${settings.dampingPercent}`;
}

export function detentSettingsCommand(settings: DetentSettings): string {
  return `detent count=${settings.detentCount} k=${settings.stiffnessPercent} b=${settings.dampingPercent}`;
}

export const KNOB_COMMANDS = {
  identify: "id",
  status: "status",
  position: "pos",
  startPositionStream50: "stream 50",
  motorOn: "motor on",
  motorOff: "motor off",
  clearFault: "fault clear",
} as const;
