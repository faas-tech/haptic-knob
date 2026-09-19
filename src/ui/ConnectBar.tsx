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

  let statusLabel = "SmartKnob not connected";
  if (props.connectionStatus === "connecting") {
    statusLabel = "Connecting...";
  } else if (isConnected) {
    statusLabel = `Connected to ${props.deviceName}`;
  } else if (props.connectionStatus === "error") {
    statusLabel = props.errorMessage ?? "Connection failed";
  }

  return (
    <header className="connect-bar">
      <div>
        <p className="eyebrow">Haptic Knob Lab</p>
        <p className="status-line">{statusLabel}</p>
        {!props.isWebBluetoothSupported && (
          <p className="warning">
            Open this page in Google Chrome. Safari has no Web Bluetooth.
          </p>
        )}
      </div>
      <button
        type="button"
        disabled={!canConnect}
        onClick={isConnected ? props.onDisconnect : props.onConnect}
      >
        {isConnected ? "Disconnect" : "Connect Smart Knob"}
      </button>
    </header>
  );
}
