export type RulerHeaderActionsState = {
  isConnected: boolean;
  isMotorEnabled: boolean;
  onEnableMotor: () => void;
};

export function RulerHeaderActions(props: RulerHeaderActionsState) {
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
    </div>
  );
}
