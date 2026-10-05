---
name: responsive-design
description: Implement modern responsive layouts using container queries, fluid typography, CSS Grid, and mobile-first breakpoint strategies. Use when building adaptive interfaces, implementing fluid layouts, or creating component-level responsive behavior.
---

# Responsive Design

Master modern responsive design techniques to create interfaces that adapt seamlessly across all screen sizes and device contexts.

## When to Use This Skill

- Implementing mobile-first responsive layouts
- Using container queries for component-based responsiveness
- Creating fluid typography and spacing scales
- Building complex layouts with CSS Grid and Flexbox
- Designing breakpoint strategies for design systems
- Implementing responsive images and media
- Creating adaptive navigation patterns
- Building responsive tables and data displays

## Detailed patterns and worked examples

Detailed pattern documentation lives in `references/details.md`. Read that file when the navigation tier above is insufficient.

## Best Practices

1. **Mobile-First**: Start with mobile styles, enhance for larger screens
2. **Content Breakpoints**: Set breakpoints based on content, not devices
3. **Fluid Over Fixed**: Use fluid values for typography and spacing
4. **Container Queries**: Use for component-level responsiveness
5. **Test Real Devices**: Simulators don't catch all issues
6. **Performance**: Optimize images, lazy load off-screen content
7. **Touch Targets**: Maintain 44x44px minimum on mobile
8. **Logical Properties**: Use inline/block for internationalization

## Common Issues

- **Horizontal Overflow**: Content breaking out of viewport
- **Fixed Widths**: Using px instead of relative units
- **Viewport Height**: 100vh issues on mobile browsers
- **Font Size**: Text too small on mobile
- **Touch Targets**: Buttons too small to tap accurately
- **Aspect Ratio**: Images squishing or stretching
- **Z-Index Stacking**: Overlays breaking on different screens

## FindLostPuppy Project Rules

When working in the FindLostPuppy mobile app, treat responsive behavior as a product invariant:

- Every modal, sheet, and component transition must open from the top with the app header visible when applicable.
- Long labels, pet names, owner chips, addresses, and button text must wrap, shrink, or stack; they must never clip or overflow horizontally on mobile.
- Detail cards use responsive grids that collapse to one column when content cannot fit side by side.
- Capture flows should keep the camera preview, primary action, and close affordance reachable without hiding the bottom action behind navigation.
- Selection controls should use app-styled indicators instead of plain white check circles.
- Before changing UI code, check `docs/navigation-flow.md`, `docs/app-context.md`, and `docs/local-development.md` for the current product flow.
