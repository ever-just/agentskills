# Motion Canvas — TypeScript Animation Engine for Explanatory Videos

> A TypeScript library using generators to program animations with a real-time editor. Ideal for explainer videos, code walkthroughs, and educational content.

## Overview

- **Repo**: github.com/motion-canvas/motion-canvas (18K+ stars)
- **Language**: TypeScript
- **License**: MIT
- **Install**: `npm create @motion-canvas@latest`
- **Docs**: motioncanvas.io/docs

## Core Concepts

### Project Setup

```bash
npm create @motion-canvas@latest my-animation
cd my-animation
npm install
npm start  # Opens editor at localhost:9000
```

### Scenes

Every animation is composed of scenes. A scene is a generator function:

```tsx
import { makeScene2D } from "@motion-canvas/2d";
import { createRef } from "@motion-canvas/core";
import { Circle } from "@motion-canvas/2d/lib/components";

export default makeScene2D(function* (view) {
  const circle = createRef<Circle>();

  view.add(<Circle ref={circle} size={100} fill="#e13238" />);

  // Animate the circle
  yield* circle().scale(2, 0.6);
  yield* circle().opacity(0, 0.3);
});
```

### Animation with Generators

The `yield*` keyword drives animations frame by frame:

```tsx
// Sequential animations (one after another)
yield* rect().position.x(300, 1);   // Move right over 1 second
yield* rect().fill("#00ff00", 0.5); // Change color over 0.5 seconds

// Parallel animations (simultaneous)
yield* all(
  rect().position.x(300, 1),
  rect().rotation(360, 1),
);

// Chained with delay
yield* chain(
  rect().opacity(1, 0.3),
  waitFor(0.5),
  rect().scale(2, 0.6),
);

// Wait for duration
yield* waitFor(2); // Wait 2 seconds
```

### Nodes (Visual Elements)

```tsx
import { Rect, Circle, Line, Txt, Img, Video, Layout } from "@motion-canvas/2d/lib/components";

// Rectangle
<Rect width={200} height={100} fill="#333" radius={10} />

// Text
<Txt text="Hello" fontSize={48} fill="white" fontFamily="monospace" />

// Circle
<Circle size={80} fill="#e13238" />

// Image
<Img src={myImage} width={400} />

// Layout (flexbox)
<Layout direction="column" gap={20} alignItems="center">
  <Txt text="Title" />
  <Rect width={200} height={50} />
</Layout>
```

### Signals (Reactive Values)

```tsx
import { createSignal } from "@motion-canvas/core";

const progress = createSignal(0);

// Use in components
<Rect width={() => progress() * 400} height={20} fill="blue" />

// Animate signal
yield* progress(1, 2); // Animate from 0 to 1 over 2 seconds
```

### Easing

```tsx
import { easeInOutCubic, easeOutBounce, linear } from "@motion-canvas/core";

yield* rect().position.x(300, 1, easeInOutCubic);
yield* circle().scale(2, 0.8, easeOutBounce);
```

### Code Highlighting

```tsx
import { Code, lines, word } from "@motion-canvas/2d/lib/components";

const code = createRef<Code>();

view.add(
  <Code
    ref={code}
    fontSize={24}
    code={`function hello() {\n  console.log("world");\n}`}
  />
);

// Highlight specific lines
yield* code().selection(lines(1, 2), 0.3);

// Animate code changes
yield* code().code(
  `function hello() {\n  return "world";\n}`,
  0.6,
);
```

## Commands

```bash
# Start editor (live preview)
npm start

# Render to video
npx motion-canvas render

# Render specific scene
npx motion-canvas render --scene=myScene
```

## Best Practices

1. **Use refs for animation targets**: `createRef<Circle>()` for any node you animate
2. **Generator-based flow**: Think sequentially — `yield*` is your timeline
3. **Use `all()` for parallel**: Group simultaneous animations
4. **Signals for reactive data**: Values that multiple nodes depend on
5. **Layout component for flexbox**: Auto-positions children
6. **Keep scenes short**: Split long animations into multiple scenes
7. **Use the editor**: Real-time preview with scrubbing is invaluable

## When to Use Motion Canvas vs Remotion

| | Motion Canvas | Remotion |
|---|---|---|
| **Best for** | Educational, explainer | Product, marketing |
| **Animation style** | Imperative (generators) | Declarative (React) |
| **Editor** | Built-in real-time | Remotion Studio |
| **Code animation** | First-class support | Manual implementation |
| **Ecosystem** | Growing | Large (npm packages) |
| **Voice sync** | Built-in audio sync | Manual sync |

## Source

- Repo: github.com/motion-canvas/motion-canvas
- Docs: motioncanvas.io/docs
- Examples: motioncanvas.io/docs/examples
