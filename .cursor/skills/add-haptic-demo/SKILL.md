---
name: add-haptic-demo
description: >-
  Add a new SmartKnob demo folder under src/demos. Use when creating a
  game, tool, or feel study that should talk to the knob through the SDK.
---

# Add a haptic demo

1. Read `docs/knob-interface.md` and `src/sdk/index.ts`.
2. Create `src/demos/<demo-name>/` with a React component that takes
   `isConnected`, `latestStreamSample`, and `sendKnobCommand`.
3. Do not call `navigator.bluetooth` from the demo.
4. Enable the motor with `enableKnobMotor` before applying a mode.
5. Use only commands already in `src/sdk/commands.ts`, or add a newly
   observed command to the SDK and `docs/knob-interface.md` together.
6. Wire the demo from `src/App.tsx`.
7. Name files and functions with [readable-names](../readable-names/SKILL.md): verb + object, booleans with `is`/`has`/`should`/`can`. Example: `RulerDemo`, `applyRulerDetents`.
