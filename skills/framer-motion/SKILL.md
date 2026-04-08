# Motion (Framer Motion) — React UI Animation Library

> Declarative animations for React. Springs, gestures, layout animations, and page transitions. GPU-accelerated, production-ready.

## Overview

- **Repo**: github.com/motiondivision/motion (26K+ stars)
- **Language**: TypeScript / React
- **License**: MIT
- **Install**: `npm install motion`
- **Docs**: motion.dev
- **Note**: Framer Motion was renamed to Motion. Import from `motion/react`.

## Core API

### Basic Animation

```tsx
import { motion } from "motion/react";

// Animate on mount
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Hello World
</motion.div>

// Animate on exit (requires AnimatePresence)
import { AnimatePresence } from "motion/react";

<AnimatePresence>
  {isVisible && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      Content
    </motion.div>
  )}
</AnimatePresence>
```

### Spring Physics

```tsx
<motion.div
  animate={{ x: 100 }}
  transition={{
    type: "spring",
    stiffness: 300,
    damping: 20,
    mass: 1,
  }}
/>

// Presets
transition={{ type: "spring", bounce: 0.5 }}  // 0 = no bounce, 1 = very bouncy
```

### Variants (Orchestrated Animations)

```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,    // Delay between children
      delayChildren: 0.3,       // Initial delay
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

<motion.ul variants={container} initial="hidden" animate="show">
  {items.map((i) => (
    <motion.li key={i} variants={item}>{i}</motion.li>
  ))}
</motion.ul>
```

### Gestures

```tsx
// Hover
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Click me
</motion.button>

// Drag
<motion.div
  drag                          // Enable drag on both axes
  dragConstraints={{ left: -100, right: 100, top: -50, bottom: 50 }}
  dragElastic={0.2}
/>
```

### Layout Animations

```tsx
// Automatically animate layout changes
<motion.div layout>
  {isExpanded ? <ExpandedContent /> : <CollapsedContent />}
</motion.div>

// Shared layout animation (morph between elements)
<motion.div layoutId="card">
  {/* This element morphs between positions when layoutId matches */}
</motion.div>
```

### Scroll Animations

```tsx
import { useScroll, useTransform, motion } from "motion/react";

function ParallaxSection() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1, 0]);

  return (
    <motion.div style={{ y, opacity }}>
      Parallax content
    </motion.div>
  );
}
```

### useAnimate (Imperative)

```tsx
import { useAnimate } from "motion/react";

function MyComponent() {
  const [scope, animate] = useAnimate();

  async function handleClick() {
    await animate(".box", { scale: 1.5 }, { duration: 0.3 });
    await animate(".box", { rotate: 360 }, { duration: 0.5 });
    await animate(".box", { scale: 1, rotate: 0 });
  }

  return (
    <div ref={scope}>
      <div className="box" onClick={handleClick}>Click me</div>
    </div>
  );
}
```

### Keyframes

```tsx
<motion.div
  animate={{
    x: [0, 100, 100, 0, 0],
    y: [0, 0, 100, 100, 0],
    rotate: [0, 90, 180, 270, 360],
  }}
  transition={{ duration: 2, repeat: Infinity }}
/>
```

## Transition Types

```tsx
// Spring (default for physical values)
transition={{ type: "spring", stiffness: 100, damping: 10 }}

// Tween (duration-based)
transition={{ type: "tween", duration: 0.5, ease: "easeInOut" }}

// Easing options
ease: "linear" | "easeIn" | "easeOut" | "easeInOut"
ease: [0.42, 0, 0.58, 1]  // Custom cubic bezier

// Repeat
transition={{ repeat: Infinity, repeatType: "reverse", duration: 1 }}

// Delay
transition={{ delay: 0.5 }}
```

## Common Patterns

### Page Transition

```tsx
// In layout component
<AnimatePresence mode="wait">
  <motion.div
    key={pathname}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

### Staggered List

```tsx
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.3 } },
};
```

### Scale on Hover Card

```tsx
<motion.div
  whileHover={{ scale: 1.03, boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}
  transition={{ type: "spring", stiffness: 400, damping: 25 }}
/>
```

## Best Practices

1. **Use variants** for orchestrated parent/child animations
2. **Spring physics** for natural-feeling motion (avoid linear easing)
3. **layout prop** for automatic layout change animations
4. **AnimatePresence** required for exit animations
5. **layoutId** for shared element transitions between routes
6. **useScroll** for scroll-linked animations (parallax, progress bars)
7. **whileHover/whileTap** for interactive feedback
8. **Stagger children** via variant `transition.staggerChildren`
9. **Keep animations subtle** — 0.2-0.5s duration for UI interactions
10. **GPU-accelerated** — Motion uses transforms by default

## When to Use Motion vs GSAP

| | Motion | GSAP |
|---|---|---|
| **Framework** | React-first | Framework-agnostic |
| **Style** | Declarative (JSX props) | Imperative (function calls) |
| **Layout animations** | Built-in (magic) | Manual |
| **Scroll** | useScroll hook | ScrollTrigger plugin |
| **Gestures** | Built-in (drag, hover, tap) | Draggable plugin |
| **SVG morphing** | Limited | MorphSVGPlugin |
| **Bundle size** | ~30KB | ~25KB core |

## Source

- Repo: github.com/motiondivision/motion
- Docs: motion.dev
- Examples: motion.dev/docs/react-quick-start
