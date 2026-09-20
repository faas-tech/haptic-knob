export {
  applyHapticMode,
  applyModeNone,
  disableKnobMotor,
  enableKnobMotor,
  enterHapticMode,
  writeDetentSettings,
  writeSpringSettings,
} from "./applyHapticMode";
export {
  damperSettingsCommand,
  detentSettingsCommand,
  hapticModeCommand,
  KNOB_COMMANDS,
  springSettingsCommand,
  terminatedKnobCommandLine,
} from "./commands";
export {
  connectSmartKnob,
  isWebBluetoothSupported,
  type SmartKnobConnection,
} from "./connectSmartKnob";
export {
  parseCommandReply,
  parseStatusLine,
  parseStreamLine,
} from "./parseReplies";
export { unwrapAngleDegrees } from "./unwrapAngleDegrees";
export type {
  DamperSettings,
  DetentSettings,
  HapticModeId,
  HapticModeName,
  KnobCommandReply,
  KnobConnectionStatus,
  KnobStatusReport,
  KnobStreamSample,
  SpringSettings,
} from "./types";
export {
  NORDIC_UART_NOTIFY_CHARACTERISTIC_ID,
  NORDIC_UART_SERVICE_ID,
  NORDIC_UART_WRITE_CHARACTERISTIC_ID,
} from "./types";
