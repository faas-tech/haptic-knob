import { useCallback, useEffect, useRef, useState } from "react";
import {
  connectSmartKnob,
  isWebBluetoothSupported,
  parseStatusLine,
  parseStreamLine,
  type KnobConnectionStatus,
  type KnobStatusReport,
  type KnobStreamSample,
  type SmartKnobConnection,
} from "../sdk";

export function useSmartKnob() {
  const [connectionStatus, setConnectionStatus] =
    useState<KnobConnectionStatus>("disconnected");
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [latestStatusReport, setLatestStatusReport] =
    useState<KnobStatusReport>({});
  const [latestStreamSample, setLatestStreamSample] =
    useState<KnobStreamSample | null>(null);
  const connectionRef = useRef<SmartKnobConnection | null>(null);

  const disconnect = useCallback(() => {
    connectionRef.current?.disconnect();
    connectionRef.current = null;
    setConnectionStatus("disconnected");
    setDeviceName(null);
  }, []);

  const connect = useCallback(async () => {
    if (!isWebBluetoothSupported()) {
      setConnectionStatus("error");
      setErrorMessage(
        "Web Bluetooth is missing. Open this page in Google Chrome on this Mac.",
      );
      return;
    }

    setConnectionStatus("connecting");
    setErrorMessage(null);

    try {
      const connection = await connectSmartKnob({
        onDisconnected: () => {
          connectionRef.current = null;
          setConnectionStatus("disconnected");
          setDeviceName(null);
        },
      });

      connectionRef.current = connection;
      setDeviceName(connection.deviceName);
      setConnectionStatus("connected");

      connection.subscribeToReplyLines((line) => {
        const streamSample = parseStreamLine(line);
        if (streamSample) {
          setLatestStreamSample(streamSample);
          return;
        }

        const parsedStatusReport = parseStatusLine(line);
        if (Object.keys(parsedStatusReport).length > 0) {
          setLatestStatusReport((current) => ({
            ...current,
            ...parsedStatusReport,
          }));
        }
      });
    } catch (error) {
      setConnectionStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Connection failed",
      );
    }
  }, []);

  const sendKnobCommand = useCallback(async (command: string) => {
    const connection = connectionRef.current;
    if (!connection) {
      return {
        sent: false,
        confirmed: false,
        error: { code: -4, message: "Not connected" },
        replyBody: null,
      };
    }

    return connection.sendKnobCommandAndWaitForOk(command);
  }, []);

  useEffect(() => {
    return () => {
      connectionRef.current?.disconnect();
    };
  }, []);

  return {
    connectionStatus,
    deviceName,
    errorMessage,
    latestStatusReport,
    latestStreamSample,
    connect,
    disconnect,
    sendKnobCommand,
    isWebBluetoothSupported: isWebBluetoothSupported(),
  };
}
