# AGENT DISCOVERY MANIFEST

> This file is designed to be read by AI coding agents (Windsurf/Cascade, Claude Code, Cursor, Codex, Gemini CLI) to discover available skills. Read the relevant SKILL.md file for detailed guidance on any skill.

## Available Skills

### VIDEO CREATION

| Skill | Path | Use When |
|-------|------|----------|
| **Remotion** | `skills/remotion/SKILL.md` | Creating product videos, social media clips, brand videos, animated demos using React/TypeScript |
| **Motion Canvas** | `skills/motion-canvas/SKILL.md` | Creating explainer videos, code walkthroughs, educational content with TypeScript |
| **Manim** | `skills/manim/SKILL.md` | Creating math/science animations, algorithm visualizations, data storytelling with Python |
| **MoviePy** | `skills/moviepy/SKILL.md` | Programmatic video editing, compositing, frame-by-frame effects with Python |
| **Remotion Templates** | `skills/remotion-templates/SKILL.md` | Pre-built video effects, intros, transitions, text animations for Remotion |
| **Remotion Captions** | `skills/remotion-captions/SKILL.md` | Adding animated subtitles/captions to Remotion videos from SRT files |

### ANIMATION & MOTION GRAPHICS

| Skill | Path | Use When |
|-------|------|----------|
| **GSAP** | `skills/gsap/SKILL.md` | Web animations, scroll-linked effects, SVG animations, timeline-based sequences |
| **Framer Motion** | `skills/framer-motion/SKILL.md` | React UI animations, page transitions, gesture interactions, layout animations |
| **Lottie Animation** | `skills/lottie-animation/SKILL.md` | Creating animated logos, icons, micro-interactions as Lottie JSON |

### PRESENTATIONS

| Skill | Path | Use When |
|-------|------|----------|
| **Slidev** | `skills/slidev/SKILL.md` | Creating animated developer presentations from Markdown with Vue components |

### DATA VISUALIZATION

| Skill | Path | Use When |
|-------|------|----------|
| **D3.js** | `skills/d3-visualization/SKILL.md` | Animated charts, data-driven graphics, interactive visualizations |

### PLATFORM OPERATIONS

| Skill | Path | Use When |
|-------|------|----------|
| **Conversation Review** | `skills/conversation-review/SKILL.md` | Auditing AI conversation quality, identifying failure patterns |
| **Deployment Testing** | `skills/deployment-testing/SKILL.md` | Verifying deployments, health checks, smoke testing |
| **Email Mastery** | `skills/email-mastery/SKILL.md` | AI email classification, response generation, template design |
| **UI/UX Audit** | `skills/ui-ux-audit/SKILL.md` | Mobile and desktop UI/UX issue detection and remediation |
| **White Paper Writing** | `skills/white-paper-writing/SKILL.md` | Technical white paper structure, research, and writing |

## Decision Tree

```
User needs help with...
├── VIDEO?
│   ├── Product demo / brand video → Remotion
│   ├── Explainer / tutorial → Motion Canvas
│   ├── Math / science → Manim
│   ├── Edit existing video → MoviePy
│   └── Need captions → Remotion + Remotion Captions
├── ANIMATION?
│   ├── Web page animations → GSAP
│   ├── React UI transitions → Framer Motion
│   └── Logo / icon animation → Lottie Animation
├── PRESENTATION?
│   └── Slide deck → Slidev
├── DATA VIZ?
│   └── Charts / graphs → D3.js (or D3 inside Remotion for video)
└── PLATFORM OPS?
    ├── Review AI conversations → Conversation Review
    ├── Verify a deployment → Deployment Testing
    ├── Email pipeline → Email Mastery
    ├── Find UI bugs → UI/UX Audit
    └── Write documentation → White Paper Writing
```

## Combining Skills

- **Remotion + D3.js** = Animated data visualization videos
- **Remotion + Remotion Templates** = Professional video with pre-built effects
- **Remotion + Remotion Captions** = Videos with animated subtitles
- **GSAP + D3.js** = Scroll-animated data dashboards
- **Slidev + D3.js** = Data-rich animated presentations
- **Motion Canvas + Manim** = Technical explainer videos
- **Deployment Testing + UI/UX Audit** = Full release verification

---

*This manifest is the entry point for AI agent skill discovery.*
*Read the SKILL.md file in each skill directory for detailed instructions.*
