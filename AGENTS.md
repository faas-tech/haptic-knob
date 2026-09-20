# Agent defaults

Use [readable-names](.cursor/skills/readable-names/SKILL.md) for code, file, and variable names.

Use Give It to Me Straight (`~/.agents/skills/give-it-to-me-straight/SKILL.md`) for documentation, comments, and on-screen copy. After every draft, run the second pass in `references/second-pass.md`: read the last sentence of each paragraph and cut `it's not X, it's Y` closers.

Read [docs/knob-interface.md](docs/knob-interface.md) and [docs/controlling-the-smartknob.md](docs/controlling-the-smartknob.md) before changing Bluetooth or haptic code.

## Stack

Vite, React, TypeScript. Run in Google Chrome on macOS. Web Bluetooth needs a user click, on localhost or HTTPS.

## Boundaries

- Put connection, command strings, and reply parsers in `src/sdk/`.
- Put each demo in `src/demos/<demo-name>/`.
- A demo receives `sendKnobCommand` and stream samples. Bluetooth stays in `src/sdk/`.
- Do not invent firmware commands. If the kit replies to `help` or `id` with new verbs, add them to the SDK and the interface note in the same change.
- Official detent mode is evenly spaced clicks with one stiffness. The ruler sends a new `detent` settings line when the nearest mark type changes. Call that experimental.

## First demo

The ruler maps unwrapped knob degrees to 0-12 inches at one inch per revolution and 16 detents per turn.
