export type GolfHeaderActionsState = {
  isConnected: boolean;
  isMotorEnabled: boolean;
  canHitShot: boolean;
  onEnableMotor: () => void;
  onHitPracticeShot: () => void;
};

export function GolfHeaderActions(props: GolfHeaderActionsState) {
  return (
    <div className="golf-header-actions">
      <button
        type="button"
        className={props.isMotorEnabled ? "button-ghost" : "button-primary"}
        disabled={!props.isConnected}
        onClick={props.onEnableMotor}
      >
        <span
          className={
            props.isMotorEnabled
              ? "signal-dot signal-connected"
              : "signal-dot"
          }
          aria-hidden="true"
        />
        {props.isMotorEnabled ? "Motor on" : "Enable motor"}
      </button>
      <button
        type="button"
        className="button-ghost"
        disabled={!props.canHitShot}
        onClick={props.onHitPracticeShot}
      >
        Hit 55%
      </button>
    </div>
  );
}
