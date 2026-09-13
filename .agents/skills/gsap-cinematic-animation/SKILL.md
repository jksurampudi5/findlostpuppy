---
name: gsap-cinematic-animation
description: Advanced GSAP timeline choreography, multi-actor SVG skeletal rigging, and cinematic web animation. Covers millisecond-precise sequencing, smooth camera focus, dynamic speech bubbles, audio-visual soundwave ripples, and interactive animation controls (play, pause, scrub, speed).
---

# GSAP Cinematic Animation Engineering

## 1. Timeline Orchestration Architecture
- **Master & Nested Timelines**: Use `gsap.timeline({ repeat: -1, repeatDelay: 1 })` to sequence multi-phase narrative arcs without fragile CSS keyframe percentage calculations.
- **Relative Positioning & Labels**: Use timeline labels (`tl.addLabel('bark')`, `tl.addLabel('reunion')`) to synchronize concurrent character actions (e.g., owner stepping out simultaneously with door swinging open).
- **Smooth Easing**:
  - Organic character motion: `ease: "power2.inOut"` or `ease: "sine.inOut"`.
  - Spring-like arrival: `ease: "back.out(1.7)"` or `ease: "elastic.out(1, 0.75)"`.
  - Snappy mechanical actions (door latch): `ease: "power3.in"`.

## 2. Canine (Dog) Skeletal Motion in GSAP
- **Trot & Sprint Cycles**:
  - Independent tweens for diagonal leg pairs (`legBackFar` + `legFrontNear`, `legBackNear` + `legFrontFar`) oscillating with `yoyo: true, repeat: -1`.
  - Spine bounce: `y: -4` during sprint, `y: -2` during trot.
  - Tail wagging: fast harmonic oscillation (`rotation: 32`, `yoyo: true, repeat: -1, duration: 0.14`).
- **Story State Transitions**:
  1. *Wander*: `gsap.to(dog, { x: 160, duration: 2.2, ease: "sine.inOut" })`
  2. *Bark*: `gsap.to(dogHead, { rotation: -12, duration: 0.25, yoyo: true, repeat: 3 })`
  3. *Sprint*: `gsap.to(dog, { x: 490, duration: 1.8, ease: "power2.in" })`
  4. *Sit & Hug*: `gsap.to(dog, { x: 505, y: 180, scale: 0.76, duration: 0.4 })`
  5. *Trotting Inside*: `gsap.to(dog, { x: 575, opacity: 0, scale: 0.52, duration: 1.2 })`

## 3. Human Posture & Interaction Mechanics
- **Hearing & Emergence**:
  - Front door hinges open: `gsap.to(door, { scaleX: 0.08, duration: 0.6, ease: "power2.out" })`
  - Owner walks to porch: `gsap.fromTo(owner, { x: 15, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8 })`
  - Speech bubble pop: `gsap.fromTo(speechBubble, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(1.5)" })`
- **Kneeling Hug & Head Petting**:
  - Posture bend: `gsap.to(ownerBody, { y: 6, rotation: -6, duration: 0.5 })`
  - Left arm hug: `gsap.to(armLeft, { rotation: -26, duration: 0.4 })`
  - Right arm petting: `gsap.to(armRight, { rotation: 28, y: 2, yoyo: true, repeat: 7, duration: 0.22, ease: "sine.inOut" })`
- **Leading Inside & Door Shut**:
  - Owner turns and steps in: `gsap.to(owner, { x: 18, opacity: 0, duration: 1.0 })`
  - Front door closes: `gsap.to(door, { scaleX: 1, duration: 0.5, ease: "power3.in" })`

## 4. Interactive Scrubber & Story Progress
- Expose interactive controls: Play / Pause toggle, progress bar scrubber, speed toggles (0.5x, 1x, 1.5x), and jump-to-chapter stage markers (`Meadow`, `Bark`, `Surprise`, `Sprint`, `Hug & Pet`, `Inside Home`).
