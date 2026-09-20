import { BluetoothIcon } from "../brand/LabIcons";
import type { KnobConnectionStatus } from "../sdk";

export function ConnectBar(props: {
  connectionStatus: KnobConnectionStatus;
  deviceName: string | null;
  errorMessage: string | null;
  isWebBluetoothSupported: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const canConnect = props.connectionStatus !== "connecting";
  const isConnected = props.connectionStatus === "connected";

  let statusLabel = "SmartKnob offline";
  if (props.connectionStatus === "connecting") {
    statusLabel = "Connecting…";
  } else if (isConnected) {
    statusLabel = props.deviceName ?? "Connected";
  } else if (props.connectionStatus === "error") {
    statusLabel = props.errorMessage ?? "Connection failed";
  }

  return (
    <div className="connect-bar">
      <div className="connect-status">
        <span
          className={`signal-dot signal-${props.connectionStatus}`}
          aria-hidden="true"
        />
        <BluetoothIcon className="connect-icon" />
        <p className="status-line">{statusLabel}</p>
      </div>
      {!props.isWebBluetoothSupported && (
        <p className="warning">Use Google Chrome on this Mac.</p>
      )}
      <button
        type="button"
        className={isConnected ? "button-ghost" : "button-primary"}
        disabled={!canConnect}
        onClick={isConnected ? props.onDisconnect : props.onConnect}
      >
        {isConnected ? "Disconnect" : "Connect Smart Knob"}
      </button>
    </div>
  );
}
