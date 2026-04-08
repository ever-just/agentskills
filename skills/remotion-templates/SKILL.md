# Remotion Templates — Pre-Built Video Effects & Animations

> Copy-paste video components for Remotion. Intros, text effects, transitions, and full scene templates. Like shadcn/ui but for video.

## Overview

- **Repo**: github.com/reactvideoeditor/remotion-templates (77+ stars)
- **Component Library**: github.com/reactvideoeditor/clippkit
- **Language**: TypeScript / React
- **License**: Open Source
- **Install**: Copy components into your Remotion project

## How to Use

Templates are React components you copy into your project:

```bash
# Clone the templates repo
git clone https://github.com/reactvideoeditor/remotion-templates.git

# Copy the component you want into your project
cp remotion-templates/src/components/TextReveal.tsx my-video/src/components/
```

## Available Effect Categories

### Text Effects
- **Typewriter** — Character-by-character typing animation
- **Text Reveal** — Words sliding up with opacity fade
- **Kinetic Typography** — Large text with spring-based motion
- **Split Text** — Characters animate individually with stagger
- **Glitch Text** — Digital glitch effect on text
- **Gradient Text** — Animated gradient color on text

### Transitions
- **Fade** — Simple opacity crossfade
- **Slide** — Directional slide (left, right, up, down)
- **Wipe** — Directional wipe reveal
- **Zoom** — Scale-based transition
- **Morph** — Shape morphing between scenes
- **Glitch** — Digital glitch transition

### Intros / Outros
- **Logo Reveal** — Animated logo entrance
- **Title Card** — Centered title with subtitle
- **Lower Third** — Name/title bar animation
- **End Screen** — CTA with social links

### Backgrounds
- **Gradient** — Animated color gradients
- **Particles** — Floating particle system
- **Grid** — Animated grid pattern
- **Noise** — Perlin noise texture
- **Bokeh** — Blurred light orbs

### UI Mockups
- **Browser Window** — Chrome-style browser frame
- **Phone Mockup** — iPhone/Android frame
- **Code Editor** — VS Code-style code display
- **Terminal** — Terminal window with typing

## Example: Using a Text Reveal

```tsx
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

export const TextReveal: React.FC<{ text: string; delay?: number }> = ({
  text,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = text.split(" ");

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, overflow: "hidden" }}>
      {words.map((word, i) => {
        const wordDelay = delay + i * 4;
        const y = interpolate(frame, [wordDelay, wordDelay + 15], [40, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const opacity = interpolate(frame, [wordDelay, wordDelay + 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <span key={i} style={{ opacity, transform: `translateY(${y}px)`, display: "inline-block" }}>
            {word}
          </span>
        );
      })}
    </div>
  );
};
```

## Example: Browser Mockup

```tsx
export const BrowserMockup: React.FC<{
  url: string;
  children: React.ReactNode;
}> = ({ url, children }) => {
  return (
    <div style={{
      borderRadius: 12,
      overflow: "hidden",
      boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      background: "#1a1a2e",
    }}>
      {/* Title bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: "12px 16px",
        background: "#16213e",
        gap: 8,
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ffbd2e" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
        </div>
        <div style={{
          flex: 1,
          background: "#0f3460",
          borderRadius: 6,
          padding: "6px 12px",
          fontSize: 13,
          color: "#8892b0",
          textAlign: "center",
        }}>
          {url}
        </div>
      </div>
      {/* Content */}
      <div style={{ padding: 20, minHeight: 300 }}>
        {children}
      </div>
    </div>
  );
};
```

## Best Practices

1. **Copy, don't npm install** — Templates are meant to be copied and customized
2. **Customize colors** to match your brand palette
3. **Adjust timing** — Change frame durations to fit your video's pace
4. **Combine templates** — Use a background + text effect + transition together
5. **Keep originals** — Copy to a new file before heavily modifying

## Source

- Templates: github.com/reactvideoeditor/remotion-templates
- Clippkit (component lib): github.com/reactvideoeditor/clippkit
- Browse visually: reactvideoeditor.com/remotion-templates
