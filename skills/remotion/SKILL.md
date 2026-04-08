# Remotion — Programmatic Video Creation with React

> Create videos programmatically using React components. The most mature framework for code-driven video production.

## Overview

- **Repo**: github.com/remotion-dev/remotion (21K+ stars)
- **Language**: TypeScript / React
- **License**: Free for individuals and companies under $1M revenue
- **Install**: `npm install remotion @remotion/cli @remotion/transitions`
- **Docs**: remotion.dev/docs

## Core Concepts

### Composition
A `<Composition>` defines a video's dimensions, frame rate, and duration:

```tsx
import { Composition } from "remotion";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MyVideo"
      component={MyVideo}
      durationInFrames={300}  // 10 seconds at 30fps
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
```

### Animation Primitives

**useCurrentFrame()** — Returns the current frame number (0-indexed):
```tsx
const frame = useCurrentFrame();
```

**interpolate()** — Maps frame ranges to output values:
```tsx
import { interpolate, useCurrentFrame } from "remotion";

const opacity = interpolate(frame, [0, 30], [0, 1], {
  extrapolateRight: "clamp",
});
```

**spring()** — Physics-based spring animation:
```tsx
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

const { fps } = useVideoConfig();
const scale = spring({ frame, fps, config: { damping: 200 } });
```

### Sequencing

**<Sequence>** — Offsets content in time:
```tsx
<Sequence from={30} durationInFrames={60}>
  <MyScene />
</Sequence>
```

**<Series>** — Places children one after another:
```tsx
import { Series } from "remotion";

<Series>
  <Series.Sequence durationInFrames={90}>
    <IntroScene />
  </Series.Sequence>
  <Series.Sequence durationInFrames={150}>
    <MainScene />
  </Series.Sequence>
  <Series.Sequence durationInFrames={60}>
    <OutroScene />
  </Series.Sequence>
</Series>
```

**<AbsoluteFill>** — Full-frame positioned container:
```tsx
<AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
  <h1>Hello World</h1>
</AbsoluteFill>
```

### Transitions

```tsx
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={90}>
    <Scene1 />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: 15 })}
  />
  <TransitionSeries.Sequence durationInFrames={90}>
    <Scene2 />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

Available transitions: `fade`, `slide`, `wipe`, `flip`, `clockWipe`, `none`

### Media

```tsx
import { Video, Audio, Img, staticFile } from "remotion";

// Static files go in /public
<Video src={staticFile("demo.mp4")} />
<Audio src={staticFile("music.mp3")} volume={0.5} />
<Img src={staticFile("logo.png")} />
```

## Project Setup

```bash
# Create new project
npx create-video@latest my-video

# Or manually:
mkdir my-video && cd my-video
npm init -y
npm install remotion @remotion/cli @remotion/transitions react react-dom
npm install -D typescript @types/react
```

### Required Files

**src/index.ts** (entry point):
```ts
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";
registerRoot(RemotionRoot);
```

**remotion.config.ts**:
```ts
import { Config } from "@remotion/cli/config";
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
```

## Commands

```bash
# Preview in browser (Remotion Studio)
npx remotion studio

# Render to MP4
npx remotion render MyVideo out/video.mp4

# Render specific frames
npx remotion render MyVideo out/video.mp4 --frames=0-90

# Render as GIF
npx remotion render MyVideo out/video.gif --image-format=png

# Render still image
npx remotion still MyVideo out/thumbnail.png --frame=45
```

## Best Practices

1. **Always clamp interpolations**: Use `extrapolateRight: "clamp"` to prevent values from overshooting
2. **Use spring() for natural motion**: Springs feel more organic than linear interpolation
3. **Keep scenes as separate components**: Each scene should be its own React component
4. **Use <Series> for sequential scenes**: Easier than calculating manual offsets
5. **Set explicit durations**: Every Sequence should have `durationInFrames`
6. **Use AbsoluteFill**: For full-frame backgrounds and overlapping layers
7. **Static assets in /public**: Use `staticFile()` to reference them
8. **Test at different frames**: Use Remotion Studio scrubber to verify animations
9. **Prefer CSS transforms**: `transform: scale()` and `translateX()` are GPU-accelerated
10. **Avoid heavy re-renders**: Memoize expensive computations with `useMemo`

## Common Patterns

### Fade-in text:
```tsx
const frame = useCurrentFrame();
const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
const y = interpolate(frame, [0, 20], [20, 0], { extrapolateRight: "clamp" });

<div style={{ opacity, transform: `translateY(${y}px)` }}>
  Hello World
</div>
```

### Staggered list items:
```tsx
{items.map((item, i) => {
  const delay = i * 8;
  const opacity = interpolate(frame, [delay, delay + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <div key={i} style={{ opacity }}>{item}</div>;
})}
```

### Typewriter effect:
```tsx
const charsShown = interpolate(frame, [0, text.length * 2], [0, text.length], {
  extrapolateRight: "clamp",
});
<span>{text.slice(0, Math.floor(charsShown))}</span>
```

## Extensions (all open source, npm install)

- `@remotion/transitions` — Scene transitions (fade, slide, wipe)
- `@remotion/three` — React Three Fiber 3D scenes in video
- `@remotion/lottie` — Embed Lottie animations
- `@remotion/gif` — Embed GIF files
- `@remotion/media-utils` — Audio/video metadata utilities
- `@remotion/noise` — Perlin noise for organic effects
- `@remotion/paths` — SVG path animation utilities

## Upstream Skill Sources

- Official skills: github.com/remotion-dev/skills
- Templates: github.com/reactvideoeditor/remotion-templates
- Superpowers pipeline: github.com/dojocodinglabs/remotion-superpowers
