import type {
  KnobCommandReply,
  KnobStatusReport,
  KnobStreamSample,
} from "./types";

export function parseCommandReply(line: string): Omit<
  KnobCommandReply,
  "sent" | "replyBody"
> | null {
  const trimmedLine = line.trim();
  if (trimmedLine.toLowerCase() === "ok") {
    return { confirmed: true, error: null };
  }

  const errorMatch = trimmedLine.match(/^err\s+(\d+)\s*(.*)$/i);
  if (!errorMatch) {
    return null;
  }

  return {
    confirmed: false,
    error: {
      code: Number(errorMatch[1]),
      message: errorMatch[2] ?? "",
    },
  };
}

export function parseStatusLine(line: string): KnobStatusReport {
  const statusReport: KnobStatusReport = {};
  let faultCode: string | null = null;
  let faultNames = "";

  for (const token of line.trim().split(/\s+/)) {
    const equalsIndex = token.indexOf("=");
    if (equalsIndex < 1) {
      continue;
    }

    const key = token.slice(0, equalsIndex);
    const value = token.slice(equalsIndex + 1);

    if (key === "status") {
      statusReport.statusRegister = value;
    } else if (key === "position.deg") {
      const positionDegrees = Number(value);
      if (Number.isFinite(positionDegrees)) {
        statusReport.positionDegrees = positionDegrees;
      }
    } else if (key === "velocity.dps") {
      const velocityDegreesPerSecond = Number(value);
      if (Number.isFinite(velocityDegreesPerSecond)) {
        statusReport.velocityDegreesPerSecond = velocityDegreesPerSecond;
      }
    } else if (key === "status.enabled") {
      statusReport.isMotorEnabled = value === "1";
    } else if (key === "control.enable") {
      statusReport.isMotorCommanded = value === "1";
    } else if (key === "fault") {
      faultCode = value;
    } else if (key === "fault.names") {
      faultNames = value;
    } else if (key === "mode") {
      const modeId = Number(value);
      if (modeId === 0 || modeId === 1 || modeId === 2 || modeId === 3) {
        statusReport.modeId = modeId;
      }
    }
  }

  if (faultCode != null) {
    statusReport.faultText =
      faultCode === "0x0000"
        ? ""
        : faultNames
          ? `${faultCode} - ${faultNames}`
          : faultCode;
  }

  return statusReport;
}

export function parseStreamLine(line: string): KnobStreamSample | null {
  const match = line.trim().match(/^~\s+p=0x([0-9a-fA-F]+)\s+v=(-?\d+)$/);
  if (!match) {
    return null;
  }

  return {
    positionDegrees: (parseInt(match[1], 16) * 360) / 65536,
    velocityDegreesPerSecond: (Number(match[2]) * 360) / 256,
  };
}
