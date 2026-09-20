import { SWING_CLUBS, type ClubId } from "./golfClubs";

export const CLUB_REEL_SLOT_PX = 26;

export function ClubSelectorReel(props: {
  selectedClubId: ClubId;
  isPutterLocked: boolean;
}) {
  const selectedIndex = SWING_CLUBS.findIndex(
    (club) => club.id === props.selectedClubId,
  );
  const reelIndex = selectedIndex === -1 ? 0 : selectedIndex;
  const reelEntries = [
    SWING_CLUBS[SWING_CLUBS.length - 1],
    ...SWING_CLUBS,
    SWING_CLUBS[0],
  ];

  return (
    <div
      className={
        props.isPutterLocked ? "club-reel is-putter" : "club-reel"
      }
      aria-label="Club selector"
    >
      {props.isPutterLocked ? (
        <span className="club-reel-seat is-selected">Pt</span>
      ) : (
        <div
          className="club-reel-track"
          style={{
            transform: `translateY(${-reelIndex * CLUB_REEL_SLOT_PX}px)`,
          }}
        >
          {reelEntries.map((club, index) => (
            <span
              key={`${club.id}-${index}`}
              className={
                club.id === props.selectedClubId
                  ? "club-reel-seat is-selected"
                  : "club-reel-seat"
              }
            >
              {club.shortName}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
