import { terminatedKnobCommandLine } from "./commands";
import { parseCommandReply } from "./parseReplies";
import {
  NORDIC_UART_NOTIFY_CHARACTERISTIC_ID,
  NORDIC_UART_SERVICE_ID,
  NORDIC_UART_WRITE_CHARACTERISTIC_ID,
  type KnobCommandReply,
} from "./types";

export type SmartKnobConnection = {
  deviceName: string;
  writeCommandLine: (line: string) => Promise<void>;
  sendKnobCommandAndWaitForOk: (
    command: string,
    timeoutMs?: number,
  ) => Promise<KnobCommandReply>;
  subscribeToReplyLines: (listener: (line: string) => void) => () => void;
  disconnect: () => void;
};

export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== "undefined" && Boolean(navigator.bluetooth);
}

export async function connectSmartKnob(options: {
  onDisconnected: () => void;
}): Promise<SmartKnobConnection> {
  if (!isWebBluetoothSupported()) {
    throw new Error(
      "This browser does not support Web Bluetooth. Use Google Chrome on macOS.",
    );
  }

  const device = await navigator.bluetooth.requestDevice({
    filters: [{ namePrefix: "SmartKnob_" }],
    optionalServices: [NORDIC_UART_SERVICE_ID],
  });

  if (!device.gatt) {
    throw new Error("The selected device has no GATT server.");
  }

  device.addEventListener("gattserverdisconnected", options.onDisconnected);

  const gattServer = await device.gatt.connect();
  const uartService = await gattServer.getPrimaryService(NORDIC_UART_SERVICE_ID);
  const writeCharacteristic = await uartService.getCharacteristic(
    NORDIC_UART_WRITE_CHARACTERISTIC_ID,
  );
  const notifyCharacteristic = await uartService.getCharacteristic(
    NORDIC_UART_NOTIFY_CHARACTERISTIC_ID,
  );

  await notifyCharacteristic.startNotifications();

  const replyLineListeners = new Set<(line: string) => void>();
  let incomingReplyText = "";
  let pendingCommandReply:
    | {
        resolve: (reply: KnobCommandReply) => void;
        lines: string[];
        timer: number;
        generation: number;
      }
    | null = null;
  let commandReplyGeneration = 0;
  const waitingCommands: Array<{
    command: string;
    timeoutMs: number;
    resolve: (reply: KnobCommandReply) => void;
  }> = [];
  let isSendingCommand = false;

  const deliverReplyLine = (line: string) => {
    const cleanedLine = line.replace(/\0/g, "").trim();
    if (!cleanedLine) {
      return;
    }

    for (const listener of replyLineListeners) {
      listener(cleanedLine);
    }

    const parsedReply = parseCommandReply(cleanedLine);
    if (!parsedReply) {
      if (pendingCommandReply) {
        pendingCommandReply.lines.push(cleanedLine);
      }
      return;
    }

    if (pendingCommandReply) {
      window.clearTimeout(pendingCommandReply.timer);
      const replyBody = pendingCommandReply.lines.join("\n");
      const pending = pendingCommandReply;
      pendingCommandReply = null;
      pending.resolve({
        sent: true,
        confirmed: parsedReply.confirmed,
        error: parsedReply.error,
        replyBody: replyBody || null,
      });
    }
  };

  notifyCharacteristic.addEventListener("characteristicvaluechanged", (event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    if (!target.value) {
      return;
    }

    incomingReplyText += new TextDecoder().decode(target.value);

    let newlineIndex = incomingReplyText.search(/[\r\n]/);
    while (newlineIndex !== -1) {
      const line = incomingReplyText.slice(0, newlineIndex);
      const newlineLength = incomingReplyText.startsWith("\r\n", newlineIndex)
        ? 2
        : 1;
      incomingReplyText = incomingReplyText.slice(newlineIndex + newlineLength);
      deliverReplyLine(line);
      newlineIndex = incomingReplyText.search(/[\r\n]/);
    }
  });

  const writeCommandLine = async (line: string) => {
    await writeCharacteristic.writeValue(
      new TextEncoder().encode(terminatedKnobCommandLine(line)),
    );
  };

  const sendQueuedCommand = (command: string, timeoutMs: number) =>
    new Promise<KnobCommandReply>((resolve) => {
      commandReplyGeneration += 1;
      const generation = commandReplyGeneration;
      pendingCommandReply = {
        generation,
        lines: [],
        resolve: (reply) => {
          resolve(reply);
          isSendingCommand = false;
          void sendNextWaitingCommand();
        },
        timer: window.setTimeout(() => {
          if (
            pendingCommandReply == null ||
            pendingCommandReply.generation !== generation
          ) {
            return;
          }
          pendingCommandReply = null;
          resolve({
            sent: true,
            confirmed: false,
            error: { code: -2, message: "Timed out waiting for ok" },
            replyBody: null,
          });
          isSendingCommand = false;
          window.setTimeout(() => {
            void sendNextWaitingCommand();
          }, 80);
        }, timeoutMs),
      };

      writeCommandLine(command).catch((error: unknown) => {
        if (pendingCommandReply) {
          window.clearTimeout(pendingCommandReply.timer);
          pendingCommandReply = null;
        }
        resolve({
          sent: false,
          confirmed: false,
          error: {
            code: -3,
            message: error instanceof Error ? error.message : "Write failed",
          },
          replyBody: null,
        });
        isSendingCommand = false;
        void sendNextWaitingCommand();
      });
    });

  const sendNextWaitingCommand = async () => {
    if (isSendingCommand || waitingCommands.length === 0) {
      return;
    }
    const nextCommand = waitingCommands.shift();
    if (!nextCommand) {
      return;
    }
    isSendingCommand = true;
    const reply = await sendQueuedCommand(
      nextCommand.command,
      nextCommand.timeoutMs,
    );
    nextCommand.resolve(reply);
  };

  return {
    deviceName: device.name ?? "SmartKnob",
    writeCommandLine,
    sendKnobCommandAndWaitForOk: (command, timeoutMs = 3000) =>
      new Promise((resolve) => {
        waitingCommands.push({
          command,
          timeoutMs,
          resolve,
        });
        void sendNextWaitingCommand();
      }),
    subscribeToReplyLines: (listener) => {
      replyLineListeners.add(listener);
      return () => {
        replyLineListeners.delete(listener);
      };
    },
    disconnect: () => {
      if (device.gatt?.connected) {
        device.gatt.disconnect();
      }
    },
  };
}
