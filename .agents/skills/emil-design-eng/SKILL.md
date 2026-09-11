---
name: emil-design-eng
description: Emil Kowalski's philosophy on UI polish, component design, animation decisions, and the invisible details that make software feel great. Use for fluid physics, custom easing curves, spring parameters, and micro-interactions.
---

# Design Engineering (Emil Kowalski)

## Core Animation Principles

### 1. The Decision Framework
- **Should this animate at all?** Frequency gates everything. Rare/celebration tier gets full delight budget.
- **Purpose**: Feedback, spatial consistency, state indication, preventing jarring changes, delight.
- **Easing**: 
  - Never use `ease-in` on UI entry.
  - Strong UI ease-out: `cubic-bezier(0.23, 1, 0.32, 1)`.
  - Strong on-screen ease-in-out: `cubic-bezier(0.77, 0, 0.175, 1)`.
  - iOS-like smooth curve: `cubic-bezier(0.32, 0.72, 0, 1)`.

### 2. Physical Details
- **Never animate from `scale(0)`**: Start from `scale(0.92)` - `scale(0.96)` with opacity fade. Real world objects don't appear from a single dimensionless point.
- **GPU accelerated properties only**: Animate `transform` and `opacity`. Avoid mutating layout coordinates mid-flight.
- **Stagger and Anticipation**: Layer arrivals with 40-80ms staggers for natural cadence.
- **Tactile `:active` feedback**: `transform: scale(0.97)` on pressable elements.
