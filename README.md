# Agent Skills

> A curated collection of **90+ AI agent skills** — structured knowledge files that teach coding agents (Windsurf/Cascade, Claude Code, Cursor, Codex, Gemini CLI) how to accomplish complex tasks. Spanning visual asset creation, platform operations, the full everjust.app Odoo tenant surface, AI-agent auditing, writing, marketing, and content strategy.

> **Contributing a skill?** See [`CONTRIBUTING.md`](CONTRIBUTING.md) for how to structure, place, register, and PR a skill — and how multiple agents can edit this repo without collisions.

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
| Web Embed Video Optimization | [`skills/web-embed-video-optimization/`](skills/web-embed-video-optimization/) | Optimizing/embedding an existing video as a fast, autoplaying web hero/loop |
| SVG Logo & Brand Asset Pipeline | [`skills/svg-logo-brand-asset-pipeline/`](skills/svg-logo-brand-asset-pipeline/) | Static logo/favicon design + full icon-set export; normalizing sourced logos to one style |

### 🤖 Platform Operations
Skills for building, deploying, and operating AI-powered platforms.

| Skill | Path | Best For |
|-------|------|----------|
| Conversation Review | [`skills/conversation-review/`](skills/conversation-review/) | Auditing AI conversations (includes prompts, queries, sample reports) |
| Deployment Testing | [`skills/deployment-testing/`](skills/deployment-testing/) | Verifying deployments across environments |
| Email Mastery | [`skills/email-mastery/`](skills/email-mastery/) | AI email processing, classification, response |
| UI/UX Audit | [`skills/ui-ux-audit/`](skills/ui-ux-audit/) | Mobile & desktop UI/UX issue detection |
| GoDaddy API | [`skills/godaddy-api/`](skills/godaddy-api/) | Domain management, DNS records via GoDaddy REST API |
| Sentry Instrumentation | [`skills/sentry-instrumentation/`](skills/sentry-instrumentation/) | Error tracking for Express/Next.js routes |
| MongoDB Schema Audit | [`skills/mongodb-schema-audit/`](skills/mongodb-schema-audit/) | Index coverage, relationship validation, migrations |
| Admin Dashboard Verification | [`skills/admin-dashboard-verification/`](skills/admin-dashboard-verification/) | Systematic admin feature verification |
| Bun Testing | [`skills/bun-testing/`](skills/bun-testing/) | Fast simulation tests with Bun runtime |
| CDP Render Verification | [`skills/cdp-render-verification/`](skills/cdp-render-verification/) | Headless-Chrome CDP verification of web changes (computed styles, mobile, flows) |
| Trust Center & Compliance Program | [`skills/trust-center-compliance-program/`](skills/trust-center-compliance-program/) | Self-host Probo + author SOC 2 / ISO 27001 / GDPR program |
| EVERJUST Website Infra Views | [`skills/everjust-website-infra-views/`](skills/everjust-website-infra-views/) | Edit infra/chrome/JSON-LD/CSS views + robots.txt on an everjust.app tenant via XML-RPC (MCP blocks `ir.ui.view`) |
| Local-Business AEO/GEO Schema | [`skills/local-business-aeo-schema/`](skills/local-business-aeo-schema/) | LocalBusiness/Service/FAQ/Review JSON-LD for local SEO + AI-answer citation |
| Custom-Domain Email/DNS Diagnosis | [`skills/custom-domain-email-dns-diagnosis/`](skills/custom-domain-email-dns-diagnosis/) | Registrar-vs-DNS-host split, 'no zone' errors, why email won't configure |
| Odoo Direct JSON-RPC Access | [`skills/odoo-direct-jsonrpc-access/`](skills/odoo-direct-jsonrpc-access/) | Odoo 19 /jsonrpc access with login+password (no MCP/Bearer needed) |
| Web Deploy Verification | [`skills/web-deploy-verification/`](skills/web-deploy-verification/) | Confirm a merged change is live — URL polling, local screenshot fallback |
| Agent Discoverability | [`skills/agent-discoverability/`](skills/agent-discoverability/) | Publishing an MCP server so agents find and connect it: registry + directories, OAuth discovery chain, capability manifest, DNS-AID |

### 🏢 EverJust Platform (everjust.app Odoo 19 multi-tenant SaaS)
Operating a live everjust.app tenant end-to-end via the Odoo MCP/ORM — mail, mass mailing, domain migration, CRM, HR, projects, e-signature, telephony, and the full public-website surface. `everjust-platform` + `everjust-agent-mcp` are the foundation every other skill in this group builds on.

