# Design Document — FindLostPuppy 🎨

| Document Metadata | Value |
| :--- | :--- |
| **Title** | System, UI/UX & Interaction Design Specification |
| **Version** | 1.0.0 |
| **Theme / Aesthetic** | Obsidian Titanium (Sleek Dark Theme with Vibrant Signal Accents) |
| **Design Principles** | Zero Clutter, High Contrast Emergency Signals, Mobile-First Thumb Ergonomics |
| **Target Viewports** | 320px (Compact Mobile), 390px (Standard Mobile), 768px (Tablet), 1024px+ (Desktop) |

---

## 1. Design Philosophy & Aesthetic Pillars

FindLostPuppy is engineered for high-stress emergency scenarios where clarity, speed, and focus save lives.

1. **Obsidian Titanium Base:** Deep, non-reflective dark surfaces (`#09090B` base background, `#18181B` surface cards, `#27272A` borders) provide high visual depth, minimize battery consumption on OLED displays, and eliminate eye strain in daytime or nighttime field searches.
2. **Intentional Signal Colors:**
   - **Signal Emergency Orange (`#FF6600` / `#FF7711`):** Reserved for primary calls-to-action, active missing alerts, and crucial navigation anchors.
   - **Rescue Emerald (`#10B981` / `#059669`):** Reserved strictly for safe statuses, verified pet presence indicators, and completed checks.
   - **Alert Crimson (`#EF4444` / `#DC2626`):** Reserved for emergency missing declarations and critical destructive confirmations.
3. **Ergonomic Thumb-Zone Navigation:** All primary actions (Quick Capture FAB, Next, Back, Modal confirmation buttons) are pinned or positioned within standard one-handed thumb reach.
4. **Fluid Motion Physics:** Transitions use cubic-bezier easing (`cubic-bezier(0.16, 1, 0.3, 1)`) with micro-durations ($180\text{ms} - 350\text{ms}$) to convey responsiveness without artificial lag.

---

## 2. Design System Tokens & Tokens Matrix

```
┌────────────────────────────────────────────────────────┐
│                   OBSIDIAN TITANIUM                    │
├────────────────────────────────────────────────────────┤
│ Background:  #09090B   | Border (Subtle): #27272A      │
│ Card Glass:  #18181B   | Border (Glow):   #FF6600/35   │
│ Text Prime:  #F4F4F5   | Text Secondary:  #A1A1AA      │
├────────────────────────────────────────────────────────┤
│ Accent Warm: #FF6600   | Safe Green:      #10B981      │
│ Accent Hover:#FF8533   | Danger Red:      #EF4444      │
└────────────────────────────────────────────────────────┘
```

### 2.1 Color Palette Tokens

```css
:root {
  /* Surfaces */
  --bg-primary: #09090B;
  --bg-surface: #18181B;
  --bg-surface-elevated: #27272A;
  --bg-card-glass: rgba(24, 24, 27, 0.88);
  --backdrop-blur: blur(16px);

  /* Typography */
  --text-primary: #F4F4F5;
  --text-secondary: #A1A1AA;
  --text-tertiary: #71717A;
  --text-inverse: #09090B;

  /* Accents & Signals */
  --accent-orange: #FF6600;
  --accent-orange-hover: #FF8533;
  --accent-orange-glow: rgba(255, 102, 0, 0.28);
  
  --signal-green: #10B981;
  --signal-green-bg: rgba(16, 185, 129, 0.12);
  --signal-green-border: rgba(16, 185, 129, 0.35);

  --signal-red: #EF4444;
  --signal-red-bg: rgba(239, 68, 68, 0.12);
  --signal-red-border: rgba(239, 68, 68, 0.35);

  /* Boundaries & Radii */
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-focus: #FF6600;
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-full: 9999px;
}
```

### 2.2 Typography Hierarchy
- **Primary Font Family:** System UI stack with Outfit / Inter fallback:
  `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Scale:**
  - `Display / Header 1`: `clamp(1.5rem, 5vw, 2.25rem)` (Weight: 800)
  - `Header 2`: `clamp(1.2rem, 3.5vw, 1.5rem)` (Weight: 700)
  - `Section Title`: `1.125rem` (Weight: 600)
  - `Body / Inputs`: `0.9375rem` (`15px`, Weight: 400/500)
  - `Caption / Meta`: `0.8125rem` (`13px`, Weight: 400)

---

## 3. UI Component Architecture & Key Controls

### 3.1 BackButton Component (`src/components/ui/back-button.tsx`)
Designed to replace plain icon links with an interactive, tactile pill control:
- **Default State:** Dark pill container (`#27272A`) with visible `"Back"` text and a left-aligned arrow icon box.
- **Hover / Active State:** Arrow icon background animates from `25%` to `100%` width across `300ms`, fading out the `"Back"` text and highlighting the sliding left arrow.
- **Usage Across Onboarding:** Positioned at the top-left of Location, Pet Choice, Pet Details, and Lost Dog Alert screens.

