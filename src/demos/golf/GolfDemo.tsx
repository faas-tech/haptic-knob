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
  swingClubAtDetentIndex,
  type SwingClubId,
  type ClubId,
} from "./golfClubs";
import {
  courseHoleByNumber,
  headingDegreesToCup,
  isBallOnGreen,
  NINE_HOLE_COURSE,
  surfaceAtPosition,
  type CoursePointYards,
} from "./golfCourse";
import {
  clampPower,
  liePowerLabel,
  playGolfShot,
  swingPowerFromHold01,
} from "./golfShot";
import { rollCourseWind } from "./golfWind";

const FULL_WIND_DEGREES = 90;
const CLUB_DETENT_DEGREES = 18;
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
    headingDegreesToCup(courseHole.tee, courseHole.cup),
  );
  const [swingClubId, setSwingClubId] = useState<SwingClubId>("five-iron");
  const [swingPower, setSwingPower] = useState(0);
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

  const unwrappedDegreesRef = useRef<number | null>(null);
  const addressDegreesRef = useRef<number | null>(null);
  const headingAtAimStartRef = useRef(headingDegrees);
  const peakSwingRef = useRef(0);
  const lastDeltaRef = useRef(0);
  const appliedFeelRef = useRef<string | null>(null);
  const isAnimatingShotRef = useRef(false);
  const shotAnimationFrameRef = useRef(0);
  const spaceHeldRef = useRef(false);
  const spaceStartedAtRef = useRef(0);
  const playModeRef = useRef(playMode);
  playModeRef.current = playMode;
  const swingPowerRef = useRef(swingPower);
  swingPowerRef.current = swingPower;
  const enableGolfMotorRef = useRef<() => Promise<void>>(async () => {});
  const hitShotRef = useRef<(power: number) => void>(() => {});
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
    const pinHeadingDegrees = headingDegreesToCup(nextHole.tee, nextHole.cup);
    setHeadingDegrees(pinHeadingDegrees);
    headingAtAimStartRef.current = pinHeadingDegrees;
    setSwingPower(0);
    setStrokesThisHole(0);
    setIsHoleComplete(false);
    setCourseWind(rollCourseWind());
    setPlayMode("direction");
    peakSwingRef.current = 0;
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
      const position = pointAlongDisplayPath(path, ease);
      setDisplayBall(position);
      const traveledYards = Math.hypot(
        position.xYards - start.xYards,
        position.yYards - start.yYards,
      );
      const flightProgress01 = Math.min(
        1,
        traveledYards / Math.max(0.01, carryYards),
      );
      const peakHeightYards =
        (carryYards * Math.tan((loftDegrees * Math.PI) / 180)) / 4;
      setBallHeightYards(
        isPutt
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

  const hitShot = (power: number) => {
    if (!canPlay || isAnimatingShotRef.current) {
      return;
    }
    const shotPower = clampPower(power);
    if (shotPower < 0.04) {
      setOperatorMessage("Wind farther, then release.");
      return;
    }

    setShotResultBanner(null);
    setShotClubId(selectedClub.id);
    const shot = playGolfShot({
      courseHole,
      ball,
      lastSafeLie,
      club: selectedClub,
      headingDegrees,
      power: shotPower,
      courseWind,
    });
    const nextStrokes = strokesThisHole + 1 + (shot.tookWaterPenalty ? 1 : 0);
    setStrokesThisHole(nextStrokes);
    setSwingPower(0);
    peakSwingRef.current = 0;
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
      const pinHeadingDegrees = headingDegreesToCup(shot.rest, courseHole.cup);
      setHeadingDegrees(pinHeadingDegrees);
      headingAtAimStartRef.current = pinHeadingDegrees;
      setPlayMode("direction");
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
          ? "On the green. Putter is locked. Hold to swing for your putt."
          : `${selectedClub.name} · ${liePowerLabel(shot.surfaceAtRest)}. Aim, then hold to swing.`,
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

  const applyFeelForPlayMode = (nextMode: GolfPlayMode) => {
    if (!props.isConnected || !isMotorEnabled) {
      return;
    }
    const feelKey = nextMode === "direction" ? "direction-damper" : "shoot";
    if (appliedFeelRef.current === feelKey) {
      return;
    }
    appliedFeelRef.current = feelKey;
    addressDegreesRef.current = null;
    headingAtAimStartRef.current = headingDegrees;
    if (nextMode === "direction") {
      void applyHapticMode(props.sendKnobCommand, "damper", {
        dampingPercent: 38,
      });
      return;
    }
    if (isOnGreen) {
      void applyHapticMode(props.sendKnobCommand, "spring", {
        stiffnessPercent: 32,
        dampingPercent: 28,
      });
      return;
    }
    void applyHapticMode(props.sendKnobCommand, "detent", {
      detentCount: 5,
      stiffnessPercent: 28,
      dampingPercent: 18,
    });
  };

  const selectPlayMode = (nextMode: GolfPlayMode) => {
    if (isAnimatingShotRef.current) return;
    setPlayMode(nextMode);
    addressDegreesRef.current = null;
    headingAtAimStartRef.current = headingDegrees;
    peakSwingRef.current = 0;
    setSwingPower(0);
    applyFeelForPlayMode(nextMode);
    setOperatorMessage("");
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
    addressDegreesRef.current = null;
    headingAtAimStartRef.current = headingDegrees;
    if (playMode === "direction") {
      appliedFeelRef.current = "direction-damper";
      await applyHapticMode(props.sendKnobCommand, "damper", {
        dampingPercent: 38,
      });
    } else if (isOnGreen) {
      appliedFeelRef.current = "shoot-swing";
      await applyHapticMode(props.sendKnobCommand, "spring", {
        stiffnessPercent: 32,
        dampingPercent: 28,
      });
    } else {
      appliedFeelRef.current = "shoot-club";
      await applyHapticMode(props.sendKnobCommand, "detent", {
        detentCount: 5,
        stiffnessPercent: 28,
        dampingPercent: 18,
      });
    }
    setOperatorMessage("Motor on. Use Direction to aim, Shoot to swing.");
  };

  const applyFeelForShootSide = (side: "club" | "swing") => {
    if (!props.isConnected || !isMotorEnabled) {
      return;
    }
    const feelKey = `shoot-${side}`;
    if (appliedFeelRef.current === feelKey) {
      return;
    }
    appliedFeelRef.current = feelKey;
    if (side === "club") {
      void applyHapticMode(props.sendKnobCommand, "detent", {
        detentCount: 5,
        stiffnessPercent: 28,
        dampingPercent: 18,
      });
      return;
    }
    void applyHapticMode(props.sendKnobCommand, "spring", {
      stiffnessPercent: 32,
      dampingPercent: 28,
    });
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
    const cancelCharge = () => {
      spaceHeldRef.current = false;
      peakSwingRef.current = 0;
      setSwingPower(0);
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
      isAnimatingShotRef.current
    ) {
      return;
    }

    unwrappedDegreesRef.current = unwrapAngleDegrees(
      unwrappedDegreesRef.current,
      props.latestStreamSample.positionDegrees,
    );
    if (addressDegreesRef.current == null) {
      addressDegreesRef.current = unwrappedDegreesRef.current;
    }

    const deltaDegrees =
      unwrappedDegreesRef.current - addressDegreesRef.current;

    if (playModeRef.current === "direction") {
      setHeadingDegrees(
        headingAtAimStartRef.current +
          deltaDegrees * AIM_DEGREES_PER_KNOB_DEGREE,
      );
      return;
    }

    const returningTowardAddress =
      Math.abs(deltaDegrees) < Math.abs(lastDeltaRef.current) - 2;
    lastDeltaRef.current = deltaDegrees;

    if (isOnGreen || isHoleComplete) {
      applyFeelForShootSide("swing");
      const puttPower = swingPowerFromHold01(
        Math.max(0, deltaDegrees) / FULL_WIND_DEGREES,
      );
      peakSwingRef.current = Math.max(peakSwingRef.current, puttPower);
      setSwingPower(puttPower);
      if (returningTowardAddress && peakSwingRef.current > 0.08) {
        const power = peakSwingRef.current;
        peakSwingRef.current = 0;
        hitShot(power);
      }
      return;
    }

    if (deltaDegrees < -6) {
      applyFeelForShootSide("club");
      const detentIndex = Math.min(
        4,
        Math.floor((-deltaDegrees - 6) / CLUB_DETENT_DEGREES),
      );
      setSwingClubId(swingClubAtDetentIndex(detentIndex).id as SwingClubId);
      setSwingPower(0);
      peakSwingRef.current = 0;
      return;
    }

    if (deltaDegrees > 6) {
      applyFeelForShootSide("swing");
      const nextSwingPower = swingPowerFromHold01(
        deltaDegrees / FULL_WIND_DEGREES,
      );
      peakSwingRef.current = Math.max(peakSwingRef.current, nextSwingPower);
      setSwingPower(nextSwingPower);
      if (returningTowardAddress && peakSwingRef.current > 0.08) {
        const power = peakSwingRef.current;
        peakSwingRef.current = 0;
        hitShot(power);
      }
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
      } else if (event.key === "s" || event.key === "S") {
        selectPlayMode("shoot");
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
        if (playModeRef.current !== "shoot") {
          selectPlayMode("shoot");
        }
        spaceHeldRef.current = true;
        spaceStartedAtRef.current = performance.now();
        peakSwingRef.current = 0;
      } else if (event.key === "r" || event.key === "R") {
        resetHole(holeNumber);
        setOperatorMessage(`Hole ${holeNumber} reset. New wind.`);
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === " ") {
        event.preventDefault();
        spaceHeldRef.current = false;
        if (roundPhase !== "play") {
          return;
        }
        const power = peakSwingRef.current;
        peakSwingRef.current = 0;
        setSwingPower(0);
        hitShot(power);
      }
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
        peakSwingRef.current = power;
        setSwingPower(power);
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
        aimCarryYards={
          selectedClub.id === "putter"
            ? swingPower > 0.03
              ? selectedClub.puttYards * swingPower
              : yardsToCup
            : selectedClub.carryYards * (swingPower > 0.03 ? swingPower : 1)
        }
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
      />
      {roundPhase === "play" ? (
        <GolfPlayerDashboard
          playerName={playerName}
          courseHole={courseHole}
          playMode={playMode}
          selectedClubId={displayedClub.id}
          isPutterLocked={displayedClub.id === "putter"}
          windPower={swingPower}
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
            selectPlayMode("shoot");
            spaceHeldRef.current = true;
            spaceStartedAtRef.current = performance.now();
            peakSwingRef.current = 0;
          }}
          onRelease={() => {
            spaceHeldRef.current = false;
            const power = peakSwingRef.current;
            peakSwingRef.current = 0;
            setSwingPower(0);
            hitShot(power);
          }}
          onCancelCharge={() => {
            spaceHeldRef.current = false;
            peakSwingRef.current = 0;
            setSwingPower(0);
          }}
          onSelectDirectionMode={() => selectPlayMode("direction")}
          onSelectShootMode={() => selectPlayMode("shoot")}
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
): CoursePointYards {
  if (path.length === 0) {
    return { xYards: 0, yYards: 0 };
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
