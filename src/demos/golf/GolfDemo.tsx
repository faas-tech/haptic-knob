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
import type { GolfHeaderActionsState } from "../../ui/GolfHeaderActions";
import { GolfCourseMap, type GolfCameraMode } from "./GolfCourseMap";
import { GolfHoleIntro } from "./GolfHoleIntro";
import { GolfNameScreen } from "./GolfNameScreen";
import {
  GolfPlayerDashboard,
  type GolfPlayMode,
  type GolfShotResultBanner,
} from "./GolfPlayerDashboard";
import { GolfRoundResults } from "./GolfRoundResults";
import {
  readGolfLeaderboard,
  writeGolfLeaderboardEntry,
  type GolfLeaderboardEntry,
} from "./golfLeaderboard";
import {
  nextSwingClubId,
  previousSwingClubId,
  PUTTER,
  SWING_CLUBS,
  swingClubAfterDetentSteps,
  swingClubAtDetentIndex,
  type SwingClubId,
  type ClubId,
} from "./golfClubs";
import {
  courseHoleByNumber,
  isBallOnGreen,
  NINE_HOLE_COURSE,
  startingAimHeadingDegrees,
  surfaceAtPosition,
  type CoursePointYards,
} from "./golfCourse";
import {
  clampPower,
  FULL_WIND_DEGREES,
  liePowerLabel,
  MINIMUM_SHOT_POWER,
  playGolfShot,
  previewGolfShotPath,
  puttPowerFromHold01,
  shotShapeLabel,
  swingFromKnobDelta,
  swingPowerFromHold01,
} from "./golfShot";
import { rollCourseWind } from "./golfWind";

const DIRECTION_DETENT_COUNT = 36;
const CLUB_DETENT_COUNT = 16;
const CLUB_DETENT_SPACING_DEGREES = 360 / CLUB_DETENT_COUNT;
const HAPTIC_SETTLE_MS = 220;
const SWING_RELEASE_RETURN_DEGREES = 2;
const WIND_KEY_SECONDS = 1.4;
const AIM_DEGREES_PER_KNOB_DEGREE = 0.35;
const HOLE_FLYOVER_MS = 5000;
const HOLE_OUT_SINK_MS = 620;
const HOLE_OUT_HOLD_MS = 1800;

type GolfRoundPhase = "enter-name" | "hole-flyover" | "play" | "round-results";

