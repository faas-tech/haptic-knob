import { useEffect, useMemo, useRef, useState } from "react";
import {
  applyHapticMode,
  detentSettingsCommand,
  enableKnobMotor,
  KNOB_COMMANDS,
  unwrapAngleDegrees,
  type KnobCommandReply,
  type KnobStreamSample,
} from "../../sdk";
import {
  buildRulerMarks,
  clampRulerPositionInches,
  detentSettingsForRulerMark,
  RULER_LENGTH_INCHES,
  rulerMarkKind,
  SIXTEENTHS_PER_INCH,
} from "./rulerMarks";

const INCHES_PER_REVOLUTION = 1;
const PIXELS_PER_INCH = 96;

export function RulerDemo(props: {
  isConnected: boolean;
  latestStreamSample: KnobStreamSample | null;
  sendKnobCommand: (command: string) => Promise<KnobCommandReply>;
}) {
  const rulerMarks = useMemo(() => buildRulerMarks(), []);
  const [positionInches, setPositionInches] = useState(0);
  const [isMotorEnabled, setIsMotorEnabled] = useState(false);
  const [hasAppliedRulerDetents, setHasAppliedRulerDetents] = useState(false);
  const [operatorMessage, setOperatorMessage] = useState(
    "Power the knob, connect, enable the motor, then apply detents. Arrow keys move the on-screen ruler when the knob is offline.",
  );
  const unwrappedDegreesRef = useRef<number | null>(null);
  const originDegreesRef = useRef<number | null>(null);
  const lastMarkKindRef = useRef(rulerMarkKind(0));

  useEffect(() => {
    if (!props.latestStreamSample) {
      return;
    }

    unwrappedDegreesRef.current = unwrapAngleDegrees(
      unwrappedDegreesRef.current,
      props.latestStreamSample.positionDegrees,
    );
    if (originDegreesRef.current == null) {
      originDegreesRef.current = unwrappedDegreesRef.current;
    }
    const nextPositionInches = clampRulerPositionInches(
      ((unwrappedDegreesRef.current - originDegreesRef.current) / 360) *
        INCHES_PER_REVOLUTION,
    );
    setPositionInches(nextPositionInches);
  }, [props.latestStreamSample]);

  useEffect(() => {
    if (!props.isConnected || !hasAppliedRulerDetents) {
      return;
    }

    const markKind = rulerMarkKind(positionInches);
    if (markKind === lastMarkKindRef.current) {
      return;
    }

    lastMarkKindRef.current = markKind;
    const detentSettingsForMark = detentSettingsForRulerMark(markKind);
    void props.sendKnobCommand(
      detentSettingsCommand({
        detentCount: SIXTEENTHS_PER_INCH,
        stiffnessPercent: detentSettingsForMark.stiffnessPercent,
        dampingPercent: detentSettingsForMark.dampingPercent,
      }),
    );
  }, [
    hasAppliedRulerDetents,
    positionInches,
    props.isConnected,
    props.sendKnobCommand,
  ]);

  const moveStandInRulerByInches = (deltaInches: number) => {
    setPositionInches((currentPositionInches) =>
      clampRulerPositionInches(currentPositionInches + deltaInches),
    );
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        moveStandInRulerByInches(1 / SIXTEENTHS_PER_INCH);
      } else if (event.key === "ArrowLeft") {
        moveStandInRulerByInches(-1 / SIXTEENTHS_PER_INCH);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const enableRulerMotor = async () => {
    const identifyReply = await props.sendKnobCommand(KNOB_COMMANDS.identify);
    await props.sendKnobCommand(KNOB_COMMANDS.status);
    const motorCommandReply = await enableKnobMotor(props.sendKnobCommand);
    setIsMotorEnabled(motorCommandReply.confirmed);
    setOperatorMessage(
      motorCommandReply.confirmed
        ? "Motor is on. Apply detents to feel sixteenths of an inch per click."
        : `Motor did not confirm: ${motorCommandReply.error?.message ?? identifyReply.replyBody ?? "no reply"}`,
    );
  };

  const applyRulerDetents = async () => {
    const detentSettingsForMark = detentSettingsForRulerMark(
      rulerMarkKind(positionInches),
    );
    const detentCommandReply = await applyHapticMode(
      props.sendKnobCommand,
      "detent",
      {
        detentCount: SIXTEENTHS_PER_INCH,
        stiffnessPercent: detentSettingsForMark.stiffnessPercent,
        dampingPercent: detentSettingsForMark.dampingPercent,
      },
    );
    setHasAppliedRulerDetents(detentCommandReply.confirmed);
    setOperatorMessage(
      detentCommandReply.confirmed
        ? "16 clicks per turn, one inch per turn. Stiffness rises at quarters, halves, and inches. That live change is experimental."
        : `Detent mode did not confirm: ${detentCommandReply.error?.message ?? "no reply"}`,
    );
  };

  const viewportOffsetPx = positionInches * PIXELS_PER_INCH;

  return (
    <section className="demo">
      <div className="demo-copy">
        <h1>12-inch ruler</h1>
        <p>
          One full turn moves one inch. Sixteen detents per turn are the
          sixteenths. The firmware takes one stiffness at a time, so the lab
          raises stiffness at a quarter, half, or inch mark.
        </p>
        <p className="readout">
          {positionInches.toFixed(4)} in / {RULER_LENGTH_INCHES} in
        </p>
        <p className="operator-message">{operatorMessage}</p>
        <div className="actions">
          <button
            type="button"
            disabled={!props.isConnected}
            onClick={() => void enableRulerMotor()}
          >
            {isMotorEnabled ? "Motor enabled" : "Enable motor"}
          </button>
          <button
            type="button"
            disabled={!props.isConnected}
            onClick={() => void applyRulerDetents()}
          >
            Apply ruler detents
          </button>
        </div>
      </div>

      <div className="ruler-window" aria-label="Twelve inch ruler">
        <div
          className="ruler-track"
          style={{
            width: RULER_LENGTH_INCHES * PIXELS_PER_INCH,
            transform: `translateX(calc(50% - ${viewportOffsetPx}px))`,
          }}
        >
          {rulerMarks.map((rulerMark) => (
            <span
              key={rulerMark.positionInches}
              className={`tick tick-${rulerMark.kind}`}
              style={{ left: rulerMark.positionInches * PIXELS_PER_INCH }}
            >
              {rulerMark.kind === "inch" ? (
                <em>{rulerMark.positionInches}</em>
              ) : null}
            </span>
          ))}
        </div>
        <div className="hairline" />
      </div>
    </section>
  );
}
