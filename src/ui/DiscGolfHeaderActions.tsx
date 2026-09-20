export type DiscGolfHeaderActionsState = {
  isConnected: boolean;
  isMotorEnabled: boolean;
  canThrow: boolean;
  onEnableMotor: () => void;
  onThrowPractice: () => void;
};

export function DiscGolfHeaderActions(props: DiscGolfHeaderActionsState) {
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
        disabled={!props.canThrow}
        onClick={props.onThrowPractice}
      >
        Throw 55%
      </button>
    </div>
  );
}
