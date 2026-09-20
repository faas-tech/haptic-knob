# Nine-hole golf — first version

**Goal:** Play a 9-hole stroke-play course with the SmartKnob. Left turn picks a club. Right turn winds a spring and the release hits the ball.

**Architecture:** The demo lives in `src/demos/golf/`. Bluetooth stays in `src/sdk/`. The course is a white 3-D grid on ECM navy. Shot math is plain functions so tests can run without the knob.

**Stack:** Vite, React, TypeScript. three.js with React Three Fiber for the course map.

## Palette

| Use | Color |
|---|---|
| Sky / table | `#0a1628` navy |
| Accent | `#0073cf` ECM blue |
| Grid, ball, labels | `#f4f7fb` white |
| Fairway | `#127a5a` |
| Green | `#3dba6e` |
| Sand | `#e4c27a` |
| Water | `#2aa3c7` |
| Rough | `#0d4a3a` |
| Power / gold | `#f5c56b` |
| Flag | `#e11d2e` |

## Clubs

Off the green, detent has **5 clicks**, one club per click:

1. Pitching wedge
2. 8 iron
3. 5 iron
4. Hybrid (3-wood loft)
5. Driver

On the green, the **putter is locked**. The wheel hides.

## Knob feel (experimental)

Firmware cannot run detent on the left half and spring on the right half at the same time. The lab switches modes from the sign of unwrapped degrees from address:

- Left of address → `detent count=5`
- Right of address → `spring` wind. Power is 0–1 over about 90°. A snap back toward center after a wind fires the shot.

On the green, only spring (putt). After each shot, return to address and the matching mode.

Send `stream 50` after the motor is on so the lab can read the wind.

## Play modes

- **Direction:** damper resistance. Knob turn aims left and right.
- **Shoot:** left detent picks a club; right spring winds power. Putter is locked on the green.

Wind is rolled each hole: 2–16 mph, any compass heading. It pushes the ball in the air. Lofted clubs move more.

## Keyboard (no knob)

| Key | Action |
|---|---|
| `A` | Direction mode |
| `S` | Shoot mode |
| `[` / `]` | Previous / next club |
| `1`–`5` | PW, 8i, 5i, hybrid, driver |
| `←` / `→` | Aim |
| Hold `Space` | Wind power |
| Release `Space` | Hit |
| `R` | Replay this hole |

A name screen starts the round. Each tee opens with a 5-second flyover. After 9, the card stays up until New round.

## Course and physics

**Engineer Alley**, par 36. Sequence 4-3-4-5-4-3-4-5-4. Routing follows MacKenzie: each hole a different problem, a wide first tee, a heroic carry with a short lay-up, and two par 3s / two par 5s at different lengths.

| Hole | Name | Par | Play |
|---|---|---|---|
| 1 | Datum | 4 | Wide opener. Drive bunker right with a copse behind it. Greenside bunker left. |
| 2 | Gauge | 3 | Short iron. Sand short-left under three trees. Water long. |
| 3 | Cam | 4 | Fairway sweeps right. Elbow bunker sits on the cut, trees close the corner. |
| 4 | Span | 5 | Lake on the line. Lay-up copse left. Second-shot bunker right, trees behind. |
| 5 | Spline | 4 | Narrow drive-and-pitch. Bunkers pinch the landing, a grove behind each. |
| 6 | Fixture | 3 | Long iron. Water left with trees on the bank. Sand short and right. |
| 7 | Stator | 4 | Long two-shot. Drive bunker left into woods. Green bunkered, trees behind. |
| 8 | Runout | 5 | Reachable. Fairway sweeps right of water. Bunker and copse on the bold line. |
| 9 | Bench | 4 | Grove left of the landing. Creek short of the green. Sand right, trees behind. |

Fairways follow a curved waypoint path. Water and sand are circles. Trees sit in groves that back a bunker, close a corner, or frame a green. A trunk stops the ball.

Carry = club carry × power. Roll uses loft and surface. Water is a penalty stroke and a drop. The cup is about half a yard across.

## Files

| File | Job |
|---|---|
| `src/demos/golf/golfClubs.ts` | Club list and detent index |
| `src/demos/golf/golfCourse.ts` | 9 holes and surface tests |
| `src/demos/golf/golfShot.ts` | Landing, roll, hole-out |
| `src/demos/golf/golfShot.test.ts` | Shot math |
| `src/demos/golf/ClubSelectorReel.tsx` | Vertical 5-club reel |
| `src/demos/golf/GolfCourseMap.tsx` | three.js white grid, surfaces, ball, flag |
| `src/demos/golf/GolfDemo.tsx` | Play loop, haptics, keys |
| `src/apps/labApps.ts` | Launch tile |
| `src/App.tsx` | `#/golf` |

## Out of scope for v1

Wind, lie-based club limits, multiplayer, recorded replays, per-detent firmware (does not exist).
