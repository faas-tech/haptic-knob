# Controlling the SmartKnob

A demo talks to the kit by sending short UTF-8 command lines over Web Bluetooth. The motor runs one feel at a time. This note is for someone adding a demo under `src/demos/`. The recovered command list lives in [knob-interface.md](knob-interface.md).

## Hardware and browser

1. Plug in the kit and turn the knob on. The light flashes blue until something connects.
2. The Bluetooth name is `SmartKnob_XXXX`. The four characters are printed under the stand.
3. Open this lab in Google Chrome on macOS, on `localhost` or HTTPS. Web Bluetooth starts from a user click.

Connection, command strings, and reply parsers stay in `src/sdk/`. A demo never calls `navigator.bluetooth`.

## How a demo sends a command

Each demo receives three things from the lab shell:

| Prop | What it is |
|---|---|
| `isConnected` | The kit accepted the Bluetooth session |
| `sendKnobCommand` | Writes one command line and waits for `ok` or `err` |
| `latestStreamSample` | Latest unwrapped position and velocity from `stream 50` |

`sendKnobCommand("detent count=16 k=12 b=10")` is the whole instruction path. The SDK writes that string to the Nordic UART write characteristic (`6e400002-b5a3-f393-e0a9-e50e24dcca9e`). The kit replies on the notify characteristic. `KnobCommandReply.confirmed` is true only when the reply is `ok`.

Do not invent verbs. If `help` or `id` on a later kit shows a new command, add it to `src/sdk/commands.ts` and [knob-interface.md](knob-interface.md) in the same change.

## Enable the motor first

After connect, call `enableKnobMotor(sendKnobCommand)` from `src/sdk/applyHapticMode.ts`. That sends `motor on`, then `mode none`. The Mode Selector does the same. Then start the position stream:

```
stream 50
```

Stream lines look like `~ p=0x8000 v=128`. Position degrees are `p * 360 / 65536`. Velocity in degrees per second is `v * 360 / 256`. `unwrapAngleDegrees` in the SDK turns the 0-360 wrap into a running angle so a left turn can keep going past one revolution.

Until `motor on` succeeds, mode commands do nothing useful.

## One mode at a time

`mode` selects the feel. Then a settings line sets the numbers. `applyHapticMode` sends both, in that order.

| Mode | Settings line | What the hand feels |
|---|---|---|
| `none` | none | Motor can stay on. No haptic force. |
| `damper` | `damper b=20` | Resistance against velocity. Fluid drag. `b` is 0-100. |
| `spring` | `spring k=25 b=40` | Pulls back toward the firmware rest position. `k` is stiffness, `b` is damping. Both 0-100. |
| `detent` | `detent count=20 k=10 b=10` | Evenly spaced clicks around one turn. `count` is 4-100. One `k` and `b` for every click. |

The kit cannot run detent and spring together. If a demo needs clicks one way and a wind-up the other way, it must watch turn direction and send a new `mode` line when the hand reverses. Golf does that in `src/demos/golf/golfKnobTurn.ts` using stream velocity and the change in unwrapped angle. A rightward reverse sends `mode spring` as soon as velocity turns positive.

Large jumps in `k` or `b` can make the motor buzz or run away. Change one value at a time and keep a hand on the knob.

There is no observed command for a per-click strength, a named spring center, or endstops. The ruler's five click strengths are a live retune: 16 clicks per turn, and `detent k= b=` only in the gap before the next sixteenth, eighth, quarter, half, or inch. Call that experimental.

## Store an address when an action starts

The stream reports where the shaft is, not what the player meant. Demos that treat a turn as aim or power store an address: the unwrapped angle at the moment that action started. Delta is `unwrappedDegrees - addressDegrees`. After you send a new `mode` line, ignore samples for a short settle (a few hundred milliseconds), then store a fresh address. The motor often moves the shaft when the feel changes. If you count that motion as player input, the demo will aim off the pin or fire a swing by itself.

## Naming the commands in code

Keep the firmware words in the command string. Name your functions for the action the demo is taking.

| Firmware line | Function that should send it |
|---|---|
| `motor on` then `mode none` | `enableKnobMotor` |
| `mode detent` then `detent count= k= b=` | `applyHapticMode(..., "detent", { detentCount, stiffnessPercent, dampingPercent })` |
| `mode spring` then `spring k= b=` | `applyHapticMode(..., "spring", { stiffnessPercent, dampingPercent })` |
| `mode damper` then `damper b=` | `applyHapticMode(..., "damper", { dampingPercent })` |

Booleans on the demo side use `is`, `has`, `should`, or `can`. Numbers include the unit: `stiffnessPercent`, `positionDegrees`, `velocityDegreesPerSecond`, `HAPTIC_SETTLE_MS`.

## Add a demo

1. Read this file and [knob-interface.md](knob-interface.md).
2. Create `src/demos/<demo-name>/` with a component that takes `isConnected`, `latestStreamSample`, and `sendKnobCommand`.
3. Enable the motor before you apply a mode.
4. Wire the route from `src/apps/labApps.ts` and `src/App.tsx`.
5. Use readable-names for files and functions: `RulerDemo`, `applyRulerDetents`, `connectSmartKnob`.

The add-haptic-demo skill in `.cursor/skills/add-haptic-demo/` is the same checklist for agents.

## Commands the Mode Selector used

| Command | Use |
|---|---|
| `id` | Identity after connect |
| `status` | Motor, mode, position, fault |
| `pos` | One-shot position |
| `stream 50` | Position stream at 50 Hz |
| `motor on` / `motor off` | Enable or stop the motor |
| `mode none` / `mode damper` / `mode spring` / `mode detent` | Select the feel |
| `damper b=` | Damper force |
| `spring k= b=` | Spring stiffness and damping |
| `detent count= k= b=` | Click count and one stiffness |
| `fault clear` | Clear a reported fault |

Confirm a new kit with `id`, `status`, and a live `ok` before treating a line as settled.
