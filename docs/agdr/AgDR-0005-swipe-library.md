# AgDR-0005 — Swipe Gesture Library for Browse Feed

> In the context of the Tinder-style animal browse feed (US-1), facing the need for reliable swipe detection on both touch (mobile) and pointer (desktop), I decided to use **react-swipeable** to achieve gesture handling, accepting the additional dependency over a pure-CSS approach.

## Context

US-1 requires swipe-right (favourite) and swipe-left (skip) on animal cards. The gesture must work on mobile touch screens and desktop (mouse drag / click buttons). The feed is built in Next.js with React.

## Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **react-swipeable** | Purpose-built, ~3 kB gzip, handles touch + mouse, configurable velocity/delta threshold, actively maintained | One extra dependency |
| CSS touch-action + pointer events (custom hook) | Zero dependency | ~50 lines of imperative code to maintain; fiddly cross-browser pointer capture; easy to get wrong on iOS |
| framer-motion drag | Built-in spring animation, drag constraints | ~30 kB overhead; overkill for a single gesture; introduces full animation library |

## Decision

Chosen: **react-swipeable**, because it is the lightest purpose-built option, covers both touch and mouse events out of the box, and keeps the component code declarative. The 3 kB cost is negligible versus the maintenance burden of a custom hook.

## Consequences

- `react-swipeable` added to `dependencies` in `package.json`
- `useSwipeable` hook used inside `AnimalCard` to detect left/right swipe
- Desktop fallback: explicit "✕" / "♥" buttons below the card (no drag required on desktop)
- Velocity threshold set to 0.3 and delta to 50 px to avoid accidental swipes

## Artifacts

- PR [khaledzdn/petmatch-solutions#10](https://github.com/khaledzdn/petmatch-solutions/pull/10)
