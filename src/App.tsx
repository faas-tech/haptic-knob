import { useState } from "react";
import { DiscGolfDemo } from "./demos/disc-golf/DiscGolfDemo";
import { GolfDemo } from "./demos/golf/GolfDemo";
import { RulerDemo } from "./demos/ruler/RulerDemo";
import {
  DiscGolfHeaderActions,
  type DiscGolfHeaderActionsState,
} from "./ui/DiscGolfHeaderActions";
import {
  GolfHeaderActions,
  type GolfHeaderActionsState,
} from "./ui/GolfHeaderActions";
import {
  RulerHeaderActions,
  type RulerHeaderActionsState,
} from "./ui/RulerHeaderActions";
import { LabShell } from "./ui/LabShell";
import { LaunchScreen } from "./ui/LaunchScreen";
import { useLabRoute } from "./ui/useLabRoute";
import { useSmartKnob } from "./ui/useSmartKnob";

export function App() {
  const smartKnob = useSmartKnob();
  const { route, openRoute } = useLabRoute();
  const isRulerOpen = route === "/ruler";
  const isGolfOpen = route === "/golf";
  const isDiscGolfOpen = route === "/disc-golf";
  const [rulerHeaderActions, setRulerHeaderActions] =
    useState<RulerHeaderActionsState | null>(null);
  const [golfHeaderActions, setGolfHeaderActions] =
    useState<GolfHeaderActionsState | null>(null);
  const [discGolfHeaderActions, setDiscGolfHeaderActions] =
    useState<DiscGolfHeaderActionsState | null>(null);

  return (
    <LabShell
      connectionStatus={smartKnob.connectionStatus}
      deviceName={smartKnob.deviceName}
      errorMessage={smartKnob.errorMessage}
      isWebBluetoothSupported={smartKnob.isWebBluetoothSupported}
      onConnect={() => void smartKnob.connect()}
      onDisconnect={smartKnob.disconnect}
      onBackToLaunch={() => openRoute("/")}
      showBackToLaunch={isRulerOpen || isGolfOpen || isDiscGolfOpen}
      headerExtra={
        isRulerOpen && rulerHeaderActions ? (
          <RulerHeaderActions {...rulerHeaderActions} />
        ) : isGolfOpen && golfHeaderActions ? (
          <GolfHeaderActions {...golfHeaderActions} />
        ) : isDiscGolfOpen && discGolfHeaderActions ? (
          <DiscGolfHeaderActions {...discGolfHeaderActions} />
        ) : null
      }
    >
      {isRulerOpen ? (
        <RulerDemo
          isConnected={smartKnob.connectionStatus === "connected"}
          latestStreamSample={smartKnob.latestStreamSample}
          sendKnobCommand={smartKnob.sendKnobCommand}
          onHeaderActionsChange={setRulerHeaderActions}
        />
      ) : isGolfOpen ? (
        <GolfDemo
          isConnected={smartKnob.connectionStatus === "connected"}
          latestStreamSample={smartKnob.latestStreamSample}
          sendKnobCommand={smartKnob.sendKnobCommand}
          onHeaderActionsChange={setGolfHeaderActions}
        />
      ) : isDiscGolfOpen ? (
        <DiscGolfDemo
          isConnected={smartKnob.connectionStatus === "connected"}
          latestStreamSample={smartKnob.latestStreamSample}
          sendKnobCommand={smartKnob.sendKnobCommand}
          onHeaderActionsChange={setDiscGolfHeaderActions}
        />
      ) : (
        <LaunchScreen onOpenApp={openRoute} />
      )}
    </LabShell>
  );
}
