# Haptic Knob Lab

Chrome lab for the ECM SmartKnob kit. First demo is a 12-inch ruler.

## Key rules

1. Read [docs/knob-interface.md](docs/knob-interface.md) before sending a new Bluetooth command. Observed commands live in `src/sdk/commands.ts`.
2. Demos call `sendKnobCommand`. Bluetooth stays in `src/sdk/`.
3. Use [readable-names](.cursor/skills/readable-names/SKILL.md) for identifiers.
4. Use Give It to Me Straight for documentation. After drafting, run the last-sentence second pass.
5. First browser is Google Chrome on macOS.
6. The official detent command has one stiffness for all clicks. Per-mark strength on the ruler is a live `detent k= b=` experiment.

## Key documentation

| Topic | File |
|---|---|
| Human setup | [README.md](README.md) |
| Bluetooth commands | [docs/knob-interface.md](docs/knob-interface.md) |
| Agent defaults | [AGENTS.md](AGENTS.md) |
| Code names | [.cursor/skills/readable-names/SKILL.md](.cursor/skills/readable-names/SKILL.md) |
| Documentation | `~/.agents/skills/give-it-to-me-straight/SKILL.md` |

## Skills

| Skill | When |
|---|---|
| `readable-names` | Code, file, and variable names |
| `give-it-to-me-straight` | Docs, comments, on-screen copy, then a last-sentence slop pass |
| `ecm-ai-language` | Extra vocabulary help if straight talk is not enough |
| `add-haptic-demo` | Adding a new demo folder |

## Commands

```bash
npm install
npm test
npm run dev
```
