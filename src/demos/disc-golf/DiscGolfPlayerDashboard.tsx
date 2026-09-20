import { CoursePlayerInterface } from "../course-visuals/CoursePlayerInterface";
import { ThrowBendMeter } from "./ThrowBendMeter";
import { discById, type DiscId } from "./discGolfDiscs";
import { COURSE_NAME, type CourseHole } from "./discGolfCourse";
import type { CourseWind } from "./discGolfWind";
export type DiscGolfPlayMode = "direction" | "disc" | "throw";

export type DiscGolfThrowBanner = {
  bannerKey: number;
  powerPercent: number;
  travelYards: number;
  hyzerLabel: string;
};

export function DiscGolfPlayerDashboard(props: {
  playerName: string;
  courseHole: CourseHole;
  playMode: DiscGolfPlayMode;
  selectedDiscId: DiscId;
  throwPower: number;
  throwHyzer01: number;
  courseWind: CourseWind;
  throwsThisHole: number;
  yardsToBasket: number;
  scoreVsPar: number;
  totalThrows: number;
  completedHoleCount: number;
  operatorMessage: string;
  lieLabel: string;
  throwBanner: DiscGolfThrowBanner | null;
  onSelectDirectionMode: () => void;
  onSelectDiscMode: () => void;
  onSelectThrowMode: () => void;
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
  const equipment = discById(props.selectedDiscId);
  const result = props.throwBanner;
  return (
    <CoursePlayerInterface
      sport="disc-golf"
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
      strokes={props.throwsThisHole}
      totalStrokes={props.totalThrows}
      distanceYards={props.yardsToBasket}
      lieLabel={props.lieLabel}
      message={props.operatorMessage}
      power={props.throwPower}
      isInFlight={props.isInFlight}
      isComplete={props.isComplete}
      isAiming={props.playMode === "direction"}
      isSelectingClub={props.playMode === "disc"}
      onSelectClubMode={props.onSelectDiscMode}
      windSpeedMph={Math.round(props.courseWind.speedMph)}
      windHeadingDegrees={props.courseWind.blowToHeadingDegrees}
      equipmentName={equipment.name}
      equipmentDetail={`${equipment.carryYards} yd carry · C then turn`}
      canChangeEquipment={true}
      onPreviousEquipment={props.onPreviousEquipment}
      onNextEquipment={props.onNextEquipment}
      onAim={props.onSelectDirectionMode}
      onPrepareShot={props.onSelectThrowMode}
      onAimLeft={props.onAimLeft}
      onAimRight={props.onAimRight}
      onCharge={props.onCharge}
      onRelease={props.onRelease}
      onCancelCharge={props.onCancelCharge}
      tee={props.courseHole.tee}
      target={props.courseHole.basket}
      position={props.position}
      fairwayWaypoints={props.courseHole.fairwayWaypoints}
      waters={props.courseHole.waters}
      headingDegrees={props.headingDegrees}
      bendMeter={
        <ThrowBendMeter
          throwPower={props.throwPower}
          throwHyzer01={props.throwHyzer01}
        />
      }
      result={
        result
          ? {
              key: result.bannerKey,
              powerPercent: result.powerPercent,
              travelYards: result.travelYards,
              detail: result.hyzerLabel,
            }
          : null
      }
    />
  );
}
