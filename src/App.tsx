import { ConnectBar } from "./ui/ConnectBar";
import { RulerDemo } from "./demos/ruler/RulerDemo";
import { useSmartKnob } from "./ui/useSmartKnob";

export function App() {
  const smartKnob = useSmartKnob();

  return (
    <main className="app">
      <ConnectBar
        connectionStatus={smartKnob.connectionStatus}
        deviceName={smartKnob.deviceName}
        errorMessage={smartKnob.errorMessage}
        isWebBluetoothSupported={smartKnob.isWebBluetoothSupported}
        onConnect={() => void smartKnob.connect()}
        onDisconnect={smartKnob.disconnect}
      />
      <RulerDemo
        isConnected={smartKnob.connectionStatus === "connected"}
        latestStreamSample={smartKnob.latestStreamSample}
        sendKnobCommand={smartKnob.sendKnobCommand}
      />
    </main>
  );
}
