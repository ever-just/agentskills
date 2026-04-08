# Visual Asset Creation Rules

> Global rules for AI agents when creating visual assets programmatically. Follow these rules when working on any video, animation, presentation, or data visualization task.

## General Rules

1. **Always check for existing projects first** — Before scaffolding a new project, check if one already exists in the workspace.
2. **Use the skill file** — Before writing code for any tool, read its SKILL.md from `~/.agent-skills/skills/{tool}/SKILL.md` for best practices.
3. **No paid APIs** — Never suggest tools that require paid API keys (HeyGen, fal.ai, Replicate, etc.) unless the user explicitly asks.
4. **Local-only** — All rendering must happen locally. No cloud rendering services.
5. **FFmpeg required** — Verify FFmpeg is installed before attempting video renders: `which ffmpeg`

## Video Creation Rules

1. **Default to Remotion** for product/marketing videos and React-based projects.
2. **Use Motion Canvas** for educational/explainer content.
3. **Use Manim** for mathematical/scientific animations.
4. **Use MoviePy** for editing existing video files or Python-based projects.
5. **Always set explicit durations** — Never leave frame counts undefined.
6. **30fps standard** — Use 30fps unless the user specifies otherwise.
7. **1920x1080 default** — Standard HD unless specified otherwise.
8. **Preview before render** — Always start the studio/preview server before rendering final output.

## Animation Rules

1. **Never use linear easing** for UI animations — use spring physics or ease-out curves.
2. **Stagger child animations** — Lists and grids should animate items sequentially, not all at once.
3. **Keep animations under 500ms** for UI interactions.
4. **Use transforms** (translateX, scale, rotate) over position properties (top, left) for performance.
5. **Clamp interpolations** — Always use `extrapolateRight: "clamp"` in Remotion.

## Presentation Rules

1. **Slidev for developer audiences** — Markdown + Vue for technical content.
2. **One idea per slide** — Don't overcrowd.
3. **Use code highlighting** with line focus (`{2-3|5}` syntax in Slidev).
4. **Mermaid for diagrams** — Don't generate image files for flowcharts.

## Data Visualization Rules

1. **D3.js for custom visualizations** — When you need full control.
2. **Recharts/Nivo for standard charts** in React projects.
3. **Always animate data entry** — Bars should grow, lines should draw, pies should sweep.
4. **Use scales** — Never calculate pixel positions manually in D3.
5. **Responsive SVGs** — Always use viewBox, not fixed width/height.

## Color and Design Rules

1. **Use consistent color palette** — Define colors as constants, never hardcode hex values inline.
2. **Minimum contrast ratio** — 4.5:1 for text, 3:1 for large text.
3. **Dark backgrounds for video** — `#0a0a0a` to `#1a1a2e` range reads well on all screens.
4. **White or bright text** — `#ffffff` or brand accent colors for headings.
5. **Limit to 3-4 colors** per scene/slide.

## File Organization

```
project/
├── src/
│   ├── components/     # Reusable animation components
│   ├── scenes/         # Individual scenes/sections
│   ├── styles.ts       # Shared colors, fonts, dimensions
│   ├── Root.tsx         # Main composition (Remotion)
│   └── index.ts         # Entry point
├── public/             # Static assets (images, audio, video)
├── out/                # Rendered output
└── package.json
```

## Rendering Checklist

Before final render:
- [ ] All scenes preview correctly in studio
- [ ] No flickering or jumpy animations
- [ ] Text is readable at 1080p
- [ ] Audio (if any) is synced
- [ ] Total duration matches target
- [ ] File size is reasonable (<100MB for 1-2 min video)
