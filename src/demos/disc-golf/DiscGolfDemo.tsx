import { holeScoreName } from "../course-visuals/CoursePlayerInterface";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  applyHapticMode,
  enableKnobMotor,
  KNOB_COMMANDS,
  unwrapAngleDegrees,
  type KnobCommandReply,
  type KnobStreamSample,
} from "../../sdk";
import type { DiscGolfHeaderActionsState } from "../../ui/DiscGolfHeaderActions";
import {
  DiscGolfCourseMap,
  type DiscGolfCameraMode,
} from "./DiscGolfCourseMap";
import { DiscGolfHoleIntro } from "./DiscGolfHoleIntro";
import { DiscGolfNameScreen } from "./DiscGolfNameScreen";
import {
  DiscGolfPlayerDashboard,
  type DiscGolfPlayMode,
  type DiscGolfThrowBanner,
} from "./DiscGolfPlayerDashboard";
import { DiscGolfRoundResults } from "./DiscGolfRoundResults";
import {
  discAfterDetentSteps,
  discById,
  nextDiscId,
  previousDiscId,
  type DiscId,
} from "./discGolfDiscs";
import {
  courseHoleByNumber,
  headingDegreesToBasket,
  NINE_HOLE_COURSE,
  surfaceAtPosition,
  type CoursePointYards,
} from "./discGolfCourse";
import {
  readDiscGolfLeaderboard,
  writeDiscGolfLeaderboardEntry,
  type DiscGolfLeaderboardEntry,
} from "./discGolfLeaderboard";
import {
  clampPower,
  hyzerLabel,
  liePowerLabel,
  playDiscThrow,
  previewThrowFlight,
  throwFromKnobDelta,
  throwPowerFromHold01,
  type FlightPointYards,
} from "./discGolfThrow";
import { rollCourseWind } from "./discGolfWind";

const DIRECTION_DETENT_COUNT = 36;
const DISC_DETENT_COUNT = 16;
const DISC_DETENT_SPACING_DEGREES = 360 / DISC_DETENT_COUNT;
const HAPTIC_SETTLE_MS = 220;
const WIND_KEY_SECONDS = 1.4;
const AIM_DEGREES_PER_KNOB_DEGREE = 0.35;
const HOLE_FLYOVER_MS = 5000;
const HOLE_OUT_SINK_MS = 620;
const HOLE_OUT_HOLD_MS = 1800;

type DiscGolfRoundPhase =
  | "enter-name"
  | "hole-flyover"
  | "play"
  | "round-results";

