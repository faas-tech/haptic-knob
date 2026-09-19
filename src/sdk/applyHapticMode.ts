import {
  damperSettingsCommand,
  detentSettingsCommand,
  hapticModeCommand,
  KNOB_COMMANDS,
  springSettingsCommand,
} from "./commands";
import type {
  DamperSettings,
  DetentSettings,
  HapticModeName,
  KnobCommandReply,
  SpringSettings,
} from "./types";

export type SendKnobCommand = (
  command: string,
) => Promise<KnobCommandReply>;

export async function enableKnobMotor(
  sendKnobCommand: SendKnobCommand,
): Promise<KnobCommandReply> {
  const motorCommandReply = await sendKnobCommand(KNOB_COMMANDS.motorOn);
  if (motorCommandReply.confirmed) {
    await sendKnobCommand(hapticModeCommand("none"));
  }
  return motorCommandReply;
}

export async function disableKnobMotor(
  sendKnobCommand: SendKnobCommand,
): Promise<KnobCommandReply> {
  return sendKnobCommand(KNOB_COMMANDS.motorOff);
}

export async function applyHapticMode(
  sendKnobCommand: SendKnobCommand,
  modeName: Exclude<HapticModeName, "none">,
  settings: DamperSettings | SpringSettings | DetentSettings,
): Promise<KnobCommandReply> {
  const modeCommandReply = await sendKnobCommand(hapticModeCommand(modeName));
  if (!modeCommandReply.confirmed) {
    return modeCommandReply;
  }

  if (modeName === "damper") {
    return sendKnobCommand(
      damperSettingsCommand(settings as DamperSettings),
    );
  }

  if (modeName === "spring") {
    return sendKnobCommand(springSettingsCommand(settings as SpringSettings));
  }

  return sendKnobCommand(detentSettingsCommand(settings as DetentSettings));
}

export async function applyModeNone(
  sendKnobCommand: SendKnobCommand,
): Promise<KnobCommandReply> {
  return sendKnobCommand(hapticModeCommand("none"));
}
