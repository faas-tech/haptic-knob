# Haptic Knob Lab

Chrome app for one ECM SmartKnob developer kit. The first demo is a 12-inch ruler with detent clicks.

Later demos (games, tools, feel studies) should call `sendKnobCommand` on the same TypeScript kit.

## What you need

- The kit: one SmartKnob and its power cable
- A Mac with Bluetooth on
- Google Chrome
- The four-character ID printed under the stand

Power the knob. The light flashes blue while it waits. After Chrome connects, the light should go green.

ECM's own controls, if you want them first:

https://ecm-smartknob-mode-selector.base44.app/

## Why this stack

The knob is a Bluetooth device. The browser talks to it with Web Bluetooth. That API needs a secure context (localhost or HTTPS) and a click.

Vite + React + TypeScript in Chrome is the first path. Fast refresh, no server, localhost already counts as secure.

Skip Next.js for now. The connection and demos live in the page.

A native Mac app is a later option if Chrome's Bluetooth limits get in the way.

Scott Bezek's open-source SmartKnob talks USB serial and protobuf. This ECM kit uses the Nordic UART service and plain text commands. Details: [docs/knob-interface.md](docs/knob-interface.md).

## Run the lab

```bash
npm install
npm test
npm run dev
```

Open http://localhost:5173 in Chrome. Click **Connect Smart Knob**. Pick `SmartKnob_XXXX`. Enable the motor, then apply ruler detents.

Arrow keys move the on-screen ruler when the knob is offline.

## How the code is split

- `src/sdk/` connects, sends a line, parses `ok` / status / stream, and applies a named haptic mode.
- `src/demos/` holds one folder per demo. A demo receives `sendKnobCommand` and position samples.
- `src/ui/` is the Chrome shell.

Add a new demo under `src/demos/`. Call the kit. Do not copy GATT UUIDs into a demo.

## First demo: ruler

One revolution is one inch. Sixteen detents per revolution are the sixteenth-inch marks. The screen shows a 12-inch stick and a red hairline at the current position.

The firmware's detent command uses one stiffness for every click. The ruler sends a new `detent k=` and `b=` when you approach a quarter, a half, or an inch. If the knob buzzes or runs, drop stiffness and keep a hand on it.

## Naming and voice

Use [readable-names](.cursor/skills/readable-names/SKILL.md) for identifiers.

Use Give It to Me Straight (`~/.agents/skills/give-it-to-me-straight`) for documentation and on-screen copy. After drafting, reread the last sentence of every paragraph and cut generated contrast closers.
