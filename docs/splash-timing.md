# Splash Timing

This document records the launch splash timing used by the React app shell.

## Current Timing

| Moment | Time | What happens |
| --- | ---: | --- |
| Overlay opens | 0.00s | Dark splash overlay appears before route content is shown. |
| Logo stage fade-in begins | 0.00s | Logo card, app name, tagline, glow, and progress bar start. |
| Center dog/home mark settles | 0.80s | Center sanctuary image finishes its entry animation, then continues a soft pulse. |
| Top hand starts moving | 0.12s | Top protective hand begins outside the card and moves inward. |
| Bottom hand starts moving | 0.22s | Bottom protective hand begins outside the card and moves inward. |
| Top hand reaches final position | 2.92s | Top hand completes its entry and starts a gentle protective hover. |
| Bottom hand reaches final position | 3.02s | Bottom hand completes its entry and starts a gentle cradle hover. |
| Progress bar completes | 3.20s | Progress bar reaches 100%; this is also when fade-out starts. |
| Overlay fully closes | 3.55s | Fade-out completes and the app route is fully available. |

## Route Behavior

The same splash timing is used for both first-time users and returning logged-in users. `LaunchTributeOverlay` is mounted once at the app shell level, before `MainAppFlow` decides where the user should go next.

After the splash closes, routing chooses the destination:

- Signed-out user: `/login`
- Signed-in user needing consent: `/consent`
- Signed-in user with consent clearance: `/owner`
- Direct app routes such as `/location`, `/pet`, `/alert`, `/capture`, and `/homepage` remain available when opened intentionally.

## Source Of Truth

- Timer constants: `src/components/LaunchTributeOverlay.tsx`
  - `LAUNCH_LOGO_VISIBLE_MS = 3200`
  - `LAUNCH_FADE_OUT_MS = 350`
- CSS animation variables: `src/components/LaunchTributeOverlay.css`
  - `--launch-hand-entry-duration: 2800ms`
  - `--launch-hand-top-delay: 120ms`
  - `--launch-hand-bottom-delay: 220ms`
  - `--launch-logo-visible-duration: 3200ms`

The progress bar is intentionally tied to the full logo-stage duration. The hand movement is intentionally shorter than the logo-stage duration so both hands finish before the overlay begins fading.
