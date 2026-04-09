# Agent Skills

> A curated collection of **34+ AI agent skills** — structured knowledge files that teach coding agents (Windsurf/Cascade, Claude Code, Cursor, Codex, Gemini CLI) how to accomplish complex tasks. 221 files spanning visual asset creation, platform operations, writing, marketing, and content strategy.

## What Are Agent Skills?

Agent skills are **structured SKILL.md files** that give AI coding agents deep expertise in specific tools and workflows. Instead of relying on generic training data, skills provide:

- **Step-by-step instructions** tailored for AI agents
- **Code templates** and scaffolding commands
- **Decision trees** for choosing the right approach
- **Common pitfalls** and how to avoid them
- **Combination patterns** for multi-tool workflows

## Skill Categories

### 🎬 Visual Asset Creation
Open-source tools for programmatic video, animation, and presentation creation. No API keys needed — everything runs locally.

| Skill | Path | Best For |
|-------|------|----------|
| Remotion | [`skills/remotion/`](skills/remotion/) | React video creation, product demos, social clips |
| Motion Canvas | [`skills/motion-canvas/`](skills/motion-canvas/) | TypeScript explainer videos, tutorials |
| Manim | [`skills/manim/`](skills/manim/) | Python math/science animations |
| GSAP | [`skills/gsap/`](skills/gsap/) | Web animations, scroll effects |
| Slidev | [`skills/slidev/`](skills/slidev/) | Markdown/Vue animated presentations |
| D3.js | [`skills/d3-visualization/`](skills/d3-visualization/) | Animated data visualizations |
| Lottie | [`skills/lottie-animation/`](skills/lottie-animation/) | Logo/icon JSON animations |
| MoviePy | [`skills/moviepy/`](skills/moviepy/) | Python video editing/compositing |
| Framer Motion | [`skills/framer-motion/`](skills/framer-motion/) | React UI animations, transitions |
| Remotion Templates | [`skills/remotion-templates/`](skills/remotion-templates/) | Pre-built video effects for Remotion |
| Remotion Captions | [`skills/remotion-captions/`](skills/remotion-captions/) | Animated subtitles for Remotion |

### 🤖 Platform Operations
Skills for building, deploying, and operating AI-powered platforms.

| Skill | Path | Best For |
|-------|------|----------|
| Conversation Review | [`skills/conversation-review/`](skills/conversation-review/) | Auditing AI conversations (includes prompts, queries, sample reports) |
| Deployment Testing | [`skills/deployment-testing/`](skills/deployment-testing/) | Verifying deployments across environments |
| Email Mastery | [`skills/email-mastery/`](skills/email-mastery/) | AI email processing, classification, response |
| UI/UX Audit | [`skills/ui-ux-audit/`](skills/ui-ux-audit/) | Mobile & desktop UI/UX issue detection |
| GoDaddy API | [`skills/godaddy-api/`](skills/godaddy-api/) | Domain management, DNS records via GoDaddy REST API |

### ✍️ Writing, Marketing & Content (19 sub-skills)
A comprehensive collection for producing high-quality written content. See [`skills/white-paper-writing/README.md`](skills/white-paper-writing/README.md) for the full index.

| Category | Skills | Purpose |
|----------|--------|---------|
| Writing & Prose Quality | Beautiful Prose, Humanizer, Write Concisely | Eliminate AI tics, enforce muscular prose, apply Elements of Style |
| Doc Co-Authoring & Research | Anthropic Doc Co-Authoring, Content Research Writer, Notebook, Skill Authoring | 3-stage co-authoring, research pipelines, knowledge capture |
| Marketing & Copywriting | 7 skills (Copywriting, Content Strategy, Copy Editing, Launch/Pricing Strategy, Psychology, AI Marketing Skills) | Full SaaS marketing stack |
| Planning & Brainstorming | Writing Skills, Writing Plans, Brainstorming | TDD-based writing, strategic documentation, structured ideation |
| Document Export | DOCX Export, Markdown to PDF | Final deliverable generation |

## How to Use

### For Windsurf / Cascade
Reference skills in `.windsurf/rules/` or instruct the agent directly:
```
Read the Remotion skill from skills/remotion/SKILL.md and create a product intro video
```

### For Claude Code
```bash
cat skills/remotion/SKILL.md  # Load into context
```

### For Cursor
Reference in `.cursorrules` or load directly.

### For Any Agent
Point to the `AGENTS.md` manifest for automatic skill discovery:
```
Read AGENTS.md and help me create a [product video / animated presentation / data visualization]
```

## Skill File Format

Each skill follows a consistent structure:

```
skills/<skill-name>/
├── SKILL.md          # Main skill file (required)
├── examples/         # Example projects (optional)
├── templates/        # Scaffolding templates (optional)
└── rules.md          # Agent behavior rules (optional)
```

### SKILL.md Structure
```markdown
# Skill Name

## Overview
What this tool does and when to use it.

## Prerequisites
System requirements, installation commands.

## Quick Start
Minimal steps to get a working example.

## API Reference
Key functions, components, and patterns.

## Common Patterns
Frequently used code patterns and templates.

## Pitfalls
What agents commonly get wrong and how to fix it.

## Combining With Other Skills
How this skill works with other skills in this repo.
```

## Adding a New Skill

1. Create `skills/<skill-name>/SKILL.md`
2. Follow the format above
3. Add an entry to the table in this README
4. Update `AGENTS.md` with the new skill

### Qualifying Criteria
Every skill must meet ALL of these:
- **Actionable** — Agent can produce working output from the skill alone
- **Tested** — Instructions verified to produce correct results
- **Self-contained** — No undocumented dependencies
- **Maintained** — Updated when the underlying tool changes

## Requirements

- **Node.js 18+** (for JS/TS tools)
- **Python 3.9+** (for Python tools)
- **FFmpeg** (`brew install ffmpeg`) — required for video rendering
- **No API keys** — visual asset skills run entirely locally

## License

MIT

---

*Maintained by [Custom Agents](https://customagents.io)*