| Skill | Path | Best For |
|-------|------|----------|
| EverJust Platform | [`skills/everjust-platform/`](skills/everjust-platform/) | Operating rules for any everjust.app tenant — read first |
| EverJust Agent MCP | [`skills/everjust-agent-mcp/`](skills/everjust-agent-mcp/) | Connecting to a tenant's MCP server and its toolset |
| EverJust Mail Ops | [`skills/everjust-mail-ops/`](skills/everjust-mail-ops/) | Send/read mail as a tenant mailbox, diagnose blocked sends, domain verification |
| EverJust Mass Mailing | [`skills/everjust-mass-mailing/`](skills/everjust-mass-mailing/) | Bulk/campaign email — lists, drafts, tests, human-gated blasts, analytics |
| EverJust Tenant Domain Migration | [`skills/everjust-tenant-domain-migration/`](skills/everjust-tenant-domain-migration/) | Rebrand/cutover a tenant to a new public domain |
| EverJust CRM & Sales | [`skills/everjust-crm-sales/`](skills/everjust-crm-sales/) | Leads/opportunities pipeline management |
| EverJust Appointments | [`skills/everjust-appointments/`](skills/everjust-appointments/) | Online booking → calendar + CRM lead + confirmation |
| EverJust Calendar & Contacts | [`skills/everjust-calendar-contacts/`](skills/everjust-calendar-contacts/) | Contact spine + calendar scheduling/sync |
| EverJust Client Portal | [`skills/everjust-client-portal/`](skills/everjust-client-portal/) | Customer self-service `/my/*` portal access |
| EverJust Documents | [`skills/everjust-documents/`](skills/everjust-documents/) | Folders/files, upload/download, storage |
| EverJust Events | [`skills/everjust-events/`](skills/everjust-events/) | Event creation, registrations, CRM/reminder wiring |
| EverJust Payroll & HR | [`skills/everjust-payroll-hr/`](skills/everjust-payroll-hr/) | Employees, contracts, attendance, payslips |
| EverJust Projects | [`skills/everjust-projects/`](skills/everjust-projects/) | Projects/tasks, kanban, assignment |
| EverJust QuickBooks | [`skills/everjust-quickbooks/`](skills/everjust-quickbooks/) | QBO OAuth connector, invoice/chart-of-accounts sync |
| EverJust Sign | [`skills/everjust-sign/`](skills/everjust-sign/) | E-signature requests and signed-PDF audit trail |
| EverJust SMS | [`skills/everjust-sms/`](skills/everjust-sms/) | SMS send, templates, mass-SMS, delivery state |
| EverJust Telephony | [`skills/everjust-telephony/`](skills/everjust-telephony/) | Call logging, recordings/voicemail, outbound calls |
| EverJust Website (+9 sub-skills) | [`skills/everjust-website/`](skills/everjust-website/) | Pages, blog, forms, forum, i18n, newsletter, SEO, snippets, themes, community |
| EverJust Website Customization | [`skills/everjust-website-customization/`](skills/everjust-website-customization/) | Durable Odoo tenant edits from the shell (COW views, custom_code_head, base_automation) |
| EverJust Website GEO Content | [`skills/everjust-website-geo-content/`](skills/everjust-website-geo-content/) | Citable content clusters + per-page schema + sitemap-freshness for AI answer-engine citation on an everjust Odoo site |
| EverJust Odoo Shell Ops | [`skills/everjust-odoo-shell-ops/`](skills/everjust-odoo-shell-ops/) | Tenant Odoo box-shell ops: DB-only publishing, COW-fork gotcha, CI-rsync recovery, deploy-collision avoidance, ir.cron, nginx |

### 🔬 AI Agent Auditing & Forensics
Skills for auditing a *deployed* AI-agent platform from its real logs — extracting production data, grading agent behavior, and turning findings into validated, actionable fixes. Battle-tested on a multi-channel (SMS/email/voice/chat) agent product.

| Skill | Path | Best For |
|-------|------|----------|
| Production Agent Audit | [`skills/production-agent-audit/`](skills/production-agent-audit/) | End-to-end log audit: census → multi-source extraction → fan-out analysis → adversarial verification → graded report |
| EC2 Instance Connect Data Pull | [`skills/ec2-instance-connect-data-pull/`](skills/ec2-instance-connect-data-pull/) | Read-only prod shell with no stored SSH key (AWS Instance Connect), then pull Mongo/logs home via tar+base64 |
| Agent Quality Grading | [`skills/agent-quality-grading/`](skills/agent-quality-grading/) | Grade conversations (task/speed/tools/message-quality), generated assets, and prompts/configs — with verbatim evidence |
| Finding → Fix Remediation | [`skills/finding-forensic-remediation/`](skills/finding-forensic-remediation/) | Turn findings into a git-grounded backlog: root cause at path:line, when-introduced, status, exact fix |
| Temporal Finding Validation | [`skills/temporal-finding-validation/`](skills/temporal-finding-validation/) | Cross-check findings vs the commit timeline (UTC-normalized) — still-live vs already-fixed |

