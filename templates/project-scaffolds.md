# Project Scaffolds — Quick Start Templates

> Copy-paste project scaffolds for each visual asset tool. Use these to bootstrap a new project instantly.

## Remotion Video Project

```bash
mkdir my-video && cd my-video
npm init -y
npm install remotion @remotion/cli @remotion/transitions react react-dom
npm install -D typescript @types/react
```

**package.json scripts:**
```json
{
  "scripts": {
    "start": "npx remotion studio",
    "build": "npx remotion render ProductVideo out/video.mp4",
    "render:gif": "npx remotion render ProductVideo out/video.gif --image-format=png",
    "still": "npx remotion still ProductVideo out/thumbnail.png --frame=45"
  }
}
```

**Minimal file structure:**
```
my-video/
├── src/
│   ├── index.ts          # registerRoot(RemotionRoot)
│   ├── Root.tsx           # <Composition> definitions
│   ├── ProductVideo.tsx   # Main video component
│   ├── components/
│   │   └── styles.ts     # Colors, fonts
│   └── scenes/
│       ├── Intro.tsx
│       ├── Main.tsx
│       └── Outro.tsx
├── public/               # Static assets
├── remotion.config.ts
├── tsconfig.json
└── package.json
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
```

**remotion.config.ts:**
```ts
import { Config } from "@remotion/cli/config";
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
```

**src/index.ts:**
```ts
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";
registerRoot(RemotionRoot);
```

**src/Root.tsx:**
```tsx
import { Composition } from "remotion";
import { ProductVideo } from "./ProductVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ProductVideo"
      component={ProductVideo}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
```

---

## Motion Canvas Project

```bash
npm create @motion-canvas@latest my-animation
cd my-animation
npm install
npm start
```

**Minimal scene (src/scenes/example.tsx):**
```tsx
import { makeScene2D } from "@motion-canvas/2d";
import { createRef } from "@motion-canvas/core";
import { Circle, Txt } from "@motion-canvas/2d/lib/components";

export default makeScene2D(function* (view) {
  const title = createRef<Txt>();

  view.add(
    <Txt
      ref={title}
      text="Hello World"
      fontSize={64}
      fill="white"
      opacity={0}
    />
  );

  yield* title().opacity(1, 0.6);
  yield* waitFor(1);
  yield* title().opacity(0, 0.3);
});
```

---

## Manim Project

```bash
mkdir my-animation && cd my-animation
pip install manim
```

**scene.py:**
```python
from manim import *

class ProductIntro(Scene):
    def construct(self):
        title = Text("Product Name", font_size=72, color=WHITE)
        subtitle = Text("Tagline here", font_size=36, color=GREY)
        subtitle.next_to(title, DOWN, buff=0.5)

        self.play(Write(title), run_time=1.5)
        self.play(FadeIn(subtitle, shift=UP * 0.3))
        self.wait(2)
        self.play(FadeOut(VGroup(title, subtitle)))
```

**Render:** `manim -qh scene.py ProductIntro`

---

## Slidev Presentation

```bash
npm init slidev@latest my-talk
cd my-talk
npx slidev
```

**slides.md:**
```md
---
theme: default
title: My Talk
transition: slide-left
---

# My Talk Title

Subtitle or description

---

# Key Point

<v-clicks>

- First insight
- Second insight
- Third insight

</v-clicks>

---
layout: two-cols
---

# Left Side

Explanation here

::right::

# Right Side

Code or diagram here

---
layout: center
---

# Thank You

Questions?
```

---

## D3.js Animated Chart (standalone HTML)

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>body { background: #0a0a0a; margin: 0; }</style>
</head>
<body>
  <svg id="chart" viewBox="0 0 800 500"></svg>
  <script>
    const data = [
      { name: "Jan", value: 30 },
      { name: "Feb", value: 50 },
      { name: "Mar", value: 80 },
      { name: "Apr", value: 45 },
      { name: "May", value: 90 },
    ];

    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#chart")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().domain(data.map(d => d.name)).range([0, width]).padding(0.3);
    const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);

    svg.selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", d => x(d.name))
      .attr("width", x.bandwidth())
      .attr("y", height)
      .attr("height", 0)
      .attr("fill", "#4a90d9")
      .attr("rx", 4)
      .transition().duration(800).delay((d, i) => i * 150)
      .attr("y", d => y(d.value))
      .attr("height", d => height - y(d.value));

    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x)).selectAll("text").attr("fill", "#999");
    svg.append("g").call(d3.axisLeft(y).ticks(5)).selectAll("text").attr("fill", "#999");
  </script>
</body>
</html>
```

---

## Lottie Animation (Node.js generator)

```bash
mkdir my-lottie && cd my-lottie
npm init -y
```

**generate-animation.js:**
```js
const fs = require("fs");

const animation = {
  v: "5.7.1",
  fr: 30,
  ip: 0,
  op: 60,
  w: 400,
  h: 400,
  assets: [],
  layers: [{
    ty: 4,
    nm: "circle",
    ip: 0,
    op: 60,
    st: 0,
    ks: {
      o: { a: 1, k: [
        { t: 0, s: [0], e: [100], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
        { t: 20, s: [100] }
      ]},
      r: { a: 0, k: 0 },
      p: { a: 0, k: [200, 200] },
      s: { a: 1, k: [
        { t: 0, s: [0, 0], e: [100, 100], i: { x: [0.2, 0.2], y: [1, 1] }, o: { x: [0.8, 0.8], y: [0, 0] } },
        { t: 25, s: [100, 100] }
      ]}
    },
    shapes: [{
      ty: "gr",
      it: [
        { ty: "el", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [120, 120] } },
        { ty: "fl", c: { a: 0, k: [0.2, 0.5, 1, 1] }, o: { a: 0, k: 100 } },
        { ty: "tr", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] } }
      ]
    }]
  }]
};

fs.writeFileSync("animation.json", JSON.stringify(animation, null, 2));
console.log("Created animation.json");
```

**Run:** `node generate-animation.js`
**Preview:** Open animation.json at lottiefiles.com/preview or use lottie-player.

---

## MoviePy Video Edit

```bash
mkdir my-edit && cd my-edit
pip install moviepy
```

**edit.py:**
```python
from moviepy import VideoFileClip, TextClip, CompositeVideoClip, concatenate_videoclips

# Load and trim
clip = VideoFileClip("input.mp4").subclipped(0, 10)

# Add title overlay
title = TextClip(
    text="Product Demo",
    font_size=60,
    color="white",
    font="Arial-Bold",
).with_duration(3).with_position("center")

# Composite
final = CompositeVideoClip([clip, title])
final.write_videofile("output.mp4", fps=30)
```

**Run:** `python edit.py`
