export const NORDIC_UART_SERVICE_ID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
export const NORDIC_UART_WRITE_CHARACTERISTIC_ID =
  "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
export const NORDIC_UART_NOTIFY_CHARACTERISTIC_ID =
  "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

export type KnobConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export type HapticModeId = 0 | 1 | 2 | 3;

export type HapticModeName = "none" | "damper" | "spring" | "detent";

export type KnobCommandReply = {
  sent: boolean;
  confirmed: boolean;
  error: { code: number; message: string } | null;
  replyBody: string | null;
};

export type KnobStatusReport = {
  positionDegrees?: number;
  velocityDegreesPerSecond?: number;
  isMotorEnabled?: boolean;
  isMotorCommanded?: boolean;
  modeId?: HapticModeId;
  statusRegister?: string;
  faultText?: string;
};

export type KnobStreamSample = {
  positionDegrees: number;
  velocityDegreesPerSecond: number;
};

export type DamperSettings = {
  dampingPercent: number;
};

export type SpringSettings = {
  stiffnessPercent: number;
  dampingPercent: number;
  deadbandDegrees?: number;
};

export type DetentSettings = {
  detentCount: number;
  stiffnessPercent: number;
  dampingPercent: number;
};