export function DiscGolfDemo(props: {
  isConnected: boolean;
  latestStreamSample: KnobStreamSample | null;
  sendKnobCommand: (command: string) => Promise<KnobCommandReply>;
  onHeaderActionsChange: (actions: DiscGolfHeaderActionsState | null) => void;
}) {
  const [holeNumber, setHoleNumber] = useState(holeNumberFromSearch);
  const courseHole = useMemo(
    () => courseHoleByNumber(holeNumber),
    [holeNumber],
  );
  const [lie, setLie] = useState<CoursePointYards>(courseHole.tee);
  const [lastSafeLie, setLastSafeLie] = useState<CoursePointYards>(
    courseHole.tee,
  );
  const [headingDegrees, setHeadingDegrees] = useState(() =>
    headingDegreesToBasket(courseHole.tee, courseHole.basket),
  );
  const [selectedDiscId, setSelectedDiscId] = useState<DiscId>("standard");
  const [throwPower, setThrowPower] = useState(0);
  const [throwHyzer01, setThrowHyzer01] = useState(0);
  const [windAimSide, setWindAimSide] = useState<
    "hyzer" | "anhyzer" | "flat" | null
  >(null);
  const [playMode, setPlayMode] = useState<DiscGolfPlayMode>("direction");
  const [courseWind, setCourseWind] = useState(rollCourseWind);
  const [throwsThisHole, setThrowsThisHole] = useState(0);
  const [holeScores, setHoleScores] = useState<number[]>(openingHoleScores);
  const [isHoleComplete, setIsHoleComplete] = useState(false);
  const [isRoundComplete, setIsRoundComplete] = useState(false);
  const [isMotorEnabled, setIsMotorEnabled] = useState(false);
  const [operatorMessage, setOperatorMessage] = useState("");
  const [throwBanner, setThrowBanner] = useState<DiscGolfThrowBanner | null>(
    null,
  );
  const [isShotInFlight, setIsShotInFlight] = useState(false);
  const [displayDisc, setDisplayDisc] = useState<FlightPointYards>({
    ...courseHole.tee,
    heightYards: 0.12,
  });
  const [discSink01, setDiscSink01] = useState(0);
  const [madeCallout, setMadeCallout] = useState<string | null>(null);
  const [roundPhase, setRoundPhase] =
    useState<DiscGolfRoundPhase>(openingRoundPhase);
  const [playerName, setPlayerName] = useState(openingPlayerName);
  const [flyoverProgress01, setFlyoverProgress01] = useState(0);
  const [flyoverGeneration, setFlyoverGeneration] = useState(0);
  const [waterPenaltyCount, setWaterPenaltyCount] = useState(0);
  const [treeHitCount, setTreeHitCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState<DiscGolfLeaderboardEntry[]>(
    readDiscGolfLeaderboard,
  );
  const [currentCardFinishedAt, setCurrentCardFinishedAt] = useState<
    string | null
  >(null);

  const canPlay = roundPhase === "play" && !isHoleComplete && !isRoundComplete;
  const cameraMode = cameraModeForPhase(roundPhase);
  const lieSurface = surfaceAtPosition(courseHole, lie);
  const selectedDisc = discById(selectedDiscId);
  const totalThrows =
    holeScores.reduce((sum, score) => sum + score, 0) +
    (isHoleComplete ? 0 : throwsThisHole);
  const scoreVsPar = holeScores.reduce((sum, throws, index) => {
    return sum + throws - NINE_HOLE_COURSE[index].par;
  }, 0);
  const visibleAimSide = visibleAimSideForThrow(
    throwPower,
    throwHyzer01,
    windAimSide,
  );
  const hyzerAimPath = useMemo(
    () =>
      previewThrowFlight({
        courseHole,
        disc: selectedDisc,
        lie,
        headingDegrees,
        power: 1,
        hyzer01: -0.85,
        courseWind,
      }),
    [courseHole, selectedDisc, lie, headingDegrees, courseWind],
  );
  const anhyzerAimPath = useMemo(
    () =>
      previewThrowFlight({
        courseHole,
        disc: selectedDisc,
        lie,
        headingDegrees,
        power: 1,
        hyzer01: 0.85,
        courseWind,
      }),
    [courseHole, selectedDisc, lie, headingDegrees, courseWind],
  );

  const unwrappedDegreesRef = useRef<number | null>(null);
  const addressDegreesRef = useRef<number | null>(null);
  const headingAtAimStartRef = useRef(headingDegrees);
  const headingDegreesRef = useRef(headingDegrees);
  headingDegreesRef.current = headingDegrees;
  const selectedDiscIdRef = useRef(selectedDiscId);
  selectedDiscIdRef.current = selectedDiscId;
  const discAtSelectStartRef = useRef<DiscId>(selectedDiscId);
  const ignoreKnobInputUntilMsRef = useRef(0);
  const peakThrowRef = useRef(0);
  const peakHyzerRef = useRef(0);
  const lastDeltaRef = useRef(0);
  const appliedFeelRef = useRef<string | null>(null);
  const isAnimatingThrowRef = useRef(false);
  const shotAnimationFrameRef = useRef(0);
  const keyboardWindSideRef = useRef<"left" | "right" | "flat" | null>(null);
  const keyboardWindStartedAtRef = useRef(0);
  const playModeRef = useRef(playMode);
  playModeRef.current = playMode;
  const throwPowerRef = useRef(throwPower);
  throwPowerRef.current = throwPower;
  const enableMotorRef = useRef<() => Promise<void>>(async () => {});
  const hitThrowRef = useRef<(power: number, hyzer01: number) => void>(
    () => {},
  );
  const hasSavedRoundRef = useRef(false);
  const holeOutTimerRef = useRef<number | null>(null);

  const resetHole = (nextHoleNumber: number) => {
    window.cancelAnimationFrame(shotAnimationFrameRef.current);
    if (holeOutTimerRef.current != null)
      window.clearTimeout(holeOutTimerRef.current);
    isAnimatingThrowRef.current = false;
    setIsShotInFlight(false);

    keyboardWindSideRef.current = null;
    setThrowBanner(null);
    const nextHole = courseHoleByNumber(nextHoleNumber);
    setHoleNumber(nextHoleNumber);
    setLie(nextHole.tee);
    setLastSafeLie(nextHole.tee);
    setDisplayDisc({ ...nextHole.tee, heightYards: 0.12 });
    setDiscSink01(0);
    setMadeCallout(null);
    const pinHeadingDegrees = headingDegreesToBasket(
      nextHole.tee,
      nextHole.basket,
    );
    setHeadingDegrees(pinHeadingDegrees);
    headingAtAimStartRef.current = pinHeadingDegrees;
    setThrowPower(0);
    setThrowHyzer01(0);
    setWindAimSide(null);
    setThrowsThisHole(0);
    setIsHoleComplete(false);
    setCourseWind(rollCourseWind());
    setPlayMode("direction");
    peakThrowRef.current = 0;
    peakHyzerRef.current = 0;
    addressDegreesRef.current = null;
    appliedFeelRef.current = null;
  };

  const beginHole = (nextHoleNumber: number) => {
    resetHole(nextHoleNumber);
    setFlyoverProgress01(0);
    setFlyoverGeneration((current) => current + 1);
    setRoundPhase("hole-flyover");
    setOperatorMessage("");
  };

  const startRound = (nextPlayerName: string) => {
    setPlayerName(nextPlayerName);
    setHoleScores([]);
    setWaterPenaltyCount(0);
    setTreeHitCount(0);
    setIsRoundComplete(false);
    setCurrentCardFinishedAt(null);
    hasSavedRoundRef.current = false;
    beginHole(holeNumberFromSearch());
  };

  const returnToNameScreen = () => {
    setRoundPhase("enter-name");
    setIsHoleComplete(false);
    setIsRoundComplete(false);
    setThrowBanner(null);
    setOperatorMessage("");
    setLeaderboard(readDiscGolfLeaderboard());
  };

  const finishRound = (
    nextScores: number[],
    nextWaterPenaltyCount: number,
    nextTreeHitCount: number,
  ) => {
    if (hasSavedRoundRef.current) {
      return;
    }
    hasSavedRoundRef.current = true;
    const finishedAt = new Date().toISOString();
    const totalThrowsForCard = nextScores.reduce(
      (sum, throws) => sum + throws,
      0,
    );
    const scoreVsParForCard = nextScores.reduce(
      (sum, throws, index) => sum + throws - NINE_HOLE_COURSE[index].par,
      0,
    );
    const saved = writeDiscGolfLeaderboardEntry({
      playerName,
      totalThrows: totalThrowsForCard,
      scoreVsPar: scoreVsParForCard,
      holeScores: nextScores,
      waterPenaltyCount: nextWaterPenaltyCount,
      treeHitCount: nextTreeHitCount,
      finishedAt,
    });
    setCurrentCardFinishedAt(finishedAt);
    setLeaderboard(saved);
    holeOutTimerRef.current = window.setTimeout(() => {
      setMadeCallout(null);
      setRoundPhase("round-results");
    }, HOLE_OUT_HOLD_MS);
  };

  const animateThrowPath = (
    path: FlightPointYards[],
    onFinished: () => void,
  ) => {
    isAnimatingThrowRef.current = true;
    setIsShotInFlight(true);
    const startedAt = performance.now();
    const durationMs = Math.min(3200, 1400 + path.length * 25);
    const step = (now: number) => {
      const t = Math.min(1, (now - startedAt) / durationMs);
      const ease = 1 - (1 - t) ** 2;
      setDisplayDisc(pointAlongFlightPath(path, ease));
      if (t < 1) {
        shotAnimationFrameRef.current = window.requestAnimationFrame(step);
        return;
      }
      setDisplayDisc(path[path.length - 1]);
      setIsShotInFlight(false);
      onFinished();
    };
    shotAnimationFrameRef.current = window.requestAnimationFrame(step);
  };

  const animateDiscSink = (onFinished: () => void) => {
    const startedAt = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - startedAt) / HOLE_OUT_SINK_MS);
      setDiscSink01(t * t);
      if (t < 1) {
        shotAnimationFrameRef.current = window.requestAnimationFrame(step);
        return;
      }
      setDiscSink01(1);
      onFinished();
    };
    shotAnimationFrameRef.current = window.requestAnimationFrame(step);
  };

  const hitThrow = (power: number, hyzer01: number) => {
    if (!canPlay || isAnimatingThrowRef.current) {
      return;
    }
    const throwStrength = clampPower(power);
    if (throwStrength < 0.04) {
      setOperatorMessage("Wind left or right, then release.");
      return;
    }

    setThrowBanner(null);
    const shot = playDiscThrow({
      courseHole,
      disc: selectedDisc,
      lie,
      lastSafeLie,
      headingDegrees,
      power: throwStrength,
      hyzer01,
      courseWind,
    });
    const nextThrows = throwsThisHole + 1 + (shot.tookWaterPenalty ? 1 : 0);
    setThrowsThisHole(nextThrows);
    setThrowPower(0);
    setThrowHyzer01(0);
    setWindAimSide(null);
    peakThrowRef.current = 0;
    peakHyzerRef.current = 0;
    addressDegreesRef.current = null;

    setLie(shot.rest);
    if (!shot.tookWaterPenalty) {
      setLastSafeLie(shot.rest);
    }
    if (shot.tookWaterPenalty) {
      setWaterPenaltyCount((current) => current + 1);
    }
    if (shot.hitTree) {
      setTreeHitCount((current) => current + 1);
    }

    const afterThrowSettles = () => {
      if (!shot.isInBasket) {
        setThrowBanner({
          bannerKey: Date.now(),
          powerPercent: Math.round(throwStrength * 100),
          travelYards: Math.round(shot.travelYards),
          hyzerLabel: hyzerLabel(hyzer01),
        });
      }

      if (shot.isInBasket) {
        setDisplayDisc({ ...courseHole.basket, heightYards: 4.2 });
        animateDiscSink(() => {
          const nextScores = [...holeScores, nextThrows];
          setHoleScores(nextScores);
          setIsHoleComplete(true);
          setMadeCallout(
            nextThrows === 1
              ? "Ace!"
              : holeScoreName(nextThrows, courseHole.par),
          );
          setOperatorMessage("");
          if (holeOutTimerRef.current != null) {
            window.clearTimeout(holeOutTimerRef.current);
          }
          holeOutTimerRef.current = window.setTimeout(() => {
            isAnimatingThrowRef.current = false;
            if (holeNumber === 9) {
              setIsRoundComplete(true);
              finishRound(
                nextScores,
                waterPenaltyCount + (shot.tookWaterPenalty ? 1 : 0),
                treeHitCount + (shot.hitTree ? 1 : 0),
              );
              return;
            }
            beginHole(holeNumber + 1);
          }, HOLE_OUT_HOLD_MS);
        });
        return;
      }

      setDisplayDisc({ ...shot.rest, heightYards: 0.12 });
      isAnimatingThrowRef.current = false;
      const pinHeadingDegrees = headingDegreesToBasket(
        shot.rest,
        courseHole.basket,
      );
      setHeadingDegrees(pinHeadingDegrees);
      headingAtAimStartRef.current = pinHeadingDegrees;
      setPlayMode("direction");
      void applyFeelForPlayMode("direction");
      if (shot.tookWaterPenalty) {
        setOperatorMessage(
          "Water. One penalty throw. Disc is back on the last dry lie.",
        );
        return;
      }
      if (shot.hitTree) {
        setOperatorMessage("Tree. Disc is at the base. Turn and punch out.");
        return;
      }
      setOperatorMessage(
        `${selectedDisc.name} · ${liePowerLabel(shot.surfaceAtRest)}. Aim, then Throw.`,
      );
    };

    animateThrowPath(
      shot.displayPath.length > 1
        ? shot.displayPath
        : [
            { ...lie, heightYards: 0.12 },
            { ...shot.rest, heightYards: 0.08 },
          ],
      afterThrowSettles,
    );
  };

  const beginHapticSettle = () => {
    ignoreKnobInputUntilMsRef.current = performance.now() + HAPTIC_SETTLE_MS;
    addressDegreesRef.current = null;
    lastDeltaRef.current = 0;
    peakThrowRef.current = 0;
    peakHyzerRef.current = 0;
    setThrowPower(0);
    setThrowHyzer01(0);
  };

  const applyFeelForPlayMode = async (
    nextMode: DiscGolfPlayMode,
    options?: { forceWrite?: boolean },
  ) => {
    if (!props.isConnected || !isMotorEnabled) {
      return;
    }
    const feelKey =
      nextMode === "direction"
        ? "direction-detent"
        : nextMode === "disc"
          ? "disc-detent"
          : "throw-spring";
    if (!options?.forceWrite && appliedFeelRef.current === feelKey) {
      return;
    }
    discAtSelectStartRef.current = selectedDiscIdRef.current;
    const feelReply =
      nextMode === "direction"
        ? await applyHapticMode(props.sendKnobCommand, "detent", {
            detentCount: DIRECTION_DETENT_COUNT,
            stiffnessPercent: 22,
            dampingPercent: 14,
          })
        : nextMode === "disc"
          ? await applyHapticMode(props.sendKnobCommand, "detent", {
              detentCount: DISC_DETENT_COUNT,
              stiffnessPercent: 28,
              dampingPercent: 16,
            })
          : await applyHapticMode(props.sendKnobCommand, "spring", {
              stiffnessPercent: 34,
              dampingPercent: 28,
            });
    if (!feelReply.confirmed) {
      setOperatorMessage(
        `Feel did not confirm: ${feelReply.error?.message ?? "no reply"}`,
      );
      return;
    }
    appliedFeelRef.current = feelKey;
    beginHapticSettle();
  };

  const selectPlayMode = (nextMode: DiscGolfPlayMode) => {
    if (isAnimatingThrowRef.current) return;
    if (nextMode === playModeRef.current) {
      if (nextMode === "direction") {
        void applyFeelForPlayMode("direction", { forceWrite: true });
      }
      return;
    }
    if (nextMode === "direction") {
      headingAtAimStartRef.current = headingDegreesRef.current;
    }
    setPlayMode(nextMode);
    discAtSelectStartRef.current = selectedDiscIdRef.current;
    peakThrowRef.current = 0;
    peakHyzerRef.current = 0;
    setThrowPower(0);
    setThrowHyzer01(0);
    setWindAimSide(null);
    void applyFeelForPlayMode(nextMode);
    setOperatorMessage(
      nextMode === "direction"
        ? "Fine detents aim at the basket."
        : nextMode === "disc"
          ? "Turn either way to change discs."
          : "Left winds hyzer. Right winds anhyzer. Let the spring back to throw.",
    );
  };

  const enableDiscGolfMotor = async () => {
    await props.sendKnobCommand(KNOB_COMMANDS.identify);
    const motorCommandReply = await enableKnobMotor(props.sendKnobCommand);
    if (!motorCommandReply.confirmed) {
      setOperatorMessage(
        `Motor did not confirm: ${motorCommandReply.error?.message ?? "no reply"}`,
      );
      return;
    }
    await props.sendKnobCommand(KNOB_COMMANDS.startPositionStream50);
    setIsMotorEnabled(true);
    appliedFeelRef.current = null;
    await applyFeelForPlayMode(playModeRef.current);
    setOperatorMessage(
      "Motor on. A aims. C turns through discs. S winds a hyzer or anhyzer.",
    );
  };

  useEffect(() => {
    if (roundPhase !== "hole-flyover") {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRoundPhase("play");
      return;
    }
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress01 = Math.min(1, (now - startedAt) / HOLE_FLYOVER_MS);
      setFlyoverProgress01(progress01);
      if (progress01 >= 1) {
        setRoundPhase("play");
        return;
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [roundPhase, flyoverGeneration]);

  useEffect(() => {
    if (roundPhase !== "play" || !isMotorEnabled) {
      return;
    }
    void applyFeelForPlayMode(playModeRef.current);
  }, [roundPhase, holeNumber, isMotorEnabled]);

  useEffect(() => {
    const cancelCharge = () => {
      keyboardWindSideRef.current = null;
      peakThrowRef.current = 0;
      setThrowPower(0);
      setThrowHyzer01(0);
      setWindAimSide(null);
    };
    window.addEventListener("blur", cancelCharge);
    return () => {
      window.removeEventListener("blur", cancelCharge);
      window.cancelAnimationFrame(shotAnimationFrameRef.current);
      if (holeOutTimerRef.current != null)
        window.clearTimeout(holeOutTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (
      !canPlay ||
      !props.latestStreamSample ||
      !isMotorEnabled ||
      isAnimatingThrowRef.current
    ) {
      return;
    }

    unwrappedDegreesRef.current = unwrapAngleDegrees(
      unwrappedDegreesRef.current,
      props.latestStreamSample.positionDegrees,
    );
    if (performance.now() < ignoreKnobInputUntilMsRef.current) {
      return;
    }
    if (keyboardWindSideRef.current) {
      return;
    }
    if (addressDegreesRef.current == null) {
      addressDegreesRef.current = unwrappedDegreesRef.current;
    }

    const deltaDegrees =
      unwrappedDegreesRef.current - addressDegreesRef.current;

    if (playModeRef.current === "direction") {
      lastDeltaRef.current = deltaDegrees;
      setHeadingDegrees(
        headingAtAimStartRef.current +
          deltaDegrees * AIM_DEGREES_PER_KNOB_DEGREE,
      );
      return;
    }

    if (playModeRef.current === "disc") {
      lastDeltaRef.current = deltaDegrees;
      const detentSteps = Math.round(
        deltaDegrees / DISC_DETENT_SPACING_DEGREES,
      );
      setSelectedDiscId(
        discAfterDetentSteps(discAtSelectStartRef.current, detentSteps),
      );
      return;
    }

    const returningTowardAddress =
      Math.abs(deltaDegrees) < Math.abs(lastDeltaRef.current) - 2;
    lastDeltaRef.current = deltaDegrees;

    const nextThrow = throwFromKnobDelta(deltaDegrees);
    peakThrowRef.current = Math.max(peakThrowRef.current, nextThrow.power);
    if (nextThrow.power > 0.04) {
      peakHyzerRef.current = nextThrow.hyzer01;
    }
    setThrowPower(nextThrow.power);
    setThrowHyzer01(nextThrow.hyzer01);
    if (returningTowardAddress && peakThrowRef.current > 0.08) {
      const power = peakThrowRef.current;
      const hyzer01 = peakHyzerRef.current;
      peakThrowRef.current = 0;
      peakHyzerRef.current = 0;
      hitThrow(power, hyzer01);
    }
  }, [props.latestStreamSample, isMotorEnabled, isHoleComplete]);

  const beginKeyboardWind = (side: "left" | "right" | "flat") => {
    if (keyboardWindSideRef.current) {
      return;
    }
    if (playModeRef.current !== "throw") {
      selectPlayMode("throw");
    }
    keyboardWindSideRef.current = side;
    keyboardWindStartedAtRef.current = performance.now();
    peakThrowRef.current = 0;
    setWindAimSide(
      side === "left" ? "hyzer" : side === "right" ? "anhyzer" : "flat",
    );
    setThrowHyzer01(hyzer01ForWindSide(side, 0));
  };

  const releaseKeyboardWind = () => {
    const side = keyboardWindSideRef.current;
    keyboardWindSideRef.current = null;
    if (roundPhase !== "play" || !side) {
      setThrowPower(0);
      setThrowHyzer01(0);
      setWindAimSide(null);
      return;
    }
    const power = peakThrowRef.current;
    const hyzer01 = hyzer01ForWindSide(side, power);
    peakThrowRef.current = 0;
    setThrowPower(0);
    setThrowHyzer01(0);
    setWindAimSide(null);
    hitThrow(power, hyzer01);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) {
        return;
      }
      if (roundPhase !== "play" || isAnimatingThrowRef.current) {
        return;
      }
      if (event.key === "a" || event.key === "A") {
        selectPlayMode("direction");
      } else if (event.key === "c" || event.key === "C") {
        selectPlayMode("disc");
      } else if (event.key === "s" || event.key === "S") {
        selectPlayMode("throw");
      } else if (event.key === "[") {
        setSelectedDiscId((current) => previousDiscId(current));
      } else if (event.key === "]") {
        setSelectedDiscId((current) => nextDiscId(current));
      } else if (event.key === "1") {
        setSelectedDiscId("long-shot");
      } else if (event.key === "2") {
        setSelectedDiscId("standard");
      } else if (event.key === "3") {
        setSelectedDiscId("target");
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (playModeRef.current === "throw") {
          beginKeyboardWind("left");
        } else {
          setHeadingDegrees((current) => current - 2);
        }
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        if (playModeRef.current === "throw") {
          beginKeyboardWind("right");
        } else {
          setHeadingDegrees((current) => current + 2);
        }
      } else if ((event.key === "z" || event.key === "Z") && !event.repeat) {
        event.preventDefault();
        beginKeyboardWind("left");
      } else if ((event.key === "x" || event.key === "X") && !event.repeat) {
        event.preventDefault();
        beginKeyboardWind("right");
      } else if (event.key === " " && !event.repeat) {
        event.preventDefault();
        if (playModeRef.current !== "throw") {
          selectPlayMode("throw");
        }
        beginKeyboardWind("flat");
      } else if (event.key === "r" || event.key === "R") {
        resetHole(holeNumber);
        void applyFeelForPlayMode("direction");
        setOperatorMessage(`Hole ${holeNumber} reset. New wind.`);
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const releasedSide = keyboardWindSideFromKey(event.key);
      if (!releasedSide || keyboardWindSideRef.current !== releasedSide) {
        return;
      }
      event.preventDefault();
      releaseKeyboardWind();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [
    holeNumber,
    isHoleComplete,
    isRoundComplete,
    roundPhase,
    courseHole,
    lie,
    selectedDisc,
    headingDegrees,
    lastSafeLie,
    courseWind,
    isMotorEnabled,
  ]);

  useEffect(() => {
    let frame = 0;
    const tick = (now: number) => {
      const windSide = keyboardWindSideRef.current;
      if (windSide) {
        const heldSeconds = (now - keyboardWindStartedAtRef.current) / 1000;
        const power = throwPowerFromHold01(heldSeconds / WIND_KEY_SECONDS);
        peakThrowRef.current = power;
        setThrowPower(power);
        setThrowHyzer01(hyzer01ForWindSide(windSide, power));
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!throwBanner) {
      return;
    }
    const hideBannerAt = window.setTimeout(() => {
      setThrowBanner(null);
    }, 3200);
    return () => window.clearTimeout(hideBannerAt);
  }, [throwBanner]);

  enableMotorRef.current = enableDiscGolfMotor;
  hitThrowRef.current = hitThrow;

  useLayoutEffect(() => {
    props.onHeaderActionsChange({
      isConnected: props.isConnected,
      isMotorEnabled,
      canThrow: canPlay && !isShotInFlight,
      onEnableMotor: () => {
        void enableMotorRef.current();
      },
      onThrowPractice: () => {
        hitThrowRef.current(Math.max(throwPowerRef.current, 0.55), 0);
      },
    });
    return () => props.onHeaderActionsChange(null);
  }, [props.isConnected, isMotorEnabled, canPlay, isShotInFlight]);

  return (
    <section className="golf-demo disc-golf-demo">
      <DiscGolfCourseMap
        courseHole={courseHole}
        disc={displayDisc}
        discHeightYards={displayDisc.heightYards}
        hyzerAimPath={hyzerAimPath}
        anhyzerAimPath={anhyzerAimPath}
        visibleAimSide={visibleAimSide}
        aimHeadingDegrees={headingDegrees}
        discSink01={discSink01}
        cameraMode={cameraMode}
        flyoverProgress01={flyoverProgress01}
        isShotInFlight={isShotInFlight}
      />
      {roundPhase === "play" ? (
        <DiscGolfPlayerDashboard
          playerName={playerName}
          courseHole={courseHole}
          playMode={playMode}
          selectedDiscId={selectedDisc.id}
          throwPower={throwPower}
          throwHyzer01={throwHyzer01}
          courseWind={courseWind}
          throwsThisHole={throwsThisHole}
          yardsToBasket={Math.hypot(
            courseHole.basket.xYards - displayDisc.xYards,
            courseHole.basket.yYards - displayDisc.yYards,
          )}
          scoreVsPar={scoreVsPar}
          totalThrows={totalThrows}
          completedHoleCount={holeScores.length}
          operatorMessage={operatorMessage}
          lieLabel={liePowerLabel(lieSurface)}
          throwBanner={throwBanner}
          position={displayDisc}
          headingDegrees={headingDegrees}
          isInFlight={isShotInFlight}
          isComplete={isHoleComplete || discSink01 > 0}
          onPreviousEquipment={() =>
            setSelectedDiscId((current) => previousDiscId(current))
          }
          onNextEquipment={() =>
            setSelectedDiscId((current) => nextDiscId(current))
          }
          onAimLeft={() => setHeadingDegrees((current) => current - 2)}
          onAimRight={() => setHeadingDegrees((current) => current + 2)}
          onCharge={() => {
            if (!canPlay || isAnimatingThrowRef.current) return;
            selectPlayMode("throw");
            beginKeyboardWind("flat");
          }}
          onRelease={releaseKeyboardWind}
          onCancelCharge={() => {
            keyboardWindSideRef.current = null;
            peakThrowRef.current = 0;
            setThrowPower(0);
            setThrowHyzer01(0);
            setWindAimSide(null);
          }}
          onSelectDirectionMode={() => selectPlayMode("direction")}
          onSelectDiscMode={() => selectPlayMode("disc")}
          onSelectThrowMode={() => selectPlayMode("throw")}
        />
      ) : null}
      {madeCallout ? (
        <div className="golf-made-callout" role="status">
          <p className="course-eyebrow">IN THE BASKET</p>
          <div className="course-celebration-seal" aria-hidden="true">
            ✦
          </div>
          <p className="golf-made-kicker">{madeCallout}</p>
          <p className="golf-made-detail">
            Hole {holeNumber} · {throwsThisHole} throws · Par {courseHole.par}
          </p>
          <p className="course-celebration-next">
            {holeNumber === 9
              ? "Your scorecard is ready"
              : "Next tee coming up"}
          </p>
        </div>
      ) : null}
      {roundPhase === "hole-flyover" ? (
        <DiscGolfHoleIntro
          courseHole={courseHole}
          courseWind={courseWind}
          progress01={flyoverProgress01}
          onSkip={() => setRoundPhase("play")}
        />
      ) : null}
      {roundPhase === "enter-name" ? (
        <DiscGolfNameScreen
          lastPlayerName={playerName}
          leaderboard={leaderboard}
          onStartRound={startRound}
        />
      ) : null}
      {roundPhase === "round-results" ? (
        <DiscGolfRoundResults
          playerName={playerName}
          holeScores={holeScores}
          waterPenaltyCount={waterPenaltyCount}
          treeHitCount={treeHitCount}
          finishedAt={currentCardFinishedAt}
          leaderboard={leaderboard}
          onStartNextSession={returnToNameScreen}
        />
      ) : null}
    </section>
  );
}

function pointAlongFlightPath(
  path: FlightPointYards[],
  progress01: number,
): FlightPointYards {
  if (path.length === 0) {
    return { xYards: 0, yYards: 0, heightYards: 0 };
  }
  if (path.length === 1 || progress01 <= 0) {
    return path[0];
  }
  if (progress01 >= 1) {
    return path[path.length - 1];
  }
  let totalYards = 0;
  const segmentYards: number[] = [];
  for (let index = 0; index < path.length - 1; index += 1) {
    const yards = Math.hypot(
      path[index + 1].xYards - path[index].xYards,
      path[index + 1].yYards - path[index].yYards,
    );
    segmentYards.push(yards);
    totalYards += yards;
  }
  let alongYards = totalYards * progress01;
  for (let index = 0; index < segmentYards.length; index += 1) {
    if (
      alongYards <= segmentYards[index] ||
      index === segmentYards.length - 1
    ) {
      const t =
        segmentYards[index] === 0 ? 1 : alongYards / segmentYards[index];
      return {
        xYards:
          path[index].xYards +
          (path[index + 1].xYards - path[index].xYards) * t,
        yYards:
          path[index].yYards +
          (path[index + 1].yYards - path[index].yYards) * t,
        heightYards:
          path[index].heightYards +
          (path[index + 1].heightYards - path[index].heightYards) * t,
      };
    }
    alongYards -= segmentYards[index];
  }
  return path[path.length - 1];
}

function holeNumberFromSearch(): number {
  const rawHoleNumber = Number(
    new URLSearchParams(window.location.search).get("hole"),
  );
  if (rawHoleNumber >= 1 && rawHoleNumber <= 9) {
    return rawHoleNumber;
  }
  return 1;
}

function openingRoundPhase(): DiscGolfRoundPhase {
  if (new URLSearchParams(window.location.search).get("review") === "results") {
    return "round-results";
  }
  return "enter-name";
}

function openingPlayerName(): string {
  if (new URLSearchParams(window.location.search).get("review") === "results") {
    return "Review";
  }
  return "";
}

function openingHoleScores(): number[] {
  if (new URLSearchParams(window.location.search).get("review") === "results") {
    return [3, 3, 4, 3, 4, 3, 5, 3, 4];
  }
  return [];
}

function visibleAimSideForThrow(
  throwPower: number,
  throwHyzer01: number,
  windAimSide: "hyzer" | "anhyzer" | "flat" | null,
): "both" | "hyzer" | "anhyzer" | "none" {
  if (windAimSide === "hyzer") {
    return "hyzer";
  }
  if (windAimSide === "anhyzer") {
    return "anhyzer";
  }
  if (windAimSide === "flat") {
    return "none";
  }
  if (throwPower <= 0.03) {
    return "both";
  }
  if (throwHyzer01 < -0.04) {
    return "hyzer";
  }
  if (throwHyzer01 > 0.04) {
    return "anhyzer";
  }
  return "none";
}

function hyzer01ForWindSide(
  side: "left" | "right" | "flat",
  power: number,
): number {
  if (side === "left") {
    return -power;
  }
  if (side === "right") {
    return power;
  }
  return 0;
}

function keyboardWindSideFromKey(
  key: string,
): "left" | "right" | "flat" | null {
  if (key === "z" || key === "Z" || key === "ArrowLeft") {
    return "left";
  }
  if (key === "x" || key === "X" || key === "ArrowRight") {
    return "right";
  }
  if (key === " ") {
    return "flat";
  }
  return null;
}

function cameraModeForPhase(phase: DiscGolfRoundPhase): DiscGolfCameraMode {
  if (phase === "hole-flyover") {
    return "flyover";
  }
  if (phase === "play") {
    return "play";
  }
  if (phase === "round-results") {
    return "results";
  }
  return "preview";
}
