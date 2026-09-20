# Golf and disc golf visual upgrade

The games share course scenery and a player interface in `src/demos/course-visuals/`. Golf uses a sunlit parkland palette. Disc golf uses a twilight forest with illuminated course markers. The course definitions still determine the fairways, hazards, obstacle trees, and targets.

The scenery uses procedural geometry and materials: striped turf, layered trees, distant hills, water ripples, tee signs, and metal baskets. Background trees and hills stay outside the playable rectangle. Instanced scenery reduces draw calls, and canvas resizing follows the layout through `ResizeObserver`. Scene cleanup disposes textures, geometry, and materials.

The player interface shows hole progress, a course overview, wind, distance, equipment, and shot power. Mouse controls select equipment, adjust aim, and charge a swing or flat throw. The existing keyboard and knob controls remain available. Golf switches to the putting view on the green.

Shot animations include visible golf flight height, a follow camera, a trail, landing rings, and a basket capture. Result cards appear after landing. Hole celebrations name the score relative to par, and round results show all nine holes. Reduced-motion preferences disable scenery motion and decorative effects and skip flyovers.

Animation frames and timers are cancelled on unmount or reset. Charging cancels when the window loses focus. Shot controls lock during flight, and disc flight previews are memoized so a display animation does not recompute the trajectory every frame.

Validation: `npm test` and `npm run build`. Chrome checks cover both games' starts, flyover skipping, equipment controls, flights, result cards, disc hole completion and golf putting, and round scorecards. Narrow layouts were checked at 390 × 844. Hardware feedback requires a connected SmartKnob; these checks used browser controls.
