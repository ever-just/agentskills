# Remotion Captions — Animated Subtitles for Video

> Add animated subtitles and captions to Remotion videos from .SRT files. TikTok-style word-by-word highlights, karaoke effects, and more.

## Overview

- **Repo**: github.com/ahgsql/remotion-subtitles
- **Language**: TypeScript / React
- **License**: Open Source
- **Install**: `npm install remotion-subtitles`
- **Requires**: Remotion project

## Setup

```bash
npm install remotion-subtitles
```

## Basic Usage

### From SRT File

```tsx
import { useSubtitles, SubtitleSequence } from "remotion-subtitles";

export const CaptionedVideo: React.FC = () => {
  const subtitles = useSubtitles("./subtitles.srt");

  return (
    <AbsoluteFill>
      <Video src={staticFile("video.mp4")} />
      <SubtitleSequence subtitles={subtitles} />
    </AbsoluteFill>
  );
};
```

### SRT Format

```srt
1
00:00:00,000 --> 00:00:02,500
Welcome to Custom Agents

2
00:00:02,500 --> 00:00:05,000
The AI-powered email platform

3
00:00:05,000 --> 00:00:08,000
that handles your inbox automatically
```

## Styling Captions

```tsx
<SubtitleSequence
  subtitles={subtitles}
  style={{
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 42,
    fontWeight: "bold",
    color: "white",
    textShadow: "2px 2px 8px rgba(0,0,0,0.8)",
    fontFamily: "Inter, sans-serif",
  }}
/>
```

## Word-by-Word Highlight (TikTok Style)

```tsx
import { useCurrentFrame, interpolate } from "remotion";

export const WordHighlightCaption: React.FC<{
  words: { text: string; startFrame: number; endFrame: number }[];
}> = ({ words }) => {
  const frame = useCurrentFrame();

  return (
    <div style={{
      position: "absolute",
      bottom: 100,
      width: "100%",
      textAlign: "center",
      display: "flex",
      justifyContent: "center",
      gap: 8,
      flexWrap: "wrap",
      padding: "0 60px",
    }}>
      {words.map((word, i) => {
        const isActive = frame >= word.startFrame && frame <= word.endFrame;
        const scale = isActive
          ? interpolate(frame, [word.startFrame, word.startFrame + 3], [1, 1.15], { extrapolateRight: "clamp" })
          : 1;

        return (
          <span
            key={i}
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: isActive ? "#FFD700" : "white",
              textShadow: isActive
                ? "0 0 20px rgba(255,215,0,0.5)"
                : "2px 2px 4px rgba(0,0,0,0.8)",
              transform: `scale(${scale})`,
              transition: "color 0.1s",
              display: "inline-block",
            }}
          >
            {word.text}
          </span>
        );
      })}
    </div>
  );
};
```

## Manual Caption Timing

If you don't have an SRT file, define captions manually:

```tsx
const captions = [
  { text: "Welcome to Custom Agents", startFrame: 0, endFrame: 75 },
  { text: "AI-powered email automation", startFrame: 80, endFrame: 150 },
  { text: "Create agents in minutes", startFrame: 155, endFrame: 240 },
];

export const ManualCaptions: React.FC = () => {
  const frame = useCurrentFrame();

  const current = captions.find(
    (c) => frame >= c.startFrame && frame <= c.endFrame
  );

  if (!current) return null;

  const progress = interpolate(
    frame,
    [current.startFrame, current.startFrame + 10],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  return (
    <div style={{
      position: "absolute",
      bottom: 80,
      width: "100%",
      textAlign: "center",
      opacity: progress,
      transform: `translateY(${(1 - progress) * 10}px)`,
    }}>
      <span style={{
        fontSize: 44,
        fontWeight: 700,
        color: "white",
        backgroundColor: "rgba(0,0,0,0.6)",
        padding: "8px 24px",
        borderRadius: 8,
      }}>
        {current.text}
      </span>
    </div>
  );
};
```

## Best Practices

1. **Position at bottom** — Standard caption placement is bottom-center
2. **Use contrast** — White text with dark shadow or semi-transparent background
3. **Large font** — 40-50px minimum for readability in video
4. **Short phrases** — Max 2 lines, 6-8 words per caption
5. **Timing buffer** — Start captions 2-3 frames before audio
6. **Animate entrance** — Subtle fade/slide in, no animation on exit
7. **Bold weight** — 700+ font weight for video readability

## Source

- remotion-subtitles: github.com/ahgsql/remotion-subtitles
- Remotion Audiogram template: github.com/remotion-dev/template-audiogram
