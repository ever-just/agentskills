# Lottie Animation — Programmatic JSON-Based Animations

> Create animated logos, icons, and micro-interactions as lightweight Lottie JSON files. No After Effects needed — build animations entirely in code.

## Overview

- **Format**: Lottie JSON (open standard)
- **Player Repo**: github.com/LottieFiles/lottie-player
- **Editor Repo**: github.com/marciogranzotto/lottie-tools (open source web editor)
- **License**: MIT
- **Install**: `npm install lottie-web` or `npm install @lottiefiles/lottie-player`

## What is Lottie?

Lottie is a JSON-based animation format. Animations are described as keyframed properties in a structured JSON file. They render at any resolution (vector-based), are tiny in file size, and play natively on web, iOS, Android, and React Native.

## Lottie JSON Structure

```json
{
  "v": "5.7.1",          // Lottie version
  "fr": 30,              // Frame rate
  "ip": 0,               // In point (start frame)
  "op": 60,              // Out point (end frame) — 2 seconds at 30fps
  "w": 400,              // Width
  "h": 400,              // Height
  "assets": [],          // External assets (images, precomps)
  "layers": [            // Animation layers (bottom to top)
    {
      "ty": 4,           // Shape layer
      "nm": "Circle",    // Layer name
      "ip": 0,
      "op": 60,
      "st": 0,           // Start time
      "ks": {            // Transform properties
        "o": { "a": 0, "k": 100 },           // Opacity (static)
        "r": { "a": 0, "k": 0 },             // Rotation
        "p": {                                 // Position (animated)
          "a": 1,                              // a=1 means animated
          "k": [
            { "t": 0, "s": [200, 300], "e": [200, 100], "i": {"x": 0.5, "y": 1}, "o": {"x": 0.5, "y": 0} },
            { "t": 30, "s": [200, 100] }
          ]
        },
        "s": { "a": 0, "k": [100, 100] }     // Scale
      },
      "shapes": [...]    // Shape definitions
    }
  ]
}
```

## Layer Types

| ty | Type | Description |
|----|------|-------------|
| 0 | Precomp | Nested composition |
| 1 | Solid | Solid color layer |
| 2 | Image | Image asset layer |
| 3 | Null | Empty transform parent |
| 4 | Shape | Vector shapes (most common) |
| 5 | Text | Text layer |

## Shape Types

| ty | Shape |
|----|-------|
| "rc" | Rectangle |
| "el" | Ellipse |
| "sr" | Star/Polygon |
| "sh" | Path (bezier) |
| "fl" | Fill |
| "st" | Stroke |
| "gf" | Gradient fill |
| "gs" | Gradient stroke |
| "tr" | Transform |
| "gr" | Group |

## Building Animations in Code

### Simple Fade-In Circle

```json
{
  "v": "5.7.1",
  "fr": 30,
  "ip": 0,
  "op": 30,
  "w": 200,
  "h": 200,
  "layers": [{
    "ty": 4,
    "nm": "circle",
    "ip": 0,
    "op": 30,
    "st": 0,
    "ks": {
      "o": {
        "a": 1,
        "k": [
          {"t": 0, "s": [0], "e": [100], "i": {"x": [0.4], "y": [1]}, "o": {"x": [0.6], "y": [0]}},
          {"t": 20, "s": [100]}
        ]
      },
      "r": {"a": 0, "k": 0},
      "p": {"a": 0, "k": [100, 100]},
      "s": {
        "a": 1,
        "k": [
          {"t": 0, "s": [0, 0], "e": [100, 100], "i": {"x": [0.2, 0.2], "y": [1, 1]}, "o": {"x": [0.8, 0.8], "y": [0, 0]}},
          {"t": 25, "s": [100, 100]}
        ]
      }
    },
    "shapes": [
      {
        "ty": "gr",
        "it": [
          {"ty": "el", "p": {"a": 0, "k": [0, 0]}, "s": {"a": 0, "k": [80, 80]}},
          {"ty": "fl", "c": {"a": 0, "k": [0.2, 0.5, 1, 1]}, "o": {"a": 0, "k": 100}},
          {"ty": "tr", "p": {"a": 0, "k": [0, 0]}, "s": {"a": 0, "k": [100, 100]}}
        ]
      }
    ]
  }]
}
```

### Keyframe Easing

```json
// Ease in-out (smooth)
"i": {"x": [0.42], "y": [1]},
"o": {"x": [0.58], "y": [0]}

// Ease out (decelerate)
"i": {"x": [0.0], "y": [1]},
"o": {"x": [0.6], "y": [0]}

// Ease in (accelerate)
"i": {"x": [0.4], "y": [1]},
"o": {"x": [1.0], "y": [0]}

// Linear
"i": {"x": [1], "y": [1]},
"o": {"x": [0], "y": [0]}
```

## Programmatic Generation with JavaScript

```js
function createLottieAnimation({ width, height, fps, durationFrames, layers }) {
  return {
    v: "5.7.1",
    fr: fps,
    ip: 0,
    op: durationFrames,
    w: width,
    h: height,
    assets: [],
    layers,
  };
}

function createShapeLayer({ name, startFrame, endFrame, shapes, transform }) {
  return {
    ty: 4,
    nm: name,
    ip: startFrame,
    op: endFrame,
    st: startFrame,
    ks: transform,
    shapes,
  };
}

// Generate and save
const animation = createLottieAnimation({
  width: 400, height: 400, fps: 30, durationFrames: 60,
  layers: [/* ... */],
});

const fs = require("fs");
fs.writeFileSync("animation.json", JSON.stringify(animation, null, 2));
```

## Playing Lottie in Web

```html
<!-- Via CDN -->
<script src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js"></script>
<lottie-player src="animation.json" background="transparent" speed="1" loop autoplay></lottie-player>
```

```js
// Via npm
import lottie from "lottie-web";

const anim = lottie.loadAnimation({
  container: document.getElementById("lottie"),
  renderer: "svg",
  loop: true,
  autoplay: true,
  animationData: require("./animation.json"),
});
```

## Using Lottie in Remotion

```tsx
import { Lottie } from "@remotion/lottie";
import animationData from "./animation.json";

export const MyScene: React.FC = () => {
  return <Lottie animationData={animationData} />;
};
```

Install: `npm install @remotion/lottie`

## Best Practices

1. **Keep it simple** — Fewer layers = smaller file, better performance
2. **Use shape layers** over image layers when possible (vector = crisp at any size)
3. **Ease keyframes** — Never use linear easing for organic motion
4. **30fps** is standard for web Lottie animations
5. **Under 2 seconds** for micro-interactions, 3-5 seconds for logos
6. **Test with lottie-player** — Preview before embedding
7. **Optimize** — Remove unused properties, minimize precision of numbers

## Agent Skill Source

- Wiggle (logo animation skill): github.com/talknerdytome-labs/wiggle-claude-skill
- Lottie Tools (editor): github.com/marciogranzotto/lottie-tools
- OmniLottie (AI generation): github.com/OpenVGLab/OmniLottie
