# SmartKnob interface (recovered)

These commands came from the public Mode Selector app on 19 September 2026. Confirm each one on the kit in this room with `id`, `status`, and a live `ok` before treating it as settled.

Official Mode Selector: https://ecm-smartknob-mode-selector.base44.app/

## Hardware

1. Plug in the kit power cable and turn the knob on.
2. The light flashes blue while it waits for a connection.
3. The Bluetooth name is `SmartKnob_XXXX`. The four characters are printed under the stand.
4. Open this lab in Google Chrome on the Mac. The official iOS path is Bluefy. This repo's first target is macOS Chrome.

## Bluetooth

The firmware presents the Nordic UART service.

| Role | UUID |
|---|---|
| Service | `6e400001-b5a3-f393-e0a9-e50e24dcca9e` |
| Write (host to knob) | `6e400002-b5a3-f393-e0a9-e50e24dcca9e` |
| Notify (knob to host) | `6e400003-b5a3-f393-e0a9-e50e24dcca9e` |

Lines are UTF-8 text. Replies end with `ok` or `err <code> <message>`. Error `3` showed up in the Mode Selector while the device was still booting.

## Commands observed

| Command | What the Mode Selector uses it for |
|---|---|
| `id` | Read device identity after connect |
| `status` | Motor, mode, position, fault |
| `pos` | One-shot position |
| `stream 50` | Start a position stream |
| `motor on` / `motor off` | Enable or stop the motor |
| `mode none` / `mode damper` / `mode spring` / `mode detent` | Select a haptic mode |
| `damper b=20` | Damping force, 0-100 |
| `spring k=25 b=40` | Stiffness and damping |
| `detent count=20 k=10 b=10` | Evenly spaced clicks, one stiffness for all of them |
| `fault clear` | Clear a reported fault |

After `motor on`, the Mode Selector sends `mode none` before any other feel.

## Status and stream lines

Status is space-separated `key=value` tokens:

- `position.deg`
- `velocity.dps`
- `status.enabled` (`1` means the motor is on)
- `control.enable`
- `mode` (`0` none, `1` damper, `2` spring, `3` detent)
- `fault`, `fault.names`

Stream lines look like:

```
~ p=0x8000 v=128
```

- Position degrees = `p * 360 / 65536`
- Velocity degrees per second = `v * 360 / 256`

## Modes

**Damper.** Velocity-based resistance. Feels like turning through fluid.

**Spring.** Returns toward center. Stiffness `k` and damping `b` are paired in the Mode Selector.

**Detent.** Regular clicks, like a stepped switch. `count` is 4-100. `k` and `b` apply to every click. No observed command sets a different strength per click.

**Mode none.** Motor can stay on. No haptic feel.

The Mode Selector warns that large jumps in stiffness or damping can make the knob oscillate, buzz, or run away. Change one value at a time. Keep a hand on the knob.

## What this means for the ruler

The official detent command cannot draw four click strengths at once. The lab therefore:

1. Uses 16 detents per revolution (one sixteenth-inch click if one turn is one inch).
2. Maps unwrapped angle to 0-12 inches on screen.
3. Sends a new `detent k= b=` when the nearest mark type changes.

If a later `help` reply or ECM document adds per-detent strength or endstops, put those commands in `src/sdk/commands.ts` and update this file.
