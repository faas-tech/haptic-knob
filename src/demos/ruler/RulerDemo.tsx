import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import "./ruler.css";
import {
  applyHapticMode,
  enableKnobMotor,
  KNOB_COMMANDS,
  unwrapAngleDegrees,
  writeDetentSettings,
  type KnobCommandReply,
  type KnobStreamSample,
} from "../../sdk";
import type { RulerHeaderActionsState } from "../../ui/RulerHeaderActions";
import {
  buildRulerMarks,
  clampRulerPositionInches,
  detentGapFraction,
  detentSettingsForRulerMark,
  detentSettingsMatch,
  DISPLAY_CLICK_HOLD_GAP_FRACTION,
  HAPTIC_CLICKS_PER_REVOLUTION,
  HAPTIC_SETTLE_MS,
  hapticClickReading,
  hapticMarkKind,
  INCHES_PER_HAPTIC_CLICK,
  isInDetentValley,
  RULER_LENGTH_INCHES,
  shouldRetuneRulerDetents,
  SIXTEENTHS_PER_INCH,
  stepHapticClickIndex,
  upcomingHapticMarkKind,
  type RulerDetentSettings,
  type RulerHapticMarkKind,
} from "./rulerMarks";

const INCHES_PER_REVOLUTION = 1;
const PIXELS_PER_INCH = 224;

const INTENSITY_RANKS: { kind: RulerHapticMarkKind; label: string }[] = [
  { kind: "sixteenth", label: "1/16" },
  { kind: "eighth", label: "1/8" },
  { kind: "quarter", label: "1/4" },
  { kind: "half", label: "1/2" },
  { kind: "inch", label: "1 in" },
];

type PendingDetentWrite = {
  settings: RulerDetentSettings;
  markKind: RulerHapticMarkKind;
};

