import { CoursePlayerInterface } from "../course-visuals/CoursePlayerInterface";
import { SWING_CLUBS, PUTTER, type ClubId } from "./golfClubs";
import { COURSE_NAME, type CourseHole } from "./golfCourse";
import type { CourseWind } from "./golfWind";
export type GolfPlayMode = "direction" | "shoot";

export type GolfShotResultBanner = {
  bannerKey: number;
  powerPercent: number;
  travelYards: number;
};

export function GolfPlayerDashboard(props: {
  playerName: string;
  courseHole: CourseHole;
  playMode: GolfPlayMode;
  selectedClubId: ClubId;
  isPutterLocked: boolean;
  windPower: number;
  courseWind: CourseWind;
  strokesThisHole: number;
  yardsToCup: number;
  scoreVsPar: number;
  totalStrokes: number;
  completedHoleCount: number;
  operatorMessage: string;
  lieLabel: string;
  shotResultBanner: GolfShotResultBanner | null;
  onSelectDirectionMode: () => void;
  onSelectShootMode: () => void;
  position: { xYards: number; yYards: number };
  headingDegrees: number;
  isInFlight: boolean;
  isComplete: boolean;
  onPreviousEquipment: () => void;
  onNextEquipment: () => void;
  onAimLeft: () => void;
  onAimRight: () => void;
  onCharge: () => void;
  onRelease: () => void;
  onCancelCharge: () => void;
}) {
  const equipment =
    SWING_CLUBS.find((club) => club.id === props.selectedClubId) ?? PUTTER;
  const result = props.shotResultBanner;
  return (
    <CoursePlayerInterface
      sport="golf"
      courseName={COURSE_NAME}
      holeName={props.courseHole.name}
      holeNumber={props.courseHole.holeNumber}
      par={props.courseHole.par}
      playerName={props.playerName}
      scoreLabel={
        props.scoreVsPar === 0
          ? "E"
          : `${props.scoreVsPar > 0 ? "+" : ""}${props.scoreVsPar}`
      }
      strokes={props.strokesThisHole}
      totalStrokes={props.totalStrokes}
      distanceYards={props.yardsToCup}
      lieLabel={props.lieLabel}
      message={props.operatorMessage}
      power={props.windPower}
      isInFlight={props.isInFlight}
      isComplete={props.isComplete}
      isAiming={props.playMode === "direction"}
      windSpeedMph={Math.round(props.courseWind.speedMph)}
      windHeadingDegrees={props.courseWind.blowToHeadingDegrees}
      equipmentName={equipment.name}
      equipmentDetail={
        props.isPutterLocked
          ? "On the green · putter"
          : `${equipment.carryYards} yd carry · [ ] to change`
      }
      canChangeEquipment={!props.isPutterLocked}
      onPreviousEquipment={props.onPreviousEquipment}
      onNextEquipment={props.onNextEquipment}
      onAim={props.onSelectDirectionMode}
      onPrepareShot={props.onSelectShootMode}
      onAimLeft={props.onAimLeft}
      onAimRight={props.onAimRight}
      onCharge={props.onCharge}
      onRelease={props.onRelease}
      onCancelCharge={props.onCancelCharge}
      tee={props.courseHole.tee}
      target={props.courseHole.cup}
      position={props.position}
      fairwayWaypoints={props.courseHole.fairwayWaypoints}
      waters={props.courseHole.waters}
      headingDegrees={props.headingDegrees}
      result={
        result
          ? {
              key: result.bannerKey,
              powerPercent: result.powerPercent,
              travelYards: result.travelYards,
            }
          : null
      }
    />
  );
}
