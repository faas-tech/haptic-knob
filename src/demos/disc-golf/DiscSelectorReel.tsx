import { DISC_BAG, type DiscId } from "./discGolfDiscs";

export const DISC_REEL_SLOT_PX = 26;

export function DiscSelectorReel(props: { selectedDiscId: DiscId }) {
  const selectedIndex = DISC_BAG.findIndex(
    (disc) => disc.id === props.selectedDiscId,
  );
  const reelIndex = selectedIndex === -1 ? 1 : selectedIndex;
  const reelEntries = [
    DISC_BAG[DISC_BAG.length - 1],
    ...DISC_BAG,
    DISC_BAG[0],
  ];

  return (
    <div className="club-reel" aria-label="Disc selector">
      <div
        className="club-reel-track"
        style={{
          transform: `translateY(${-reelIndex * DISC_REEL_SLOT_PX}px)`,
        }}
      >
        {reelEntries.map((disc, index) => (
          <span
            key={`${disc.id}-${index}`}
            className={
              disc.id === props.selectedDiscId
                ? "club-reel-seat is-selected"
                : "club-reel-seat"
            }
          >
            {disc.shortName}
          </span>
        ))}
      </div>
    </div>
  );
}
