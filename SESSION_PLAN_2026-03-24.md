# SESSION PLAN — 2026-03-24

## Goal
Lift the overall quality of the mobile homepage, Space Tracker experience, and UI audio so the site feels tighter, faster, and more premium.

## In Progress
1. Mobile homepage/top fold cleanup
   - Make the first fold feel full-width on mobile.
   - Remove duplicate homepage language switcher and rely on the header control.
   - Tighten top spacing so header + AGI widget + hero feel like one coherent stack.

2. Space Tracker smoothness pass
   - Reduce visible stutter when switching ISS / planets / asteroids views.
   - Lower transition overhead on mobile.
   - Cut excess typing/audio churn in the HUD during focus changes.

3. Sound system v2
   - Replace harsh UI clicks with cleaner sci-fi console feedback.
   - Make Space Tracker sounds more controlled and less fatiguing.
   - Keep a more professional sonic identity across hover/click/select/alert events.

## Completed In This Session
- Refreshed core procedural UI sounds in `lib/sounds.ts`.
- Softened hover, click, select, tab, transition, boot, dataStream, ping, whoosh, and alert.
- Fixed the Space Tracker terminal tick so mute works correctly.
- Softened the terminal type tick in `components/SpaceTrackerModal.tsx`.
- Fixed the Android mobile homepage/header width issue on Galaxy S24 Ultra by compacting the mobile header and locking down viewport overflow sources.

## Tomorrow Plan
1. Audio bus/master chain
   - Add a shared master bus for UI sounds.
   - Normalize loudness and make clicks/alerts feel more premium and consistent.

2. Space Tracker polish v2
   - Continue smoothing camera flights and tab switching.
   - Trim any remaining heavy secondary effects on mobile.
   - Make ISS / planets / asteroids transitions feel cleaner and more fluid.

3. Homepage polish
   - Keep EN and HR homepages visually aligned.
   - Fine-tune the top fold spacing after the mobile header fix.
   - Check if any fixed overlays still need mobile-specific constraints.

4. Mini-game planning
   - Start the concept/spec for `Orbital Intercept`.
   - Define gameplay loop, controls, scoring, and how it plugs into Space Tracker.

5. Media/editorial follow-up
   - Continue improving gaming and robotics media quality.
   - Keep pushing official/relevant image/video selection over generic matches.

## Notes
- EN and HR homepages must stay structurally aligned.
- Any mobile fix should be checked against the homepage first fold, not just article pages.
- Space Tracker quality should improve without losing the cinematic feel.
