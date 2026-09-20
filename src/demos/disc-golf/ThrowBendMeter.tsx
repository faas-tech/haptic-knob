const LEFT_ARC = "M 80 108 A 58 58 0 0 1 24 42";
const RIGHT_ARC = "M 80 108 A 58 58 0 0 0 136 42";
const ARC_LENGTH = 118;

export function ThrowBendMeter(props: {
  throwPower: number;
  throwHyzer01: number;
}) {
  const leftFill01 =
    props.throwHyzer01 < -0.04 ? props.throwPower : 0;
  const rightFill01 =
    props.throwHyzer01 > 0.04 ? props.throwPower : 0;
  const isFlat =
    props.throwPower > 0.03 && Math.abs(props.throwHyzer01) <= 0.04;
  const sideLabel =
    leftFill01 > 0 ? "Hyzer" : rightFill01 > 0 ? "Anhyzer" : isFlat ? "Flat" : "Throw";

  return (
    <div
      className="throw-bend-meter"
      aria-label={`${sideLabel} ${Math.round(props.throwPower * 100)} percent`}
    >
      <svg viewBox="0 0 160 128" aria-hidden="true">
        <path
          className="throw-bend-track throw-bend-track-left"
          d={LEFT_ARC}
          pathLength={ARC_LENGTH}
        />
        <path
          className="throw-bend-track throw-bend-track-right"
          d={RIGHT_ARC}
          pathLength={ARC_LENGTH}
        />
        <path
          className={
            leftFill01 > 0.03
              ? "throw-bend-fill throw-bend-fill-left is-winding"
              : "throw-bend-fill throw-bend-fill-left"
          }
          d={LEFT_ARC}
          pathLength={ARC_LENGTH}
          style={{
            strokeDasharray: ARC_LENGTH,
            strokeDashoffset: ARC_LENGTH * (1 - leftFill01),
          }}
        />
        <path
          className={
            rightFill01 > 0.03
              ? "throw-bend-fill throw-bend-fill-right is-winding"
              : "throw-bend-fill throw-bend-fill-right"
          }
          d={RIGHT_ARC}
          pathLength={ARC_LENGTH}
          style={{
            strokeDasharray: ARC_LENGTH,
            strokeDashoffset: ARC_LENGTH * (1 - rightFill01),
          }}
        />
        {isFlat ? (
          <path className="throw-bend-flat-mark" d="M 80 108 L 80 78" />
        ) : null}
        <text className="throw-bend-side-label" x="28" y="124" textAnchor="middle">
          Z
        </text>
        <text className="throw-bend-side-label" x="132" y="124" textAnchor="middle">
          X
        </text>
      </svg>
      <p className="throw-bend-readout">
        {Math.round(props.throwPower * 100)}%
        <small>{sideLabel}</small>
      </p>
    </div>
  );
}