export function RulerDemo(props: {
  isConnected: boolean;
  latestStreamSample: KnobStreamSample | null;
  sendKnobCommand: (command: string) => Promise<KnobCommandReply>;
  onHeaderActionsChange: (actions: RulerHeaderActionsState | null) => void;
}) {
  const rulerMarks = useMemo(() => buildRulerMarks(), []);
  const [positionInches, setPositionInches] = useState(0);
  const [isMotorEnabled, setIsMotorEnabled] = useState(false);
  const [hasAppliedRulerDetents, setHasAppliedRulerDetents] = useState(false);
  const [appliedMarkKind, setAppliedMarkKind] =
    useState<RulerHapticMarkKind>("inch");
  const [displayClickIndex, setDisplayClickIndex] = useState(0);
  const [operatorMessage, setOperatorMessage] = useState(
    "Connect your SmartKnob, then enable the motor in the top bar.",
  );
  const unwrappedDegreesRef = useRef<number | null>(null);
  const originDegreesRef = useRef<number | null>(null);
  const appliedDetentSettingsRef = useRef<RulerDetentSettings | null>(null);
  const detentWriteInFlightRef = useRef(false);
  const pendingDetentWriteRef = useRef<PendingDetentWrite | null>(null);
  const ignoreStreamUntilMsRef = useRef(0);
  const analogPositionInchesRef = useRef(0);
  const displayClickIndexRef = useRef(0);
  const lastHapticClickIndexRef = useRef<number | null>(null);
  const enableRulerMotorRef = useRef<() => Promise<void>>(async () => {});

  const beginHapticSettle = () => {
    ignoreStreamUntilMsRef.current = performance.now() + HAPTIC_SETTLE_MS;
  };

  const writeUpcomingDetentSettings = (pendingWrite: PendingDetentWrite) => {
    if (
      appliedDetentSettingsRef.current &&
      detentSettingsMatch(appliedDetentSettingsRef.current, pendingWrite.settings)
    ) {
      return;
    }
    if (detentWriteInFlightRef.current) {
      pendingDetentWriteRef.current = pendingWrite;
      return;
    }
    detentWriteInFlightRef.current = true;
    appliedDetentSettingsRef.current = pendingWrite.settings;
    beginHapticSettle();
    void writeDetentSettings(props.sendKnobCommand, {
      detentCount: HAPTIC_CLICKS_PER_REVOLUTION,
      stiffnessPercent: pendingWrite.settings.stiffnessPercent,
      dampingPercent: pendingWrite.settings.dampingPercent,
    }).then(() => {
      detentWriteInFlightRef.current = false;
      setAppliedMarkKind(pendingWrite.markKind);
      const queuedWrite = pendingDetentWriteRef.current;
      pendingDetentWriteRef.current = null;
      if (queuedWrite) {
        writeUpcomingDetentSettings(queuedWrite);
      }
    });
  };

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

    const isHapticSettling =
      performance.now() < ignoreStreamUntilMsRef.current;
    const travelInchesPerSecond =
      (props.latestStreamSample.velocityDegreesPerSecond / 360) *
      INCHES_PER_REVOLUTION;
    const nextPositionInches = clampRulerPositionInches(
      ((unwrappedDegreesRef.current - originDegreesRef.current) / 360) *
        INCHES_PER_REVOLUTION,
    );

    analogPositionInchesRef.current = nextPositionInches;
    lastHapticClickIndexRef.current = stepHapticClickIndex({
      positionInches: nextPositionInches,
      lastClickIndex: lastHapticClickIndexRef.current,
    });
    const nextDisplayClickIndex = stepHapticClickIndex({
      positionInches: nextPositionInches,
      lastClickIndex: displayClickIndexRef.current,
      holdGapFraction: DISPLAY_CLICK_HOLD_GAP_FRACTION,
    });
    if (nextDisplayClickIndex !== displayClickIndexRef.current) {
      displayClickIndexRef.current = nextDisplayClickIndex;
      setDisplayClickIndex(nextDisplayClickIndex);
      setPositionInches(nextDisplayClickIndex * INCHES_PER_HAPTIC_CLICK);
    }

    if (!props.isConnected || !hasAppliedRulerDetents || isHapticSettling) {
      return;
    }
    if (
      !shouldRetuneRulerDetents({
        positionInches: nextPositionInches,
        travelInchesPerSecond,
        isHapticSettling: false,
      })
    ) {
      return;
    }
    const upcomingMarkKind = upcomingHapticMarkKind({
      positionInches: nextPositionInches,
      travelInchesPerSecond,
    });
    writeUpcomingDetentSettings({
      settings: detentSettingsForRulerMark(upcomingMarkKind),
      markKind: upcomingMarkKind,
    });
  }, [
    hasAppliedRulerDetents,
    props.isConnected,
    props.latestStreamSample,
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
    if (!motorCommandReply.confirmed) {
      setOperatorMessage(
        `Motor did not confirm: ${motorCommandReply.error?.message ?? identifyReply.replyBody ?? "no reply"}`,
      );
      return;
    }
    const streamReply = await props.sendKnobCommand(
      KNOB_COMMANDS.startPositionStream50,
    );
    if (!streamReply.confirmed) {
      setOperatorMessage(
        `Position stream did not confirm: ${streamReply.error?.message ?? "no reply"}`,
      );
      return;
    }
    unwrappedDegreesRef.current = null;
    originDegreesRef.current = null;
    lastHapticClickIndexRef.current = null;
    analogPositionInchesRef.current = 0;
    displayClickIndexRef.current = 0;
    setDisplayClickIndex(0);
    setPositionInches(0);
    await applyRulerDetents();
  };

  const applyRulerDetents = async () => {
    if (props.isConnected) {
      await props.sendKnobCommand(KNOB_COMMANDS.startPositionStream50);
    }
    const detentSettingsForMark = detentSettingsForRulerMark(
      hapticMarkKind(positionInches),
    );
    const detentCommandReply = await applyHapticMode(
      props.sendKnobCommand,
      "detent",
      {
        detentCount: HAPTIC_CLICKS_PER_REVOLUTION,
        stiffnessPercent: detentSettingsForMark.stiffnessPercent,
        dampingPercent: detentSettingsForMark.dampingPercent,
      },
    );
    setHasAppliedRulerDetents(detentCommandReply.confirmed);
    if (detentCommandReply.confirmed) {
      appliedDetentSettingsRef.current = detentSettingsForMark;
      setAppliedMarkKind(hapticMarkKind(positionInches));
      beginHapticSettle();
    }
    setOperatorMessage(
      detentCommandReply.confirmed
        ? "16 clicks per turn. 1/16 is a tap. Each inch is a stop."
        : `Detent mode did not confirm: ${detentCommandReply.error?.message ?? "no reply"}`,
    );
  };

  enableRulerMotorRef.current = enableRulerMotor;

  useLayoutEffect(() => {
    props.onHeaderActionsChange({
      isConnected: props.isConnected,
      isMotorEnabled,
      onEnableMotor: () => {
        void enableRulerMotorRef.current();
      },
    });
    return () => props.onHeaderActionsChange(null);
  }, [props.isConnected, isMotorEnabled]);

  useEffect(() => {
    if (props.isConnected) {
      return;
    }
    const nextDisplayClickIndex = stepHapticClickIndex({
      positionInches,
      lastClickIndex: displayClickIndexRef.current,
      holdGapFraction: DISPLAY_CLICK_HOLD_GAP_FRACTION,
    });
    if (nextDisplayClickIndex !== displayClickIndexRef.current) {
      displayClickIndexRef.current = nextDisplayClickIndex;
      setDisplayClickIndex(nextDisplayClickIndex);
    }
  }, [positionInches, props.isConnected]);

  const hasLiveDetents = props.isConnected && hasAppliedRulerDetents;
  const analogPositionInches = props.isConnected
    ? analogPositionInchesRef.current
    : positionInches;
  const clickReading = hapticClickReading(displayClickIndex);
  const displayedMarkKind = hapticMarkKind(clickReading.positionInches);
  const currentIntensityIndex = INTENSITY_RANKS.findIndex(
    (rank) => rank.kind === displayedMarkKind,
  );
  const detentSettings = detentSettingsForRulerMark(
    hasLiveDetents ? appliedMarkKind : displayedMarkKind,
  );
  const viewportOffsetPx = clickReading.positionInches * PIXELS_PER_INCH;
  const travelPercent =
    (clickReading.positionInches / RULER_LENGTH_INCHES) * 100;
  const gapFraction = detentGapFraction(analogPositionInches);
  const travelInchesPerSecond = props.latestStreamSample
    ? (props.latestStreamSample.velocityDegreesPerSecond / 360) *
      INCHES_PER_REVOLUTION
    : 0;
  const markLabels: Record<RulerHapticMarkKind, string> = {
    inch: "Whole inch",
    half: "Half inch",
    quarter: "Quarter inch",
    eighth: "Eighth inch",
    sixteenth: "Sixteenth inch",
  };
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
              {clickReading.displayLabel}
              <span>in</span>
            </output>
            <div className="ruler-conversions">
              <span>
                <strong>{clickReading.displayLabel}″</strong> nearest 1/16
              </span>
              <span>
                {(clickReading.positionInches * 25.4).toFixed(1)} mm
              </span>
            </div>
          </div>
          <div className="ruler-turn-display" aria-hidden="true">
            <div className="ruler-turn-dial">
              <div
                className="ruler-turn-face"
                style={{
                  transform: `rotate(${clickReading.positionInches * 360}deg)`,
                }}
              >
                <i />
              </div>
              <span>
                {clickReading.wholeInches}
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
          aria-label={`Ruler cursor at ${clickReading.displayLabel} inches`}
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
                SMARTKNOB · INCHES · 1/16 CLICKS
              </span>
              {rulerMarks.map((mark) => (
                <span
                  key={mark.positionInches}
                  className={`ruler-scale-tick ruler-scale-tick-${mark.kind} ${mark.positionInches === clickReading.positionInches ? "is-current" : ""}`}
                  style={{ left: mark.positionInches * PIXELS_PER_INCH + 80 }}
                >
                  {mark.kind === "inch" ? <em>{mark.positionInches}</em> : null}
                </span>
              ))}
            </div>
            <div className="ruler-reading-window">
              <span />
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
            <span>{clickReading.displayLabel} / 12 in</span>
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
            aria-valuetext={`${clickReading.displayLabel} inches`}
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
          <h2 id="ruler-feel-title">
            {markLabels[displayedMarkKind]}
            <span>
              {INTENSITY_RANKS[Math.max(0, currentIntensityIndex)].label}
            </span>
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
                  {Array.from({ length: 5 }, (_, barIndex) => (
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
          <p className="ruler-feel-caption">
            {hasLiveDetents
              ? "1/16 is a tap. 1/8 is light. 1/4 and 1/2 get heavier. 1 in is a stop."
              : "Bigger marks, firmer clicks."}
          </p>
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
              onClick={() => void applyRulerDetents()}
            >
              {hasLiveDetents ? "Reapply detents" : "Apply ruler detents"} ↗
            </button>
          </div>
          <details className="ruler-haptic-details">
            <summary>How the clicks work</summary>
            <p>
              16 evenly spaced clicks per turn, 22.5 degrees apart. Each click
              is 1/16 inch. Late in the gap the lab sends{" "}
              <code>detent count=16 k= b=</code> for the next mark. k is how
              hard the click pushes back. b is how quickly that push dies.
              1/16 uses k=6. 1 in uses k=92.
            </p>
            <p>
              Current settings: {detentSettings.stiffnessPercent}% stiffness ·{" "}
              {detentSettings.dampingPercent}% damping.
            </p>
            <p>
              Calibration: gap {gapFraction.toFixed(2)} ·{" "}
              {isInDetentValley(positionInches) ? "valley" : "near click"} ·
              travel {travelInchesPerSecond.toFixed(2)} in/s · next{" "}
              {upcomingHapticMarkKind({
                positionInches,
                travelInchesPerSecond,
              })}
            </p>
          </details>
        </section>
      </div>
      <footer className="ruler-footer">
        <span>SMALL STEPS. TANGIBLE PROGRESS.</span>
        <span>0–12 IN · 16 CLICKS / TURN</span>
      </footer>
    </section>
  );
}
