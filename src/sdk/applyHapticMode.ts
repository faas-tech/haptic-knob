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

  const settingsCommand =
    modeName === "damper"
      ? damperSettingsCommand(settings as DamperSettings)
      : modeName === "spring"
        ? springSettingsCommand(settings as SpringSettings)
        : detentSettingsCommand(settings as DetentSettings);
  return sendKnobCommand(settingsCommand);
}

export async function enterHapticMode(
  sendKnobCommand: SendKnobCommand,
  modeName: HapticModeName,
): Promise<KnobCommandReply> {
  return sendKnobCommand(hapticModeCommand(modeName));
}

export async function writeSpringSettings(
  sendKnobCommand: SendKnobCommand,
  settings: SpringSettings,
): Promise<KnobCommandReply> {
  return sendKnobCommand(springSettingsCommand(settings));
}

export async function writeDetentSettings(
  sendKnobCommand: SendKnobCommand,
  settings: DetentSettings,
): Promise<KnobCommandReply> {
  return sendKnobCommand(detentSettingsCommand(settings));
}

export async function applyModeNone(
  sendKnobCommand: SendKnobCommand,
): Promise<KnobCommandReply> {
  return sendKnobCommand(hapticModeCommand("none"));
}
