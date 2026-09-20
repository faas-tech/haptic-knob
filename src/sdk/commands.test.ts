import { describe, expect, it } from "vitest";
import {
  applyHapticMode,
  damperSettingsCommand,
  detentSettingsCommand,
  hapticModeCommand,
  springSettingsCommand,
  terminatedKnobCommandLine,
} from "./index";

describe("terminatedKnobCommandLine", () => {
  it("adds a newline so the host does not wait 150 ms of silence", () => {
    expect(terminatedKnobCommandLine("mode spring")).toBe("mode spring\n");
  });

  it("leaves an already terminated line alone", () => {
    expect(terminatedKnobCommandLine("id\n")).toBe("id\n");
    expect(terminatedKnobCommandLine("id\r")).toBe("id\r");
  });
});

describe("springSettingsCommand", () => {
  it("includes deadband when the demo sets one", () => {
    expect(
      springSettingsCommand({
        stiffnessPercent: 28,
        dampingPercent: 24,
        deadbandDegrees: 2,
      }),
    ).toBe("spring k=28 b=24 deadband=2");
  });
});

describe("applyHapticMode", () => {
  it("enters the mode first so a settings error cannot skip spring or detent", async () => {
    const sentCommands: string[] = [];
    await applyHapticMode(
      async (command) => {
        sentCommands.push(command);
        return {
          sent: true,
          confirmed: true,
          error: null,
          replyBody: "ok",
        };
      },
      "spring",
      { stiffnessPercent: 28, dampingPercent: 24 },
    );
    expect(sentCommands).toEqual([
      hapticModeCommand("spring"),
      springSettingsCommand({
        stiffnessPercent: 28,
        dampingPercent: 24,
      }),
    ]);
  });

  it("writes mode detent then detent settings", async () => {
    const sentCommands: string[] = [];
    await applyHapticMode(
      async (command) => {
        sentCommands.push(command);
        return {
          sent: true,
          confirmed: true,
          error: null,
          replyBody: "ok",
        };
      },
      "detent",
      { detentCount: 16, stiffnessPercent: 32, dampingPercent: 18 },
    );
    expect(sentCommands).toEqual([
      hapticModeCommand("detent"),
      detentSettingsCommand({
        detentCount: 16,
        stiffnessPercent: 32,
        dampingPercent: 18,
      }),
    ]);
  });

  it("writes mode damper then damper settings", async () => {
    const sentCommands: string[] = [];
    await applyHapticMode(
      async (command) => {
        sentCommands.push(command);
        return {
          sent: true,
          confirmed: true,
          error: null,
          replyBody: "ok",
        };
      },
      "damper",
      { dampingPercent: 20 },
    );
    expect(sentCommands).toEqual([
      hapticModeCommand("damper"),
      damperSettingsCommand({ dampingPercent: 20 }),
    ]);
  });
});