### 🔍 Research & Due Diligence
Skills for researching companies, vetting vendors, and surfacing legal and reputation risk using only free public sources.

| Skill | Path | Best For |
|-------|------|----------|
| Company Legal & Reputation Research | [`skills/company-legal-reputation-research/`](skills/company-legal-reputation-research/) | Court records, liens, sanctions, BBB/Glassdoor, debarment checks — no API keys |
| GitHub Search | [`skills/github-search/`](skills/github-search/) | Repo/code/topic search with official GitHub syntax, REST API limits, find-a-framework playbook |
| Marketing-Site Authenticity Audit | [`skills/marketing-site-authenticity-audit/`](skills/marketing-site-authenticity-audit/) | Audit own marketing site for fabricated case studies/reviews; honest remediation |

### 🏗️ Software Architecture & System Design
Authoritative-source maps for designing production-grade, scalable software systems.

| Skill | Path | Best For |
|-------|------|----------|
| System Design & Architecture | [`skills/system-design-architecture/`](skills/system-design-architecture/) | Backend design end-to-end: security, the scaling ladder, capacity/thresholds, cost modeling, architecture archetypes (multi-tenant SaaS, multi-agent/LLM), product layers, cloud service maps (AWS/GCP/Azure/Cloudflare), real-system case studies, open standards, decision records (ADRs) — with review checklists + a worked example |

### ✍️ Writing, Marketing & Content (19 sub-skills)
A comprehensive collection for producing high-quality written content. See [`skills/white-paper-writing/README.md`](skills/white-paper-writing/README.md) for the full index.

| Category | Skills | Purpose |
|----------|--------|---------|
| Writing & Prose Quality | Beautiful Prose, Humanizer, Write Concisely | Eliminate AI tics, enforce muscular prose, apply Elements of Style |
| Doc Co-Authoring & Research | Anthropic Doc Co-Authoring, Content Research Writer, Notebook, Skill Authoring | 3-stage co-authoring, research pipelines, knowledge capture |
| Marketing & Copywriting | 7 skills (Copywriting, Content Strategy, Copy Editing, Launch/Pricing Strategy, Psychology, AI Marketing Skills) | Full SaaS marketing stack |
| Planning & Brainstorming | Writing Skills, Writing Plans, Brainstorming | TDD-based writing, strategic documentation, structured ideation |
| Document Export | DOCX Export, Markdown to PDF | Final deliverable generation |

### ⚙️ Frontend Engineering & Agent Orchestration
Battle-tested methods from a real Next.js + Tailwind v4 console redesign — how to fan the work out across agents, audit it empirically, theme it, and build the component layer.

| Skill | Path | Best For |
|-------|------|----------|
| Parallel Agent Refactor | [`skills/parallel-agent-refactor/`](skills/parallel-agent-refactor/) | Large multi-file migrations via disjoint-ownership subagent fan-out + wave barriers |
| Empirical Responsive Audit | [`skills/empirical-responsive-audit/`](skills/empirical-responsive-audit/) | Mechanical mobile/layout defect detection with a Playwright probe (ships a CI gate) |
| Dark Mode Token Migration | [`skills/dark-mode-token-migration/`](skills/dark-mode-token-migration/) | Adding dark mode via a semantic token layer, with light kept pixel-identical |
| shadcn + Tailwind v4 Primitives | [`skills/shadcn-tailwind-v4-primitives/`](skills/shadcn-tailwind-v4-primitives/) | Scaffolding token-based shadcn/ui + Radix primitives on Tailwind v4 |
| UX Decision Rubrics | [`skills/ux-decision-rubrics/`](skills/ux-decision-rubrics/) | Objective form-control choice + user-story clarity scoring |

### 🎯 GTM, Prospecting & Agent Orchestration
Skills for building large sales/GTM datasets from public data and for orchestrating the concurrent subagents that produce them.

| Skill | Path | Best For |
|-------|------|----------|
| ICP Prospect List Builder | [`skills/icp-prospect-list-builder/`](skills/icp-prospect-list-builder/) | Building a prioritized, source-cited prospect dataset (companies + size-routed contacts) from public data — ICP scoring, ranked discovery sources incl. the Product Hunt API, dedup |
| Parallel Agent Fan-Out | [`skills/parallel-agent-fanout/`](skills/parallel-agent-fanout/) | Orchestrating dozens of concurrent subagents into one verified dataset — 3-wave pipeline, no-delegation rule, file-on-disk checks, recombine + row-integrity validation |

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