### 3.2 Animated AlignJustifyIcon (`src/components/ui/align-justify-icon.tsx`)
A hamburger navigation trigger utilizing native SVG SMIL dashoffset animations:
- Composed of three sequential stroke animations:
  - Top bar draws in `0.2s`
  - Middle bar starts at `0.2s` and completes at `0.4s`
  - Bottom dual lines start at `0.4s` and complete at `0.6s`
- Integrated into the mobile top header (`.mobile-menu-trigger-btn`). Smoothly transitions between the hamburger icon and `X` close icon when the mobile drawer toggles.

### 3.3 Dashboard Category Status Cards
Three high-impact cards with live status counts and badges:
1. **Sightings:** Amber/Orange glow border (`--accent-orange-glow`), representative pet avatar or icon, count badge of recent neighborhood sightings.
2. **Safe Pets:** Emerald border (`--signal-green-border`), safe check indicator, shows pet image, pet name, owner chip, and a details action. Public cards never expose full address details.
3. **Missing Pets:** Crimson border (`--signal-red-border`), pulsing alert ring, displays active missing alerts count.

---

## 4. Screen-by-Screen User Flows & Layouts

```
1. Splash / Launch
   └── Dark native splash -> Animated FindLostPuppy logo (Web/Capacitor)
2. Authentication (EmailAuthPage)
   └── Clean Google Sign-In card + Guest preview option
3. Inauguration & Gratitude (First-Time User Only)
   └── Sonu memorial dedication -> "Begin Rescue Journey"
4. Pet Parent Contact (OwnerOnboardingPage)
   └── Full Name, Indian Phone (10 digits), Photo Upload, Read-only View on completion
5. Location Onboarding (Location)
   └── Resilient Auto-Detect Button + State -> District -> Mandal -> Village Selectors
6. Pet Choice & Details (RegisteredPet & PetDetails)
   └── "Pet Registered" / "You already had a pet" -> Full Breed/Age/Color/Photo Profile
7. Community Dashboard (PetStatus)
   └── 3 Category Cards -> Single Modal Explorer -> Grouped Sighting Drawer
```

### 4.1 Modal Visibility & Layering Invariants
To eliminate mobile clutter and context confusion:
- **Single Modal Invariant:** Only **one** modal dialog may be visible on screen at any time.
- Selecting a category card opens the **Category List Modal**.
- Selecting a pet or sighting from the list **hides** the category list modal and opens the **Detail Modal**.
- Closing the detail modal **restores** the category list modal at the exact previous scroll position.
- Sighting details group all sightings for a single missing dog under numbered tabs: `Sighting 1`, `Sighting 2`, etc.

---

## 5. Responsive Design & Breakpoint Strategy

| Breakpoint | Target Form Factor | Layout Behavior |
| :--- | :--- | :--- |
| `< 360px` | Small devices (e.g., iPhone SE, compact Androids) | Single-column cards, compact button paddings (`10px 14px`), font scale clamp, zero horizontal scroll. |
| `360px - 480px` | Standard smartphones (e.g., iPhone 14/15, Samsung Galaxy, iQOO) | Full mobile layout, sticky bottom FAB for quick capture, touch target minimum $\ge 44 \times 44\text{px}$. |
| `481px - 768px` | Foldables & small tablets | 2-column card grid where appropriate, centered container with max-width `460px` for onboarding forms. |
| `> 768px` | Tablets & Desktops | Fixed collapsible sidebar navigation (`SidebarNav`), side-by-side dashboard panels, max-width `1200px` app container. |

---

## 6. Accessibility (a11y) & Usability Standards

1. **Color Contrast:** All text tokens meet **WCAG 2.1 AA** standards (minimum `4.5:1` ratio for body text against `#18181B` surfaces; minimum `3.0:1` for large headlines and interactive icons).
2. **Keyboard Navigation:** Every button, selector, card, and modal backdrop supports explicit `:focus-visible` outline rings with `Enter` and `Space` activation keys.
3. **Screen Readers:** All icon-only buttons include descriptive `aria-label` and `title` attributes (e.g., `aria-label="Toggle navigation menu"`, `aria-label="Back to Location"`).
4. **Motion Safety:** Respects `prefers-reduced-motion: reduce` by disabling non-essential SMIL/CSS transitions and celebratory confetti animations.
