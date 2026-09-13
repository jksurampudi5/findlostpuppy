---
name: character-animation
description: Advanced SVG and CSS character animation principles for humans and quadrupeds (dogs). Covers 4-beat canine walk cycles, human stride mechanics, inverse kinematics in SVG, and Emil Kowalski fluid motion easing.
---

# Character & Quadruped Animation Engineering

## 1. Canine (Dog) Walk & Run Cycle Mechanics
- **4-Beat Trot Cadence**: Diagonal leg pairing (Front-Left + Rear-Right move together; Front-Right + Rear-Left move together).
- **Spine & Head Bobbing**: 
  - When legs compress: Spine drops 2-3px, head dips slightly.
  - When legs push off: Spine lifts 3-4px, head rises with ears floating upward.
- **Tail Dynamics**: Organic waving using `transform-origin: base` with sinusoidal wave motion (`sin(wt)`).
- **Anatomy Proportions**:
  - Deep athletic ribcage tapering to a tucked abdomen.
  - Articulated legs with hock and pastern joints (avoid rigid stick legs).

## 2. Human Stride & Posture Mechanics
- **Weight Shift & Pelvic Oscillation**: 
  - Natural vertical bounce (2-4px) during mid-stride.
  - Arms swing counter-phase to legs (Left arm forwards when Right leg forwards).
- **Proportions**:
  - Head-to-body ratio: 1:6 or 1:7 for modern stylized editorial realism.
  - Natural shoulder-to-waist taper.
  - Articulated knees and ankles with distinct footwear.

## 3. Motion Timing & Easing (Emil Kowalski Standards)
- Primary cycles: 0.8s - 1.2s per stride loop for walk cycles.
- Easing: `cubic-bezier(0.45, 0.05, 0.55, 0.95)` for continuous harmonic loops.
- Arrival & Interaction: `cubic-bezier(0.23, 1, 0.32, 1)` for spring arrivals.
