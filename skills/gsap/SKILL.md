# GSAP (GreenSock) — Professional Web Animation Library

> The gold standard for web animations. Timeline-based sequencing, scroll-linked effects, SVG animation, and physics-based motion.

## Overview

- **Repo**: github.com/greensock/GSAP (20K+ stars)
- **Skills Repo**: github.com/greensock/gsap-skills (8 official agent skills)
- **Language**: JavaScript / TypeScript
- **License**: Free for standard use (no API key needed)
- **Install**: `npm install gsap`
- **Docs**: gsap.com/docs

## Core API

### gsap.to() — Animate TO values

```js
import gsap from "gsap";

// Animate element to new state
gsap.to(".box", {
  x: 300,           // translateX
  y: 100,           // translateY
  rotation: 360,    // degrees
  scale: 1.5,
  opacity: 0.5,
  duration: 1,      // seconds
  ease: "power2.out",
});
```

### gsap.from() — Animate FROM values

```js
// Element starts at these values, animates to current state
gsap.from(".title", {
  y: -50,
  opacity: 0,
  duration: 0.8,
  ease: "back.out(1.7)",
});
```

### gsap.fromTo() — Explicit start and end

```js
gsap.fromTo(".element",
  { opacity: 0, y: 50 },    // from
  { opacity: 1, y: 0, duration: 1 }  // to
);
```

### Stagger — Animate multiple elements with delay

```js
gsap.from(".item", {
  opacity: 0,
  y: 30,
  stagger: 0.15,      // 150ms between each
  duration: 0.6,
  ease: "power2.out",
});

// Advanced stagger
gsap.to(".grid-item", {
  scale: 0,
  stagger: {
    each: 0.1,
    from: "center",   // "start", "end", "center", "edges", "random"
    grid: [4, 8],
  },
});
```

## Timelines — Sequence Animations

```js
const tl = gsap.timeline({
  defaults: { duration: 0.8, ease: "power2.out" },
});

tl.from(".hero-title", { y: 50, opacity: 0 })
  .from(".hero-subtitle", { y: 30, opacity: 0 }, "-=0.4")  // overlap
  .from(".hero-button", { scale: 0 }, "-=0.2")
  .from(".hero-image", { x: 100, opacity: 0 }, "<");  // same start as previous

// Position parameter shortcuts:
// "-=0.5"  — 0.5s before previous ends (overlap)
// "+=0.5"  — 0.5s after previous ends (gap)
// "<"      — same start time as previous
// "<0.2"   — 0.2s after previous starts
// 2        — absolute 2 seconds from timeline start
```

### Timeline Controls

```js
tl.play();
tl.pause();
tl.reverse();
tl.restart();
tl.progress(0.5);  // Jump to 50%
tl.timeScale(2);   // 2x speed
```

## ScrollTrigger — Scroll-Linked Animations

```js
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

// Basic scroll trigger
gsap.from(".section", {
  scrollTrigger: {
    trigger: ".section",
    start: "top 80%",     // trigger top hits viewport 80%
    end: "bottom 20%",
    toggleActions: "play none none reverse",
    // onEnter, onLeave, onEnterBack, onLeaveBack
  },
  y: 100,
  opacity: 0,
  duration: 1,
});

// Scrub (tie animation to scroll position)
gsap.to(".parallax-bg", {
  scrollTrigger: {
    trigger: ".section",
    start: "top bottom",
    end: "bottom top",
    scrub: true,  // or scrub: 0.5 for smoothing
  },
  y: -200,
});

// Pin section while animating
gsap.to(".horizontal-panels", {
  xPercent: -100 * (panels.length - 1),
  ease: "none",
  scrollTrigger: {
    trigger: ".container",
    pin: true,
    scrub: 1,
    end: () => "+=" + document.querySelector(".container").offsetWidth,
  },
});
```

## Easing

Common eases (all available as `"name"` or `"name.in"`, `"name.out"`, `"name.inOut"`):

```
power1, power2, power3, power4  — Acceleration curves
back     — Overshoots then settles
bounce   — Bouncing effect
elastic  — Spring-like wobble
circ     — Circular motion
expo     — Exponential
sine     — Sinusoidal
none     — Linear (no easing)
```

Custom: `ease: "back.out(1.7)"` — the number controls overshoot amount.

## React Integration

```tsx
import { useRef, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

function MyComponent() {
  const container = useRef(null);

  useGSAP(() => {
    // All GSAP animations in here auto-cleanup on unmount
    gsap.from(".title", { y: 50, opacity: 0, duration: 0.8 });
    gsap.from(".cards", { y: 30, opacity: 0, stagger: 0.1 });
  }, { scope: container });  // Scope selectors to container

  return (
    <div ref={container}>
      <h1 className="title">Hello</h1>
      <div className="cards">...</div>
    </div>
  );
}
```

Install React hook: `npm install @gsap/react`

## SVG Animation

```js
// Draw SVG path
gsap.from(".svg-path", {
  drawSVG: 0,         // Requires DrawSVGPlugin (free)
  duration: 2,
});

// Morph between shapes
gsap.to(".shape1", {
  morphSVG: ".shape2",  // Requires MorphSVGPlugin
  duration: 1,
});
```

## Best Practices

1. **Use timelines** for multi-step animations (not chained .to() calls)
2. **Set defaults** on timeline: `gsap.timeline({ defaults: { duration: 0.5 } })`
3. **Use position parameter** (`"-=0.3"`, `"<"`) for precise timing
4. **Register plugins** before use: `gsap.registerPlugin(ScrollTrigger)`
5. **Scope with useGSAP** in React for auto-cleanup
6. **Animate transforms** (x, y, rotation, scale) instead of top/left for performance
7. **Use `will-change: transform`** on animated elements
8. **Batch ScrollTrigger** with `ScrollTrigger.batch()` for many elements
9. **Kill animations** on cleanup: `gsap.killTweensOf(".element")`
10. **Use `overwrite: "auto"`** to prevent conflicting animations

## When to Use GSAP

- Landing page scroll animations
- UI micro-interactions
- SVG path animations
- Complex multi-step sequences
- Scroll-linked parallax effects
- Page transitions
- Interactive data dashboards

## Source

- Skills: github.com/greensock/gsap-skills
- Docs: gsap.com/docs/v3
- Cheatsheet: gsap.com/cheatsheet
