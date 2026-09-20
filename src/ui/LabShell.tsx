import type { ReactNode } from "react";
import { EcmLogo } from "../brand/EcmLogo";
import { ChevronLeftIcon } from "../brand/LabIcons";
import { ConnectBar } from "./ConnectBar";
import type { KnobConnectionStatus } from "../sdk";

export function LabShell(props: {
  connectionStatus: KnobConnectionStatus;
  deviceName: string | null;
  errorMessage: string | null;
  isWebBluetoothSupported: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onBackToLaunch: () => void;
  showBackToLaunch: boolean;
  headerExtra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <header className="lab-header">
        <div className="lab-brand">
          {props.showBackToLaunch ? (
            <button
              type="button"
              className="button-ghost back-button"
              onClick={props.onBackToLaunch}
            >
              <ChevronLeftIcon className="button-icon" />
              Launch pad
            </button>
          ) : (
            <EcmLogo />
          )}
          <div className="lab-title-block">
            <p className="eyebrow">PCB Stator</p>
            <p className="lab-title">SmartKnob Lab</p>
          </div>
        </div>
        {props.headerExtra ? (
          <div className="lab-header-extra">{props.headerExtra}</div>
        ) : null}
        <ConnectBar
          connectionStatus={props.connectionStatus}
          deviceName={props.deviceName}
          errorMessage={props.errorMessage}
          isWebBluetoothSupported={props.isWebBluetoothSupported}
          onConnect={props.onConnect}
          onDisconnect={props.onDisconnect}
        />
      </header>
      <main className="app-stage">{props.children}</main>
    </div>
  );
}