export function GolfDemo(props: {
  isConnected: boolean;
  latestStreamSample: KnobStreamSample | null;
  sendKnobCommand: (command: string) => Promise<KnobCommandReply>;
  onHeaderActionsChange: (actions: GolfHeaderActionsState | null) => void;
}) {
  const [holeNumber, setHoleNumber] = useState(holeNumberFromSearch);
  const courseHole = useMemo(
    () => courseHoleByNumber(holeNumber),
    [holeNumber],
  );
  const [ball, setBall] = useState<CoursePointYards>(courseHole.tee);
  const [lastSafeLie, setLastSafeLie] = useState<CoursePointYards>(
    courseHole.tee,
  );
  const [headingDegrees, setHeadingDegrees] = useState(() =>
    startingAimHeadingDegrees(courseHole, courseHole.tee),
  );
  const [swingClubId, setSwingClubId] = useState<SwingClubId>("five-iron");
  const [swingPower, setSwingPower] = useState(0);
  const [swingShape01, setSwingShape01] = useState(0);
  const [windAimSide, setWindAimSide] = useState<
    "draw" | "fade" | "straight" | null
  >(null);
  const [playMode, setPlayMode] = useState<GolfPlayMode>("direction");
  const [courseWind, setCourseWind] = useState(rollCourseWind);
  const [strokesThisHole, setStrokesThisHole] = useState(0);
  const [holeScores, setHoleScores] = useState<number[]>(openingHoleScores);
  const [isHoleComplete, setIsHoleComplete] = useState(false);
  const [isRoundComplete, setIsRoundComplete] = useState(false);
  const [isMotorEnabled, setIsMotorEnabled] = useState(false);
  const [operatorMessage, setOperatorMessage] = useState("");
  const [shotResultBanner, setShotResultBanner] =
    useState<GolfShotResultBanner | null>(null);
  const [isShotInFlight, setIsShotInFlight] = useState(false);
  const [ballHeightYards, setBallHeightYards] = useState(0);
  const [isPuttInFlight, setIsPuttInFlight] = useState(false);
  const [shotClubId, setShotClubId] = useState<ClubId>("five-iron");
  const [displayBall, setDisplayBall] = useState<CoursePointYards>(
    courseHole.tee,
  );
  const [ballSink01, setBallSink01] = useState(0);
  const [madeCallout, setMadeCallout] = useState<string | null>(null);
  const [roundPhase, setRoundPhase] =
    useState<GolfRoundPhase>(openingRoundPhase);
  const [playerName, setPlayerName] = useState(openingPlayerName);
  const [flyoverProgress01, setFlyoverProgress01] = useState(0);
  const [flyoverGeneration, setFlyoverGeneration] = useState(0);
  const [waterPenaltyCount, setWaterPenaltyCount] = useState(0);
  const [treeHitCount, setTreeHitCount] = useState(0);
  const [leaderboard, setLeaderboard] =
    useState<GolfLeaderboardEntry[]>(readGolfLeaderboard);
  const [currentCardFinishedAt, setCurrentCardFinishedAt] = useState<
    string | null
  >(null);

  const canPlay = roundPhase === "play" && !isHoleComplete && !isRoundComplete;
  const cameraMode = cameraModeForPhase(roundPhase);
  const lieSurface = surfaceAtPosition(courseHole, ball);
  const isOnGreen = isBallOnGreen(courseHole, ball);
  const selectedClub = isOnGreen
    ? PUTTER
    : (SWING_CLUBS.find((club) => club.id === swingClubId) ?? SWING_CLUBS[2]);
  const displayedClub = isShotInFlight
    ? (SWING_CLUBS.find((club) => club.id === shotClubId) ?? PUTTER)
    : selectedClub;
  const totalStrokes =
    holeScores.reduce((sum, score) => sum + score, 0) +
    (isHoleComplete ? 0 : strokesThisHole);
  const scoreVsPar = holeScores.reduce((sum, strokes, index) => {
    return sum + strokes - NINE_HOLE_COURSE[index].par;
  }, 0);
  const yardsToCup = Math.hypot(
    courseHole.cup.xYards - ball.xYards,
    courseHole.cup.yYards - ball.yYards,
  );
  const previewCarryYards =
    selectedClub.id === "putter"
      ? swingPower > 0.03
        ? selectedClub.puttYards * swingPower
        : yardsToCup
      : selectedClub.carryYards * (swingPower > 0.03 ? swingPower : 0.85);
  const drawAimPath = useMemo(
    () =>
      previewGolfShotPath({
        ball,
        headingDegrees,
        loftDegrees: selectedClub.loftDegrees,
        carryYards: previewCarryYards,
        shape01: -0.85,
        pointCount: 33,
      }),
    [ball, headingDegrees, previewCarryYards, selectedClub.loftDegrees],
  );
  const fadeAimPath = useMemo(
    () =>
      previewGolfShotPath({
        ball,
        headingDegrees,
        loftDegrees: selectedClub.loftDegrees,
        carryYards: previewCarryYards,
        shape01: 0.85,
        pointCount: 33,
      }),
    [ball, headingDegrees, previewCarryYards, selectedClub.loftDegrees],
  );
  const estimateAimPath = useMemo(
    () =>
      previewGolfShotPath({
        ball,
        headingDegrees,
        loftDegrees: selectedClub.loftDegrees,
        carryYards: previewCarryYards,
        shape01: selectedClub.id === "putter" ? 0 : swingShape01,
        pointCount: 33,
      }),
    [
      ball,
      headingDegrees,
      previewCarryYards,
      selectedClub.id,
      selectedClub.loftDegrees,
      swingShape01,
    ],
  );
  const visibleAimSide = visibleAimSideForSwing(windAimSide, swingShape01);
  const showShapeGhosts =
    playMode === "swing" &&
    windAimSide == null &&
    Math.abs(swingShape01) < 0.04;

  const unwrappedDegreesRef = useRef<number | null>(null);
  const addressDegreesRef = useRef<number | null>(null);
  const headingAtAimStartRef = useRef(headingDegrees);
  const headingDegreesRef = useRef(headingDegrees);
  headingDegreesRef.current = headingDegrees;
  const peakSwingRef = useRef(0);
  const lastDeltaRef = useRef(0);
  const appliedFeelRef = useRef<string | null>(null);
  const isAnimatingShotRef = useRef(false);
  const shotAnimationFrameRef = useRef(0);
  const spaceHeldRef = useRef(false);
  const spaceStartedAtRef = useRef(0);
  const playModeRef = useRef(playMode);
  playModeRef.current = playMode;
  const swingClubIdRef = useRef(swingClubId);
  swingClubIdRef.current = swingClubId;
  const clubAtSelectStartRef = useRef<SwingClubId>(swingClubId);
  const ignoreKnobInputUntilMsRef = useRef(0);
  const peakShape01Ref = useRef(0);
  const keyboardWindSideRef = useRef<"draw" | "fade" | "straight" | null>(
    null,
  );
  const swingPowerRef = useRef(swingPower);
  swingPowerRef.current = swingPower;
  const enableGolfMotorRef = useRef<() => Promise<void>>(async () => {});
  const hitShotRef = useRef<(power: number, shape01?: number) => void>(
    () => {},
  );
  const hasSavedRoundRef = useRef(false);
  const holeOutTimerRef = useRef<number | null>(null);

  const resetHole = (nextHoleNumber: number) => {
    window.cancelAnimationFrame(shotAnimationFrameRef.current);
    if (holeOutTimerRef.current != null)
      window.clearTimeout(holeOutTimerRef.current);
    isAnimatingShotRef.current = false;
    setIsShotInFlight(false);
    setBallHeightYards(0);
    spaceHeldRef.current = false;
    setShotResultBanner(null);
    const nextHole = courseHoleByNumber(nextHoleNumber);
    setHoleNumber(nextHoleNumber);
    setBall(nextHole.tee);
    setLastSafeLie(nextHole.tee);
    setDisplayBall(nextHole.tee);
    setBallSink01(0);
    setMadeCallout(null);
    const teeHeadingDegrees = startingAimHeadingDegrees(nextHole, nextHole.tee);
    setHeadingDegrees(teeHeadingDegrees);
    headingAtAimStartRef.current = teeHeadingDegrees;
    setSwingPower(0);
    setSwingShape01(0);
    setWindAimSide(null);
    setStrokesThisHole(0);
    setIsHoleComplete(false);
    setCourseWind(rollCourseWind());
    setPlayMode("direction");
    peakSwingRef.current = 0;
    addressDegreesRef.current = null;
    peakShape01Ref.current = 0;
    keyboardWindSideRef.current = null;
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
    setShotResultBanner(null);
    setOperatorMessage("");
    setLeaderboard(readGolfLeaderboard());
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
    const totalStrokesForCard = nextScores.reduce(
      (sum, strokes) => sum + strokes,
      0,
    );
    const scoreVsParForCard = nextScores.reduce(
      (sum, strokes, index) => sum + strokes - NINE_HOLE_COURSE[index].par,
      0,
    );
    const saved = writeGolfLeaderboardEntry({
      playerName,
      totalStrokes: totalStrokesForCard,
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

  const animateShotPath = (
    path: CoursePointYards[],
    onFinished: () => void,
    carryYards: number,
    loftDegrees: number,
    isPutt: boolean,
  ) => {
    isAnimatingShotRef.current = true;
    setIsShotInFlight(true);
    setIsPuttInFlight(isPutt);
    const startedAt = performance.now();
    const start = path[0];
    const end = path[path.length - 1];
    const travelYards = Math.hypot(
      end.xYards - start.xYards,
      end.yYards - start.yYards,
    );
    const durationMs = isPutt
      ? Math.min(1800, 700 + travelYards * 36)
      : Math.min(3200, 1500 + travelYards * 6);
    const step = (now: number) => {
      const t = Math.min(1, (now - startedAt) / durationMs);
      const ease = 1 - (1 - t) ** 2;
      const alongPath = pointAlongDisplayPath(path, ease);
      setDisplayBall(alongPath.point);
      const flightProgress01 = Math.min(
        1,
        alongPath.alongYards / Math.max(0.01, carryYards),
      );
      const peakHeightYards =
        (carryYards * Math.tan((loftDegrees * Math.PI) / 180)) / 4;
      const isRolling = alongPath.alongYards > carryYards + 0.05;
      setBallHeightYards(
        isPutt || isRolling
          ? 0
          : 4 * peakHeightYards * flightProgress01 * (1 - flightProgress01),
      );
      if (t < 1) {
        shotAnimationFrameRef.current = window.requestAnimationFrame(step);
        return;
      }
      setDisplayBall(path[path.length - 1]);
      setBallHeightYards(0);
      setIsShotInFlight(false);
      onFinished();
    };
    shotAnimationFrameRef.current = window.requestAnimationFrame(step);
  };

  const animateBallSink = (onFinished: () => void) => {
    const startedAt = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - startedAt) / HOLE_OUT_SINK_MS);
      const ease = t * t;
      setBallSink01(ease);
      if (t < 1) {
        shotAnimationFrameRef.current = window.requestAnimationFrame(step);
        return;
      }
      setBallSink01(1);
      onFinished();
    };
    shotAnimationFrameRef.current = window.requestAnimationFrame(step);
  };

  const hitShot = (power: number, shape01 = 0) => {
    if (!canPlay || isAnimatingShotRef.current) {
      return;
    }
    const shotPower = clampPower(power);
    if (shotPower < MINIMUM_SHOT_POWER) {
      setOperatorMessage("Wind farther, then release.");
      return;
    }

    setShotResultBanner(null);
    setShotClubId(selectedClub.id);
    const shotShape01 = selectedClub.id === "putter" ? 0 : shape01;
    const shot = playGolfShot({
      courseHole,
      ball,
      lastSafeLie,
      club: selectedClub,
      headingDegrees,
      power: shotPower,
      courseWind,
      shape01: shotShape01,
    });
    const nextStrokes = strokesThisHole + 1 + (shot.tookWaterPenalty ? 1 : 0);
    setStrokesThisHole(nextStrokes);
    setSwingPower(0);
    setSwingShape01(0);
    setWindAimSide(null);
    peakSwingRef.current = 0;
    peakShape01Ref.current = 0;
    keyboardWindSideRef.current = null;
    addressDegreesRef.current = null;

    setBall(shot.rest);
    if (!shot.tookWaterPenalty) {
      setLastSafeLie(shot.rest);
    }
    if (shot.tookWaterPenalty) {
      setWaterPenaltyCount((current) => current + 1);
    }
    if (shot.hitTree) {
      setTreeHitCount((current) => current + 1);
    }

    const afterShotSettles = () => {
      if (!shot.isInCup) {
        setShotResultBanner({
          bannerKey: Date.now(),
          powerPercent: Math.round(shotPower * 100),
          travelYards: Math.round(shot.travelYards),
          shapeLabel: shotShapeLabel(shotShape01),
        });
      }

      if (shot.isInCup) {
        setDisplayBall(courseHole.cup);
        animateBallSink(() => {
          const nextScores = [...holeScores, nextStrokes];
          setHoleScores(nextScores);
          setIsHoleComplete(true);
          setMadeCallout(holeScoreName(nextStrokes, courseHole.par));
          setOperatorMessage("");
          if (holeOutTimerRef.current != null) {
            window.clearTimeout(holeOutTimerRef.current);
          }
          holeOutTimerRef.current = window.setTimeout(() => {
            isAnimatingShotRef.current = false;
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

      setDisplayBall(shot.rest);
      isAnimatingShotRef.current = false;
      const nextAimHeadingDegrees = startingAimHeadingDegrees(
        courseHole,
        shot.rest,
      );
      setHeadingDegrees(nextAimHeadingDegrees);
      headingAtAimStartRef.current = nextAimHeadingDegrees;
      setPlayMode("direction");
      applyFeelForPlayMode("direction");
      if (shot.tookWaterPenalty) {
        setOperatorMessage(
          "Water. One penalty stroke. Ball is back on the last dry lie.",
        );
        return;
      }
      if (shot.hitTree) {
        setOperatorMessage("Tree. Ball is at the base. Turn and punch out.");
        return;
      }
      setOperatorMessage(
        shot.surfaceAtRest === "green"
          ? "On the green. Putter is locked. A aims. S putts with the spring."
          : `${selectedClub.name} · ${liePowerLabel(shot.surfaceAtRest)}. A aims. C picks a club. S swings.`,
      );
    };

    animateShotPath(
      shot.displayPath.length > 1 ? shot.displayPath : [ball, shot.rest],
      afterShotSettles,
      Math.hypot(
        shot.landing.xYards - ball.xYards,
        shot.landing.yYards - ball.yYards,
      ),
      selectedClub.loftDegrees,
      selectedClub.id === "putter",
    );
  };

  const beginHapticSettle = () => {
    ignoreKnobInputUntilMsRef.current = performance.now() + HAPTIC_SETTLE_MS;
    addressDegreesRef.current = null;
    lastDeltaRef.current = 0;
    peakSwingRef.current = 0;
    peakShape01Ref.current = 0;
    setSwingPower(0);
    setSwingShape01(0);
  };

  const applyFeelForPlayMode = async (
    nextMode: GolfPlayMode,
    options?: { forceWrite?: boolean },
  ) => {
    if (!props.isConnected || !isMotorEnabled) {
      return;
    }
    const feelKey =
      nextMode === "direction"
        ? "direction-detent"
        : nextMode === "club"
          ? "club-detent"
          : isOnGreen
            ? "putt-spring"
            : "swing-spring";
    if (!options?.forceWrite && appliedFeelRef.current === feelKey) {
      return;
    }
    clubAtSelectStartRef.current = swingClubIdRef.current;
    const feelReply =
      nextMode === "direction"
        ? await applyHapticMode(props.sendKnobCommand, "detent", {
            detentCount: DIRECTION_DETENT_COUNT,
            stiffnessPercent: 22,
            dampingPercent: 14,
          })
        : nextMode === "club"
          ? await applyHapticMode(props.sendKnobCommand, "detent", {
              detentCount: CLUB_DETENT_COUNT,
              stiffnessPercent: 28,
              dampingPercent: 16,
            })
          : await applyHapticMode(props.sendKnobCommand, "spring", {
              stiffnessPercent: isOnGreen ? 16 : 26,
              dampingPercent: isOnGreen ? 38 : 28,
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

  const selectPlayMode = (nextMode: GolfPlayMode) => {
    if (isAnimatingShotRef.current) return;
    if (nextMode === "club" && isOnGreen) {
      setOperatorMessage("Putter is locked on the green.");
      return;
    }
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
    clubAtSelectStartRef.current = swingClubIdRef.current;
    peakSwingRef.current = 0;
    peakShape01Ref.current = 0;
    setSwingPower(0);
    setSwingShape01(0);
    setWindAimSide(null);
    void applyFeelForPlayMode(nextMode);
    setOperatorMessage(
      nextMode === "direction"
        ? "Fine detents aim at the pin."
        : nextMode === "club"
          ? "Turn either way to change clubs."
          : isOnGreen
            ? "Wind the spring, then let it back to putt."
            : "Right winds a fade. Left winds a draw. Let the spring back to hit.",
    );
  };

  const beginKeyboardWind = (side: "draw" | "fade" | "straight") => {
    if (keyboardWindSideRef.current) {
      return;
    }
    if (playModeRef.current !== "swing") {
      selectPlayMode("swing");
    }
    spaceHeldRef.current = true;
    spaceStartedAtRef.current = performance.now();
    keyboardWindSideRef.current = side;
    setWindAimSide(side);
    peakSwingRef.current = 0;
    peakShape01Ref.current = 0;
    setSwingPower(0);
    setSwingShape01(shape01ForWindSide(side, 0));
  };

  const releaseKeyboardWind = () => {
    spaceHeldRef.current = false;
    if (roundPhase !== "play" || isAnimatingShotRef.current) {
      keyboardWindSideRef.current = null;
      return;
    }
    const power = peakSwingRef.current;
    const shape01 = peakShape01Ref.current;
    peakSwingRef.current = 0;
    peakShape01Ref.current = 0;
    keyboardWindSideRef.current = null;
    setSwingPower(0);
    setSwingShape01(0);
    setWindAimSide(null);
    hitShot(power, shape01);
  };

  const enableGolfMotor = async () => {
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
      "Motor on. A aims. C turns through clubs. S winds a fade or a draw.",
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
      spaceHeldRef.current = false;
      keyboardWindSideRef.current = null;
      peakSwingRef.current = 0;
      peakShape01Ref.current = 0;
      setSwingPower(0);
      setSwingShape01(0);
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
    const streamSample = props.latestStreamSample;
    if (
      !canPlay ||
      !streamSample ||
      !isMotorEnabled ||
      isAnimatingShotRef.current
    ) {
      return;
    }

    unwrappedDegreesRef.current = unwrapAngleDegrees(
      unwrappedDegreesRef.current,
      streamSample.positionDegrees,
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

    if (playModeRef.current === "club") {
      lastDeltaRef.current = deltaDegrees;
      const detentSteps = Math.round(
        deltaDegrees / CLUB_DETENT_SPACING_DEGREES,
      );
      setSwingClubId(
        swingClubAfterDetentSteps(clubAtSelectStartRef.current, detentSteps),
      );
      return;
    }

    const nextSwing = isOnGreen
      ? {
          power: puttPowerFromHold01(
            Math.abs(deltaDegrees) / FULL_WIND_DEGREES,
          ),
          shape01: 0,
        }
      : swingFromKnobDelta(deltaDegrees);
    const signedWindDegrees = deltaDegrees;
    const returningTowardCenter =
      Math.abs(signedWindDegrees) <
      Math.abs(lastDeltaRef.current) - SWING_RELEASE_RETURN_DEGREES;
    lastDeltaRef.current = signedWindDegrees;
    peakSwingRef.current = Math.max(peakSwingRef.current, nextSwing.power);
    if (nextSwing.power >= MINIMUM_SHOT_POWER) {
      peakShape01Ref.current = nextSwing.shape01;
    }
    setSwingPower(nextSwing.power);
    setSwingShape01(nextSwing.shape01);
    setWindAimSide(
      nextSwing.shape01 < -0.04
        ? "draw"
        : nextSwing.shape01 > 0.04
          ? "fade"
          : null,
    );
    if (
      returningTowardCenter &&
      peakSwingRef.current >= MINIMUM_SHOT_POWER
    ) {
      const power = peakSwingRef.current;
      const shape01 = peakShape01Ref.current;
      peakSwingRef.current = 0;
      peakShape01Ref.current = 0;
      hitShot(power, shape01);
    }
  }, [props.latestStreamSample, isMotorEnabled, isOnGreen, isHoleComplete]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) {
        return;
      }
      if (roundPhase !== "play" || isAnimatingShotRef.current) {
        return;
      }
      if (event.key === "a" || event.key === "A") {
        selectPlayMode("direction");
      } else if (event.key === "c" || event.key === "C") {
        selectPlayMode("club");
      } else if (event.key === "s" || event.key === "S") {
        selectPlayMode("swing");
      } else if ((event.key === "z" || event.key === "Z") && !event.repeat) {
        beginKeyboardWind("draw");
      } else if ((event.key === "x" || event.key === "X") && !event.repeat) {
        beginKeyboardWind("fade");
      } else if (event.key === "[" && !isOnGreen) {
        setSwingClubId((current) => previousSwingClubId(current));
      } else if (event.key === "]" && !isOnGreen) {
        setSwingClubId((current) => nextSwingClubId(current));
      } else if (/^[1-5]$/.test(event.key) && !isOnGreen) {
        setSwingClubId(
          swingClubAtDetentIndex(Number(event.key) - 1).id as SwingClubId,
        );
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setHeadingDegrees((current) => current - 2);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setHeadingDegrees((current) => current + 2);
      } else if (event.key === " " && !event.repeat) {
        event.preventDefault();
        beginKeyboardWind("straight");
      } else if (event.key === "r" || event.key === "R") {
        resetHole(holeNumber);
        void applyFeelForPlayMode("direction");
        setOperatorMessage(`Hole ${holeNumber} reset. New wind.`);
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const heldSide = keyboardWindSideRef.current;
      if (!heldSide) {
        return;
      }
      const releasedHeldSide =
        (heldSide === "draw" && (event.key === "z" || event.key === "Z")) ||
        (heldSide === "fade" && (event.key === "x" || event.key === "X")) ||
        (heldSide === "straight" && event.key === " ");
      if (!releasedHeldSide) {
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
    isOnGreen,
    isRoundComplete,
    roundPhase,
    courseHole,
    ball,
    selectedClub,
    headingDegrees,
    lastSafeLie,
    courseWind,
    isMotorEnabled,
  ]);

  useEffect(() => {
    let frame = 0;
    const tick = (now: number) => {
      if (spaceHeldRef.current) {
        const heldSeconds = (now - spaceStartedAtRef.current) / 1000;
        const power = swingPowerFromHold01(heldSeconds / WIND_KEY_SECONDS);
        const side = keyboardWindSideRef.current ?? "straight";
        const shape01 = shape01ForWindSide(side, power);
        peakSwingRef.current = power;
        peakShape01Ref.current = shape01;
        setSwingPower(power);
        setSwingShape01(shape01);
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!shotResultBanner) {
      return;
    }
    const hideBannerAt = window.setTimeout(() => {
      setShotResultBanner(null);
    }, 3200);
    return () => window.clearTimeout(hideBannerAt);
  }, [shotResultBanner]);

  enableGolfMotorRef.current = enableGolfMotor;
  hitShotRef.current = hitShot;

  useLayoutEffect(() => {
    props.onHeaderActionsChange({
      isConnected: props.isConnected,
      isMotorEnabled,
      canHitShot: canPlay && !isShotInFlight,
      onEnableMotor: () => {
        void enableGolfMotorRef.current();
      },
      onHitPracticeShot: () => {
        hitShotRef.current(Math.max(swingPowerRef.current, 0.55));
      },
    });
    return () => props.onHeaderActionsChange(null);
  }, [props.isConnected, isMotorEnabled, canPlay, isShotInFlight]);

  return (
    <section className="golf-demo">
      <GolfCourseMap
        courseHole={courseHole}
        ball={displayBall}
        aimHeadingDegrees={headingDegrees}
        aimLoftDegrees={selectedClub.loftDegrees}
        aimCarryYards={previewCarryYards}
        aimIsPutt={
          (isShotInFlight ? isPuttInFlight : selectedClub.id === "putter") &&
          ballSink01 === 0 &&
          !madeCallout
        }
        ballSink01={ballSink01}
        cameraMode={cameraMode}
        flyoverProgress01={flyoverProgress01}
        isShotInFlight={isShotInFlight}
        ballHeightYards={ballHeightYards}
        estimateAimPath={estimateAimPath}
        drawAimPath={drawAimPath}
        fadeAimPath={fadeAimPath}
        visibleAimSide={visibleAimSide}
        showShapeGhosts={showShapeGhosts}
      />
      {roundPhase === "play" ? (
        <GolfPlayerDashboard
          playerName={playerName}
          courseHole={courseHole}
          playMode={playMode}
          selectedClubId={displayedClub.id}
          isPutterLocked={displayedClub.id === "putter"}
          windPower={swingPower}
          swingShape01={swingShape01}
          courseWind={courseWind}
          strokesThisHole={strokesThisHole}
          yardsToCup={Math.hypot(
            courseHole.cup.xYards - displayBall.xYards,
            courseHole.cup.yYards - displayBall.yYards,
          )}
          scoreVsPar={scoreVsPar}
          totalStrokes={totalStrokes}
          completedHoleCount={holeScores.length}
          operatorMessage={operatorMessage}
          lieLabel={liePowerLabel(lieSurface)}
          shotResultBanner={shotResultBanner}
          position={displayBall}
          headingDegrees={headingDegrees}
          isInFlight={isShotInFlight}
          isComplete={isHoleComplete || ballSink01 > 0}
          onPreviousEquipment={() =>
            setSwingClubId((current) => previousSwingClubId(current))
          }
          onNextEquipment={() =>
            setSwingClubId((current) => nextSwingClubId(current))
          }
          onAimLeft={() => setHeadingDegrees((current) => current - 2)}
          onAimRight={() => setHeadingDegrees((current) => current + 2)}
          onCharge={() => {
            if (!canPlay || isAnimatingShotRef.current) return;
            beginKeyboardWind("straight");
          }}
          onRelease={() => {
            releaseKeyboardWind();
          }}
          onCancelCharge={() => {
            spaceHeldRef.current = false;
            keyboardWindSideRef.current = null;
            peakSwingRef.current = 0;
            peakShape01Ref.current = 0;
            setSwingPower(0);
            setSwingShape01(0);
            setWindAimSide(null);
          }}
          onSelectDirectionMode={() => selectPlayMode("direction")}
          onSelectClubMode={() => selectPlayMode("club")}
          onSelectSwingMode={() => selectPlayMode("swing")}
        />
      ) : null}
      {madeCallout ? (
        <div className="golf-made-callout" role="status">
          <p className="course-eyebrow">IN THE CUP</p>
          <div className="course-celebration-seal" aria-hidden="true">
            ✦
          </div>
          <p className="golf-made-kicker">{madeCallout}</p>
          <p className="golf-made-detail">
            Hole {holeNumber} · {strokesThisHole} strokes · Par {courseHole.par}
          </p>
          <p className="course-celebration-next">
            {holeNumber === 9
              ? "Your scorecard is ready"
              : "Next tee coming up"}
          </p>
        </div>
      ) : null}
      {roundPhase === "hole-flyover" ? (
        <GolfHoleIntro
          courseHole={courseHole}
          courseWind={courseWind}
          progress01={flyoverProgress01}
          onSkip={() => setRoundPhase("play")}
        />
      ) : null}
      {roundPhase === "enter-name" ? (
        <GolfNameScreen
          lastPlayerName={playerName}
          leaderboard={leaderboard}
          onStartRound={startRound}
        />
      ) : null}
      {roundPhase === "round-results" ? (
        <GolfRoundResults
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

function pointAlongDisplayPath(
  path: CoursePointYards[],
  progress01: number,
): { point: CoursePointYards; alongYards: number } {
  if (path.length === 0) {
    return { point: { xYards: 0, yYards: 0 }, alongYards: 0 };
  }
  if (path.length === 1 || progress01 <= 0) {
    return { point: path[0], alongYards: 0 };
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
  if (progress01 >= 1) {
    return { point: path[path.length - 1], alongYards: totalYards };
  }
  let alongYards = totalYards * progress01;
  const traveledYards = alongYards;
  for (let index = 0; index < segmentYards.length; index += 1) {
    if (
      alongYards <= segmentYards[index] ||
      index === segmentYards.length - 1
    ) {
      const t =
        segmentYards[index] === 0 ? 1 : alongYards / segmentYards[index];
      return {
        point: {
          xYards:
            path[index].xYards +
            (path[index + 1].xYards - path[index].xYards) * t,
          yYards:
            path[index].yYards +
            (path[index + 1].yYards - path[index].yYards) * t,
        },
        alongYards: traveledYards,
      };
    }
    alongYards -= segmentYards[index];
  }
  return { point: path[path.length - 1], alongYards: totalYards };
}

function shape01ForWindSide(
  side: "draw" | "fade" | "straight",
  power: number,
): number {
  if (side === "draw") {
    return -Math.max(0.2, power);
  }
  if (side === "fade") {
    return Math.max(0.2, power);
  }
  return 0;
}

function visibleAimSideForSwing(
  windAimSide: "draw" | "fade" | "straight" | null,
  swingShape01: number,
): "both" | "draw" | "fade" | "none" {
  if (windAimSide === "draw") {
    return "draw";
  }
  if (windAimSide === "fade") {
    return "fade";
  }
  if (windAimSide === "straight") {
    return "both";
  }
  if (swingShape01 < -0.04) {
    return "draw";
  }
  if (swingShape01 > 0.04) {
    return "fade";
  }
  return "both";
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

function openingRoundPhase(): GolfRoundPhase {
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
    return [4, 3, 5, 5, 4, 3, 4, 5, 4];
  }
  return [];
}

function cameraModeForPhase(phase: GolfRoundPhase): GolfCameraMode {
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
