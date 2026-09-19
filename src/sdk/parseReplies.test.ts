import { describe, expect, it } from "vitest";
import { parseCommandReply, parseStatusLine, parseStreamLine } from "./parseReplies";
import { unwrapAngleDegrees } from "./unwrapAngleDegrees";
import {
  detentSettingsForRulerMark,
  rulerMarkKind,
} from "../demos/ruler/rulerMarks";

describe("parseCommandReply", () => {
  it("reads ok", () => {
    expect(parseCommandReply("ok")).toEqual({ confirmed: true, error: null });
  });

  it("reads err codes", () => {
    expect(parseCommandReply("err 3 still booting")).toEqual({
      confirmed: false,
      error: { code: 3, message: "still booting" },
    });
  });
});

describe("parseStatusLine", () => {
  it("reads motor and position fields", () => {
    expect(
      parseStatusLine(
        "status=0x1 position.deg=90 velocity.dps=12 status.enabled=1 control.enable=1 mode=3 fault=0x0000",
      ),
    ).toMatchObject({
      positionDegrees: 90,
      velocityDegreesPerSecond: 12,
      isMotorEnabled: true,
      isMotorCommanded: true,
      modeId: 3,
      faultText: "",
    });
  });
});

describe("parseStreamLine", () => {
  it("converts the packed stream line to degrees", () => {
    expect(parseStreamLine("~ p=0x8000 v=128")).toEqual({
      positionDegrees: 180,
      velocityDegreesPerSecond: 180,
    });
  });
});

describe("unwrapAngleDegrees", () => {
  it("crosses zero without jumping backwards", () => {
    expect(unwrapAngleDegrees(350, 10)).toBe(370);
  });
});

describe("ruler marks", () => {
  it("classifies inch and sixteenth marks", () => {
    expect(rulerMarkKind(3)).toBe("inch");
    expect(rulerMarkKind(3.5)).toBe("half");
    expect(rulerMarkKind(3.25)).toBe("quarter");
    expect(rulerMarkKind(3.0625)).toBe("sixteenth");
  });

  it("uses stronger stiffness on inch marks", () => {
    expect(detentSettingsForRulerMark("inch").stiffnessPercent).toBeGreaterThan(
      detentSettingsForRulerMark("sixteenth").stiffnessPercent,
    );
  });
});
