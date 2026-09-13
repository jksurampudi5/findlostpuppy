---
name: character-animation
description: Advanced SVG and CSS character animation principles for humans and quadrupeds (dogs). Covers 4-beat canine walk cycles, human stride mechanics, inverse kinematics in SVG, Emil Kowalski fluid motion easing, and lost pet reunion cinematic choreography.
---

# Character & Quadruped Animation Engineering

## 1. Canine (Dog) Walk, Trot & Sprint Mechanics
- **4-Beat Trot Cadence**: Diagonal leg pairing (Front-Left + Rear-Right move together; Front-Right + Rear-Left move together).
- **Leg Kinematics**:
  - `transform-origin` placed precisely at shoulder (`44px, 30px`) and hip (`22px, 30px`).
  - Hock and pastern joints articulate realistically.
- **Spine & Head Bobbing**: 
  - Compression phase: Spine drops 2-3px, head dips slightly.
  - Push-off phase: Spine lifts 3-4px, head rises with ears floating upward.
- **Tail Dynamics**: Organic sinusoidal wagging using `transform-origin: base` with fast harmonic frequency (`0.18s` during excitement/reunion).
- **Anatomy Proportions**:
  - Deep athletic ribcage tapering to a tucked flank (lean Golden Retriever profile).
  - Silky floppy ears with subtle inertia damping.

## 2. Human Stride, Posture & Interaction Mechanics
- **Weight Shift & Pelvic Oscillation**: 
  - Natural vertical bounce (2-4px) during stride.
  - Arms swing counter-phase to legs.
- **Proportions & Silhouette**:
  - Modern stylized proportions (slender torso, tailored jacket, slim denim, shoes).
  - Head-to-body ratio: 1:6 for stylized editorial realism.
  - Natural warm skin tones (`#FBD5B5`) and expressive facial features (smiling curved eyes, rosy cheeks).
- **Reunion Posture Transition**:
  - Standing posture on porch -> Gentle forward lean / kneeling posture (`translate3d(-16px, 4px, 0)`).
  - Left arm wraps welcomingly around the pup.
  - Right arm (`.anim-petting-hand`) performs rhythmic, soothing head strokes (`transform: rotate(26deg) translate3d(0, 2px, 0)` to `rotate(16deg)`).

## 3. Cinematic Narrative Choreography (The 7-Phase Story Arc)
1. **Meadow Search (0% - 16%)**: Lost pup walks steadily across the green field looking for home.
2. **The Bark "Bow Bow!" (16% - 30%)**: Dog stops, tilts head up, barks `"Bow Bow! 🐾"`, triggering animated ripple sound waves.
3. **Door Opens & Overjoyed Surprise (26% - 46%)**: Front door hinges open (`scaleX(0.12)`), warm golden light spills out. Owner emerges in joy and surprise, calling out `"{dogName}! 🥹💖"`.
4. **The Sprint (46% - 64%)**: Dog spots owner, bounds in an excited high-speed gallop across the grass to the porch.
5. **Loving Hug & Head Petting (64% - 82%)**: Dog sits at owner's feet with high-speed tail wagging. Owner leans down in a warm hug while gently stroking the pup's head. Radiating halo of hearts and stars (`🥰💖💕✨🌟🐾`).
6. **Heading Inside Together (82% - 90%)**: Owner rises and guides the pup through the doorway into the cozy glowing room.
7. **Door Shuts Safely (90% - 97%)**: Front door hinges smoothly closed (`scaleX(1)`), chimney emits celebratory heart smoke puffs.

## 4. Motion Timing & Emil Kowalski Principles
- **Scale from Non-Zero**: Never scale speech bubbles or modals from `0` (causes popping); always scale from `0.92` to `1.0`.
- **Custom Easing Curves**:
  - Natural character momentum: `cubic-bezier(0.77, 0, 0.175, 1)`
  - UI bubble entries & spring arrivals: `cubic-bezier(0.23, 1, 0.32, 1)`
  - Continuous trot cycles: `cubic-bezier(0.45, 0.05, 0.55, 0.95)`
  - Hinge door swing: `cubic-bezier(0.32, 0.72, 0, 1)`
- **GPU Acceleration**: Always use `transform: translate3d(...)` and declare `will-change: transform, opacity` on animated groups.
