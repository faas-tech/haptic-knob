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
  const springLine = `spring k=${settings.stiffnessPercent} b=${settings.dampingPercent}`;
  if (settings.deadbandDegrees == null) {
    return springLine;
  }
  return `${springLine} deadband=${settings.deadbandDegrees}`;
}

export function detentSettingsCommand(settings: DetentSettings): string {
  return `detent count=${settings.detentCount} k=${settings.stiffnessPercent} b=${settings.dampingPercent}`;
}

export function terminatedKnobCommandLine(command: string): string {
  if (command.endsWith("\n") || command.endsWith("\r")) {
    return command;
  }
  return `${command}\n`;
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
