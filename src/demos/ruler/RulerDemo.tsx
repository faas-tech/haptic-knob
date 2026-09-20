import { useEffect, useMemo, useRef, useState } from "react";
import { MotorIcon } from "../../brand/LabIcons";
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
  type RulerMarkKind,
} from "./rulerMarks";

const INCHES_PER_REVOLUTION = 1;
const PIXELS_PER_INCH = 112;

const INTENSITY_RANKS: { kind: RulerMarkKind; label: string }[] = [
  { kind: "sixteenth", label: "1/16" },
  { kind: "quarter", label: "1/4" },
  { kind: "half", label: "1/2" },
  { kind: "inch", label: "1 in" },
];

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
    "Power the knob, connect, enable the motor, then apply detents. Arrow keys move the ruler when the knob is offline.",
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

  const currentMarkKind = rulerMarkKind(positionInches);
  const currentIntensityIndex = INTENSITY_RANKS.findIndex(
    (rank) => rank.kind === currentMarkKind,
  );
  const detentSettings = detentSettingsForRulerMark(currentMarkKind);
  const viewportOffsetPx = positionInches * PIXELS_PER_INCH;
  const travelPercent = (positionInches / RULER_LENGTH_INCHES) * 100;

  return (
    <section className="demo ruler-demo">
      <div className="demo-copy">
        <div className="demo-heading">
          <p className="eyebrow">Detent · 16 clicks / rev</p>
          <h1>12-inch ruler</h1>
          <p>
            One full turn moves one inch. Sixteen detents per turn are the
            sixteenths. Firmware takes one stiffness at a time, so the lab
            raises it at a quarter, half, or inch.
          </p>
        </div>

        <div className="hud-panel">
          <div className="readout-block">
            <p className="readout-label">Position</p>
            <p className="readout">
              {positionInches.toFixed(4)}
              <small> in</small>
            </p>
          </div>
          <div className="intensity-board" aria-label="Detent intensity">
            {INTENSITY_RANKS.map((rank, index) => (
              <span
                key={rank.kind}
                className={
                  index <= currentIntensityIndex
                    ? "intensity-pip is-lit"
                    : "intensity-pip"
                }
              >
                {rank.label}
              </span>
            ))}
          </div>
          <div className="stiffness-readout">
            <p className="readout-label">Stiffness / damping</p>
            <p className="readout-meta">
              k={detentSettings.stiffnessPercent} · b={detentSettings.dampingPercent}
            </p>
          </div>
        </div>

        <div className="travel-track" aria-hidden="true">
          <span className="travel-fill" style={{ width: `${travelPercent}%` }} />
        </div>
        <span className="travel-caption">
          {positionInches.toFixed(2)} / {RULER_LENGTH_INCHES} in
        </span>

        <p className="operator-message">{operatorMessage}</p>
        <div className="actions">
          <button
            type="button"
            className={isMotorEnabled ? "button-ghost" : "button-primary"}
            disabled={!props.isConnected}
            onClick={() => void enableRulerMotor()}
          >
            <MotorIcon className="button-icon" />
            {isMotorEnabled ? "Motor enabled" : "Enable motor"}
          </button>
          <button
            type="button"
            className="button-primary"
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
            left: "50%",
            transform: `translateX(-${viewportOffsetPx}px)`,
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
        <div className="ruler-brass-edge" />
      </div>
    </section>
  );
}
