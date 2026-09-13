---
name: remotion-video-synthesis
description: Programmatic video creation in React using Remotion. Covers frame-accurate SVG animation rendering, dynamic subtitle text overlays, audio soundwave synthesis, video composition sequencing, and exporting MP4/WebM video clips.
---

# Remotion Video Synthesis & Export Engineering

## 1. Core Architecture
- **Composition & Sequence**: Wrap visual scenes inside `<Composition>` with defined `fps={30}`, `durationInFrames={270}`, `width={1280}`, and `height={720}`.
- **Frame-Accurate Interpolation**: Use `interpolate(frame, [0, 30], [0, 100], { extrapolateRight: "clamp" })` to drive bone positions, path morphs, and camera pans without relying on browser render clocks.
- **Physics Springs**: Use `spring({ frame, fps, config: { damping: 12, stiffness: 100 } })` for realistic bounce and arrival deceleration.

## 2. Multi-Layer Video Sequencing for Lost Dog Reunion
- **Track 1: Background & Sky**: Drifting clouds, sunlight ray rotation, chimney smoke.
- **Track 2: Storybook Cottage**: Doorway glow transition, hinge door opening and closing.
- **Track 3: Lost Pup**: Trot cycle ➔ Bark with soundwaves ➔ Bounding sprint ➔ Sit on porch ➔ Walk through door.
- **Track 4: Human Owner**: Door emergence ➔ Surprise reaction bubble ➔ Kneel with open arms ➔ Gentle head petting ➔ Walking inside.
- **Track 5: FX & Celebration Overlays**: Floating heart particles, star sparkles, and safety badge overlays.

## 3. Video Export Pipeline
- Command: `npx remotion render src/index.ts ReunionVideo out/reunion.mp4`
- Cloud Lambda or Web Worker rendering for instant client-side video generation.
