import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import "./ruler.css";
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
const PIXELS_PER_INCH = 224;
const SIXTEENTH_LABELS = [
  "",
  "1/16",
  "1/8",
  "3/16",
  "1/4",
  "5/16",
  "3/8",
  "7/16",
  "1/2",
  "9/16",
  "5/8",
  "11/16",
  "3/4",
  "13/16",
  "7/8",
  "15/16",
];

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
    "Connect your SmartKnob, enable the motor, then apply ruler detents.",
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
      if (
        props.isConnected ||
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        (event.target instanceof HTMLElement &&
          (event.target.closest("input, textarea, select") ||
            event.target.isContentEditable))
      )
        return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveStandInRulerByInches(1 / SIXTEENTHS_PER_INCH);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveStandInRulerByInches(-1 / SIXTEENTHS_PER_INCH);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [props.isConnected]);

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

  const nearestSixteenth = Math.round(positionInches * SIXTEENTHS_PER_INCH);
  const wholeInches = Math.floor(nearestSixteenth / SIXTEENTHS_PER_INCH);
  const fractionLabel =
    SIXTEENTH_LABELS[nearestSixteenth % SIXTEENTHS_PER_INCH];
  const measurementFraction = fractionLabel
    ? `${wholeInches > 0 ? `${wholeInches} ` : ""}${fractionLabel}`
    : String(wholeInches);
  const markLabels: Record<RulerMarkKind, string> = {
    inch: "Whole inch",
    half: "Half inch",
    quarter: "Quarter inch",
    sixteenth: "Sixteenth inch",
  };
  const hasLiveDetents = props.isConnected && hasAppliedRulerDetents;
  const instrumentStyle = {
    "--ruler-travel": `${travelPercent}%`,
  } as CSSProperties;

  return (
    <section
      className="ruler-demo"
      style={instrumentStyle}
      aria-labelledby="ruler-title"
    >
      <header className="ruler-heading">
        <div>
          <p className="ruler-kicker">SMARTKNOB INSTRUMENTS / 01</p>
          <h1 id="ruler-title">
            Every little <em>increment.</em>
          </h1>
          <p>A twelve-inch ruler you can feel. One turn, one inch.</p>
        </div>
        <span
          className={`ruler-source ${props.isConnected ? "is-connected" : ""}`}
        >
          <i aria-hidden="true" />
          {props.isConnected ? "SmartKnob connected" : "Interactive preview"}
        </span>
      </header>

      <div className="ruler-instrument">
        <div className="ruler-instrument-top">
          <div className="ruler-measurement">
            <p className="ruler-kicker">POSITION / INCHES</p>
            <output
              className="ruler-position"
              aria-label="Position in inches"
              aria-live="off"
            >
              {positionInches.toFixed(4)}
              <span>in</span>
            </output>
            <div className="ruler-conversions">
              <span>
                <strong>{measurementFraction}″</strong> nearest 1/16
              </span>
              <span>{(positionInches * 25.4).toFixed(2)} mm</span>
            </div>
          </div>
          <div className="ruler-turn-display" aria-hidden="true">
            <div className="ruler-turn-dial">
              <div
                className="ruler-turn-face"
                style={{ transform: `rotate(${positionInches * 360}deg)` }}
              >
                <i />
              </div>
              <span>
                {Math.floor(positionInches)}
                <small>TURNS</small>
              </span>
            </div>
            <p>
              16 clicks <span>per revolution</span>
            </p>
          </div>
        </div>

        <div
          className="ruler-scale-housing"
          role="img"
          aria-label={`Ruler cursor at ${positionInches.toFixed(4)} inches`}
        >
          <span className="ruler-housing-screw ruler-housing-screw-left" />
          <span className="ruler-housing-screw ruler-housing-screw-right" />
          <div className="ruler-scale-window" aria-hidden="true">
            <div
              className="ruler-scale-track"
              style={{
                width: RULER_LENGTH_INCHES * PIXELS_PER_INCH + 160,
                transform: `translateX(${-viewportOffsetPx - 80}px)`,
              }}
            >
              <span className="ruler-scale-engraving">
                SMARTKNOB · INCHES · 1/16
              </span>
              {rulerMarks.map((mark) => (
                <span
                  key={mark.positionInches}
                  className={`ruler-scale-tick ruler-scale-tick-${mark.kind} ${Math.round(mark.positionInches * SIXTEENTHS_PER_INCH) === nearestSixteenth ? "is-current" : ""}`}
                  style={{ left: mark.positionInches * PIXELS_PER_INCH + 80 }}
                >
                  {mark.kind === "inch" ? <em>{mark.positionInches}</em> : null}
                </span>
              ))}
            </div>
            <div className="ruler-reading-window">
              <span />
              <i key={nearestSixteenth} className="ruler-mark-flash" />
            </div>
          </div>
          <div className="ruler-scale-caption">
            <span>IMPERIAL / 12 IN</span>
            <span>READ AT THE LINE</span>
            <span>1 TURN = 1 IN</span>
          </div>
        </div>

        <div className="ruler-travel-panel">
          <div className="ruler-travel-label">
            <label htmlFor="ruler-position-control">
              {props.isConnected ? "Measured travel" : "Slide to explore"}
            </label>
            <span>{positionInches.toFixed(2)} / 12 in</span>
          </div>
          <input
            id="ruler-position-control"
            className="ruler-position-slider"
            type="range"
            min="0"
            max={RULER_LENGTH_INCHES}
            step={1 / SIXTEENTHS_PER_INCH}
            value={positionInches}
            disabled={props.isConnected}
            aria-valuetext={`${positionInches.toFixed(4)} inches`}
            onChange={(event) => setPositionInches(Number(event.target.value))}
          />
          <div className="ruler-overview-numbers" aria-hidden="true">
            {Array.from({ length: 13 }, (_, inch) => (
              <span key={inch}>{inch}</span>
            ))}
          </div>
          <div className="ruler-manual-controls">
            <p>
              {props.isConnected ? (
                "Turn your knob to move the scale."
              ) : (
                <>
                  <kbd>←</kbd>
                  <kbd>→</kbd> Move one sixteenth at a time
                </>
              )}
            </p>
            <div>
              <button
                type="button"
                disabled={props.isConnected || positionInches <= 0}
                aria-label="Decrease by one sixteenth inch"
                onClick={() =>
                  moveStandInRulerByInches(-1 / SIXTEENTHS_PER_INCH)
                }
              >
                − <span>1/16</span>
              </button>
              <button
                type="button"
                disabled={
                  props.isConnected || positionInches >= RULER_LENGTH_INCHES
                }
                aria-label="Increase by one sixteenth inch"
                onClick={() =>
                  moveStandInRulerByInches(1 / SIXTEENTHS_PER_INCH)
                }
              >
                + <span>1/16</span>
              </button>
              <button
                type="button"
                className="ruler-reset"
                disabled={props.isConnected || positionInches === 0}
                onClick={() => setPositionInches(0)}
              >
                Return to zero ↺
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="ruler-detail-grid">
        <section
          className="ruler-feel-panel"
          aria-labelledby="ruler-feel-title"
        >
          <div className="ruler-panel-heading">
            <p className="ruler-kicker">AT THE CURSOR</p>
            <span>{hasLiveDetents ? "Live detents" : "Detent preview"}</span>
          </div>
          <h2 id="ruler-feel-title" key={currentMarkKind}>
            {markLabels[currentMarkKind]}
            <span>{INTENSITY_RANKS[currentIntensityIndex].label}</span>
          </h2>
          <div
            className="ruler-strength-levels"
            aria-label="Detent strength by mark"
          >
            {INTENSITY_RANKS.map((rank, index) => (
              <div
                key={rank.kind}
                className={index === currentIntensityIndex ? "is-selected" : ""}
                aria-current={
                  index === currentIntensityIndex ? "true" : undefined
                }
              >
                <span className="ruler-strength-bars" aria-hidden="true">
                  {Array.from({ length: 4 }, (_, barIndex) => (
                    <i
                      key={barIndex}
                      className={barIndex <= index ? "is-filled" : ""}
                    />
                  ))}
                </span>
                <span>{rank.label}</span>
              </div>
            ))}
          </div>
          <p className="ruler-feel-caption">Bigger marks, firmer clicks.</p>
        </section>
        <section
          className="ruler-connection-panel"
          aria-labelledby="ruler-connection-title"
        >
          <div className="ruler-panel-heading">
            <p className="ruler-kicker">FEEL IT IN YOUR HAND</p>
            <span className="ruler-experimental">Experimental</span>
          </div>
          <h2 id="ruler-connection-title">Give the scale some feel.</h2>
          <p className="ruler-operator-message" role="status">
            {operatorMessage}
          </p>
          <div className="ruler-haptic-actions">
            <button
              type="button"
              disabled={!props.isConnected}
              onClick={() => void enableRulerMotor()}
            >
              <MotorIcon className="button-icon" />
              {props.isConnected && isMotorEnabled
                ? "Motor enabled"
                : "Enable motor"}
            </button>
            <button
              type="button"
              disabled={!props.isConnected}
              onClick={() => void applyRulerDetents()}
            >
              {hasLiveDetents ? "Reapply detents" : "Apply ruler detents"} ↗
            </button>
          </div>
          <details className="ruler-haptic-details">
            <summary>How the clicks work</summary>
            <p>
              16 evenly spaced clicks per turn. The lab changes stiffness as you
              pass quarters, halves, and whole inches. These live changes are
              experimental.
            </p>
            <p>
              Current settings: {detentSettings.stiffnessPercent}% stiffness ·{" "}
              {detentSettings.dampingPercent}% damping.
            </p>
          </details>
        </section>
      </div>
      <footer className="ruler-footer">
        <span>SMALL STEPS. TANGIBLE PROGRESS.</span>
        <span>0–12 IN · 192 INTERVALS</span>
      </footer>
    </section>
  );
}
