# AGENT DISCOVERY MANIFEST

> This file is designed to be read by AI coding agents (Windsurf/Cascade, Claude Code, Cursor, Codex, Gemini CLI) to discover available skills. Read the relevant SKILL.md file for detailed guidance on any skill.

> **Adding or editing a skill?** Read [`CONTRIBUTING.md`](CONTRIBUTING.md) first — how to structure a skill, where to register it, and how to work here without colliding with other agents.

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
| **Web Embed Video Optimization** | `skills/web-embed-video-optimization/SKILL.md` | Optimizing/transcoding an existing video into a fast, crisp, autoplaying web hero/loop (H.264, faststart, poster, embed) |

### ANIMATION & MOTION GRAPHICS

| Skill | Path | Use When |
|-------|------|----------|
| **GSAP** | `skills/gsap/SKILL.md` | Web animations, scroll-linked effects, SVG animations, timeline-based sequences |
| **Framer Motion** | `skills/framer-motion/SKILL.md` | React UI animations, page transitions, gesture interactions, layout animations |
| **Lottie Animation** | `skills/lottie-animation/SKILL.md` | Creating animated logos, icons, micro-interactions as Lottie JSON |
| **SVG Logo & Brand Asset Pipeline** | `skills/svg-logo-brand-asset-pipeline/SKILL.md` | Designing a static vector logo/favicon and exporting the full production asset set; normalizing third-party sourced logos to one monochrome style |

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
| **Email Mastery** | `skills/email-mastery/EMAIL_SKILLS.md` | AI email classification, response generation, template design |
| **UI/UX Audit** | `skills/ui-ux-audit/SKILL.md` | Mobile and desktop UI/UX issue detection and remediation |
| **UX Evaluation** | `skills/ux-evaluation/SKILL.md` | Diagnosing where a UX problem lives (strategy, structure, skeleton, surface) before fixing it; IA, interaction design, design systems |
| **GoDaddy API** | `skills/godaddy-api/SKILL.md` | Domain management, DNS records, availability checks via GoDaddy REST API |
| **Sentry Instrumentation** | `skills/sentry-instrumentation/SKILL.md` | Adding error tracking to Express/Next.js routes, verification testing |
| **MongoDB Schema Audit** | `skills/mongodb-schema-audit/SKILL.md` | Index coverage auditing, relationship validation, data migrations |
| **Admin Dashboard Verification** | `skills/admin-dashboard-verification/SKILL.md` | Systematic verification of admin dashboard features, drawers, cross-nav |
| **Bun Testing** | `skills/bun-testing/SKILL.md` | Fast simulation tests with Bun — file verification, mock data, schema checks |
| **Web Visibility** | `skills/web-visibility/SKILL.md` | SEO + AEO/GEO discoverability for search engines AND AI answer engines (ChatGPT Search, Perplexity, AI Overviews) — JSON-LD, robots.txt/llms.txt/IndexNow, auditing or building visibility into a new product |
| **GitHub Research** | `skills/github-research/SKILL.md` | Searching GitHub intelligently for specs, reference implementations, adopters, config patterns — right surface (REST/GraphQL/code search), right qualifiers, gh CLI vs MCP |
| **CDP Render Verification** | `skills/cdp-render-verification/SKILL.md` | Proving a web change rendered right via headless Chrome over CDP — computed-style checks, mobile emulation, code-leak/overflow detection, flow-driving |
| **Trust Center & Compliance Program** | `skills/trust-center-compliance-program/SKILL.md` | Self-host Probo + author a coherent SOC 2 / ISO 27001 / GDPR program (controls, policies, risk register, RoPA, DPA, sub-processors) |
| **EVERJUST Website Infra Views (MCP/XML-RPC)** | skills/everjust-website-infra-views/SKILL.md | Edit header/footer/JSON-LD/CSS infra views + robots.txt on an everjust.app tenant with NO SSH — the MCP `update` tool blocks `ir.ui.view` so write it via remote XML-RPC; an `active=False` fork shadows the base view; MCP/XML-RPC writes hot-invalidate the cache (no restart); `.grid` vs Tailwind; pace requests (503 under load) |
| **Local-Business AEO/GEO Schema** | skills/local-business-aeo-schema/SKILL.md | Hand-author LocalBusiness/Service/FAQPage/Review/Breadcrumb JSON-LD for local SEO + AI-answer citation — sitewide `@id=#business` node, FAQPage from VISIBLE content, `aggregateRating` on Service not the business (Google Dec-2025), AI-crawler robots allowlist, bot-challenge invisibility, llms.txt reality-check |
| **Custom-Domain Email/DNS Diagnosis** | skills/custom-domain-email-dns-diagnosis/SKILL.md | Diagnose why email won't configure on a custom domain — registrar != DNS host (`dig NS` first), registrar API 'no zone' when nameservers are delegated elsewhere, email records can't break the live site, match architecture to the infra |
| **Odoo Direct JSON-RPC Access** | `skills/odoo-direct-jsonrpc-access/SKILL.md` | Calling Odoo 19's classic /jsonrpc endpoint with a login+password when MCP/Bearer access isn't available — auth, batching, idempotent bulk import |
| **Web Deploy Verification** | `skills/web-deploy-verification/SKILL.md` | Confirming a merged web change is actually live — URL polling, local-build screenshot fallback |
| **Agent Discoverability** | `skills/agent-discoverability/SKILL.md` | Publish/register an MCP server so agents find and connect to it: official registry + directories, the OAuth well-known discovery chain, /.well-known/agent/mcp.json, and DNS-AID records (SVCB/TXT/TLSA/DNSSEC) |
| **Generative Engine Optimization** | `skills/generative-engine-optimization/SKILL.md` | Optimizing a site so AI answer engines (ChatGPT, Perplexity, Google AI Overviews/Mode, Copilot) cite it as THE answer for category/intent searches, not just brand-name lookups |
| **MCP Server Discoverability** | `skills/mcp-server-discoverability/SKILL.md` | Making a hosted MCP server + REST API discoverable/usable by AI agents — MCP Registry, /.well-known OAuth discovery, connector directories, agent-ranking tool descriptions |
| **Reverse-Proxy CMS Indexing** | `skills/reverse-proxy-cms-indexing/SKILL.md` | Fixing SEO/indexing for a CMS behind a Host-rewriting reverse proxy (nginx/Cloudflare) — wrong robots.txt/sitemap/canonical from internal-vs-public host mismatch, ESPECIALLY on everjust.app/customdomain.ai |
| **GitHub Actions → EC2 Deploy** | `skills/github-actions-ec2-deploy/SKILL.md` | CI/CD pipeline that deploys on every push to master by SSHing into an EC2 instance, pulling code, rebuilding containers, verifying health |
| **GitHub Repo Management** | `skills/github-repo-management/SKILL.md` | Initializing a local dir as a git repo, creating a new GitHub repo (public/private), pushing existing work, cleaning up after renames/deletes — via `gh` CLI |
| **Twilio Embedded Telephony** | `skills/twilio-embedded-telephony/SKILL.md` | Building a fully embedded phone system (calls + SMS) inside a web app using Twilio Voice JS SDK + Programmable SMS — no browser extensions, 100% white-labeled |
| **Product Hunt Launch** | `skills/product-hunt-launch/SKILL.md` | Preparing and shipping a Product Hunt launch — copy, on-brand gallery assets at PH's exact sizes, demo video to YouTube, manual-submission handoff (the API has no launch-creation mutation) |
| **Deploy-Log Forensics** | `skills/deploy-log-forensics/SKILL.md` | Attributing what changed on production (commit → module → tenant → time) from CI/CD run logs when there's NO server access — run→commit-range mapping, log change-markers, caused-vs-exposed, diagnostic-dispatch hygiene |
| **Production Revert Discipline** | `skills/production-revert-discipline/SKILL.md` | Safely reverting a deployed feature on a stateful platform — culprit binding, dependency check on later commits, what a revert does NOT undo (DB installs, exposed core surfaces), the stale-revert decay rule |

### EVERJUST PLATFORM (everjust.app Odoo 19 multi-tenant SaaS)

| Skill | Path | Use When |
|-------|------|----------|
| **EverJust Platform** | `skills/everjust-platform/SKILL.md` | Operating rules for ANY everjust.app tenant — multi-tenant Odoo 19 CE fork, one Postgres DB per tenant. Read first, before any other everjust-* skill |
| **EverJust Agent MCP** | `skills/everjust-agent-mcp/SKILL.md` | Connecting to/operating a tenant's built-in MCP server at `https://<tenant>.everjust.app/mcp` — the toolset every other everjust-* skill routes through |
| **EverJust Mail Ops** | `skills/everjust-mail-ops/SKILL.md` | Sending/reading mail as a tenant mailbox (everjust.mail.account), diagnosing a blocked send, checking domain verification/DKIM, checking suppression — the native webmail stack (NOT Discuss, NOT mass mailing) |
| **EverJust Mass Mailing** | `skills/everjust-mass-mailing/SKILL.md` | Bulk/campaign email (mailing.mailing/mailing.list/mailing.contact) — building lists, drafting campaigns, sending tests, and the human-gated real blast + reading opens/clicks/bounces |
| **EverJust Tenant Domain Migration** | `skills/everjust-tenant-domain-migration/SKILL.md` | Moving a live tenant from one public domain to another (rebrand/cutover) — mail identity, canonical bases, signatures, DB-wide old-domain sweep, nginx add-new + 301-retire-old |
| **EverJust CRM & Sales** | `skills/everjust-crm-sales/SKILL.md` | Leads/opportunities pipeline — create/qualify a lead, move stages, assign salesperson/team, log activities, mark won/lost, UTM attribution |
| **EverJust Appointments** | `skills/everjust-appointments/SKILL.md` | Online booking → calendar event + optional CRM lead + confirmation email — configure appointment types/slots, create/confirm/reschedule bookings |
| **EverJust Calendar & Contacts** | `skills/everjust-calendar-contacts/SKILL.md` | The shared res.partner contact spine + calendar.event scheduling, with optional Google/Microsoft calendar sync |
| **EverJust Client Portal** | `skills/everjust-client-portal/SKILL.md` | Granting a customer self-service `/my/*` portal login and operating what they can see there |
| **EverJust Documents** | `skills/everjust-documents/SKILL.md` | Browse/create/move folders and files, upload/download, tag, migrate storage, point Documents at the tenant's private cloud |
| **EverJust Events** | `skills/everjust-events/SKILL.md` | Create/publish an event, manage attendee registrations, wire registrations to CRM leads, schedule reminder email/SMS |
| **EverJust Payroll & HR** | `skills/everjust-payroll-hr/SKILL.md` | hr.employee/hr.payslip/hr.attendance — read employees/contracts (hr.version), pull attendance, generate/compute a payslip batch |
| **EverJust Projects** | `skills/everjust-projects/SKILL.md` | project.project/project.task — create/find projects and tasks, move kanban stages, assign, deadlines, tags |
| **EverJust QuickBooks** | `skills/everjust-quickbooks/SKILL.md` | QuickBooks Online connector — OAuth connect, pull chart of accounts, push a posted invoice Odoo→QBO, check connection health |
| **EverJust Sign** | `skills/everjust-sign/SKILL.md` | E-signature requests — create a signable PDF, add typed signers by role, send, track signing, download the signed PDF + tamper-evidence log |
| **EverJust SMS** | `skills/everjust-sms/SKILL.md` | Send SMS to a number or as chatter, use a template, mass-SMS a record set, inspect delivery state and gateway routing |
| **EverJust Telephony** | `skills/everjust-telephony/SKILL.md` | Voice + call-logging — inspect/log calls, read recordings/voicemail transcriptions, place/trigger outbound calls, call-related SMS |
| **EverJust Website** | `skills/everjust-website/SKILL.md` | Public marketing site pages (copy-on-write QWeb), nav menus, redirects, per-page SEO metadata, publish/schedule state |
| **EverJust Website Blog** | `skills/everjust-website-blog/SKILL.md` | Author/publish blog posts — rich content, teaser, cover image, tags, SEO/OG meta, scheduled or back-dated publish |
| **EverJust Website Community** | `skills/everjust-website-community/SKILL.md` | Reputation/gamification/public profiles — award karma, grant/publish badges |
| **EverJust Website Customization** | `skills/everjust-website-customization/SKILL.md` | Deep, durable Odoo tenant edits from the odoo shell (COW views, custom_code_head CSS/JS, base_automation) — the layer below the MCP/website builder |
| **EverJust Website Events** | `skills/everjust-website-events/SKILL.md` | Public event minisite at `/event/<slug>` — Register/Agenda/Talks/Exhibitors sub-pages, publish agenda/speakers |
| **EverJust Website Forms** | `skills/everjust-website-forms/SKILL.md` | Wire a public form to a backend model — enable a model as a form target, place the form, route submissions (e.g. Contact-Us → CRM lead) |
| **EverJust Website Forum** | `skills/everjust-website-forum/SKILL.md` | Q&A Forum lifecycle — ask/answer/accept/close, votes, tags, karma economy, moderation |
| **EverJust Website i18n** | `skills/everjust-website-i18n/SKILL.md` | Multi-language marketing site — activate a language, add it to the site's selector, translate a page's body + SEO fields |
| **EverJust Website Newsletter** | `skills/everjust-website-newsletter/SKILL.md` | Newsletter subscribe surface (snippet/form) bound to a mailing.list — the front-end intake half of Mass Mailing |
| **EverJust Website SEO** | `skills/everjust-website-seo/SKILL.md` | Meta title/description/OG image/canonical, sitemap/crawlability, social profile JSON-LD, robots.txt, Search Console/IndexNow |
| **EverJust Website Snippets** | `skills/everjust-website-snippets/SKILL.md` | Author/edit content blocks (s_* snippet triad), oe_structure drop-zones, wrap-don't-rewrite method for on-brand Tailwind ports |
| **EverJust Website Themes** | `skills/everjust-website-themes/SKILL.md` | Lifting a design-themes block vs a full theme swap, and why brand fonts/colors are always-on for everjust tenants |
| **EverJust Website GEO Content** | `skills/everjust-website-geo-content/SKILL.md` | Build citable content clusters (pillar/glossary/guides) + per-page FAQPage/DefinedTerm/TechArticle JSON-LD + sitemap-freshness cron so an everjust Odoo site gets cited by AI answer engines |
| **EverJust Odoo Shell Ops** | `skills/everjust-odoo-shell-ops/SKILL.md` | Operate a tenant Odoo from the box shell: DB-only publishing, COW-fork gotcha, restart-to-compile, CI-rsync recovery, deploy-collision avoidance, ir.cron, nginx stale-inode |

### ODOO PLATFORM DEVELOPMENT (generic Odoo, not everjust-tenant-specific)

| Skill | Path | Use When |
|-------|------|----------|
| **Odoo Community/Enterprise Parity** | `skills/odoo-community-enterprise-parity/SKILL.md` | Replicating Enterprise-only features in Odoo 19 Community Edition via OCA modules, custom addons, and strategic integration |
| **Odoo Module 18→19 Migration** | `skills/odoo-module-18-to-19-migration/SKILL.md` | Porting OCA or custom Odoo modules from 18.0 to 19.0 — 130 model renames, 51 field renames, security rewrite, view schema changes |
| **Odoo Multi-Tenant SaaS** | `skills/odoo-multi-tenant-saas/SKILL.md` | Building a self-hosted multi-tenant SaaS platform on Odoo 19 CE — isolated Postgres DB per tenant, custom subdomain, fully debranded UI from one binary |

### DESIGN & FRONTEND ARTIFACTS

| Skill | Path | Use When |
|-------|------|----------|
| **Canvas Design** | `skills/canvas-design/SKILL.md` | Creating beautiful visual art (poster/design/static piece) as .png/.pdf using design philosophy and original composition |
| **Frontend Design** | `skills/frontend-design/SKILL.md` | Building distinctive, production-grade frontend interfaces with high design quality — web components, pages, artifacts, apps |
| **Web Artifacts Builder** | `skills/web-artifacts-builder/SKILL.md` | Multi-component claude.ai HTML artifacts using React/Tailwind/shadcn — state management, routing, complex components (not simple single-file JSX) |
| **LLM Deeplink Widget** | `skills/llm-deeplink-widget/SKILL.md` | Building an "Ask AI about us" widget — icon buttons that deep-link a visitor into their own LLM app (ChatGPT/Claude/Perplexity/Google AI Mode/Grok) with a pre-filled prompt |

### RESEARCH, OSINT & COMPETITIVE INTELLIGENCE

| Skill | Path | Use When |
|-------|------|----------|
| **Deep Research** | `skills/deep-research/AGENT_SKILL_DEEP_RESEARCH.md` | Multi-source deep-research harness — fan-out web searches, fetch and adversarially verify sources, synthesize a cited report on any topic |
| **Intelligence Dossier** | `skills/intelligence-dossier/SKILL.md` | Building, populating, and maintaining a structured intelligence dossier on a private company — folder architecture, sections, ongoing maintenance |
| **Industry Context Research** | `skills/industry-context-research/SKILL.md` | Building the industry-context layer of a dossier across six dimensions: Economics, History, Legal/Regulatory, Political, Sociological/Workforce, Technology |
| **Verification Audit** | `skills/verification-audit/SKILL.md` | Cross-verifying every major finding in an intelligence dossier against independent sources — downgrade confidence, retract unverifiable claims |
| **Client Discovery OSINT** | `skills/client-discovery-osint/SKILL.md` | Identifying the clients/customers of a private company using only open-source intelligence (bootstrapped VARs/consultancies rarely publish client lists) |
| **Competitor Identification** | `skills/competitor-identification/SKILL.md` | Finding and validating the nearest competitors for a company via manufacturer partner networks, free APIs, and dataset screening — ranked Top 10 |
| **Supplier Verification** | `skills/supplier-verification/SKILL.md` | Turning an unverified partner-logo wall into a confirmed, evidence-ranked supplier relationship map with products, manufacturing origin, tariff exposure |
| **OEM Partner Verification** | `skills/oem-partner-verification/SKILL.md` | Verifying whether a company's claimed OEM/manufacturer partnerships are reciprocally confirmed on the manufacturer's own site |
| **Commercial Property Research** | `skills/commercial-property-research/SKILL.md` | Researching a company's physical facilities, warehouse operations, and real estate footprint from public sources |
| **Domain Email Enumeration** | `skills/domain-email-enumeration/SKILL.md` | Discovering all email addresses, mail infrastructure, and contact patterns associated with a domain via DNS + OSINT tools |
| **Google Dorking OSINT** | `skills/google-dorking-osint/SKILL.md` | Finding publicly indexed documents, exposed files, and hidden intelligence about a target company via Google advanced search operators |
| **Ad Transparency Audit** | `skills/ad-transparency-audit/SKILL.md` | Determining a company's actual paid ad activity by cross-referencing installed tracking pixels against public ad transparency platforms |
| **Open-Source Traffic Analysis** | `skills/open-source-traffic-analysis/SKILL.md` | Estimating any website's traffic, keyword profile, and visibility with free/open-source tools — no SimilarWeb Pro/Ahrefs/SEMrush needed |
| **Website Tech Stack Analysis** | `skills/website-techstack-analysis/SKILL.md` | Uncovering the full tech stack behind a website — frameworks, CMS, CDN, analytics, hosting, server software, security headers |
| **LinkedIn Activity Intelligence** | `skills/linkedin-activity-intelligence/SKILL.md` | Extracting structured intelligence from a LinkedIn activity feed when direct API/scraping is blocked — MHTML parsing, authenticated video download, batch image analysis |
| **Era-Validated LinkedIn Analysis** | `skills/era-validated-linkedin-analysis/SKILL.md` | QA methodology preventing misattribution when a LinkedIn feed spans multiple employers — era separation to avoid contaminating a dossier |
| **Video Intelligence** | `skills/video-intelligence/SKILL.md` | Extracting intelligence from video content (YouTube/Vimeo/company sites) — facility scale, team composition, product demos, signage, event attendance |
| **Visual Intelligence** | `skills/visual-intelligence/SKILL.md` | Extracting business intelligence from video frames (facilities/products/team/branding/equipment) via frame extraction + multimodal vision |
| **Contact Sheet Image Analysis** | `skills/contact-sheet-image-analysis/SKILL.md` | Gridding large batches of images into contact sheets for efficient AI vision review instead of reading images one-by-one |
| **Web Crawl Intelligence Extraction** | `skills/web-crawl-intelligence-extraction/SKILL.md` | Processing saved "webcomplete" captures, Wayback Machine archives, video transcripts, and API dumps to extract intelligence never systematically analyzed |
| **Business Model Canvas Builder** | `skills/business-model-canvas/SKILL.md` | Building a rigorous 9-block Osterwalder Business Model Canvas for a company from structured intelligence data |

### AI AGENT AUDITING & FORENSICS

| Skill | Path | Use When |
|-------|------|----------|
| **Production Agent Audit** | `skills/production-agent-audit/SKILL.md` | Auditing how deployed AI agents perform across channels from real logs — objective good/bad report |
| **EC2 Instance Connect Data Pull** | `skills/ec2-instance-connect-data-pull/SKILL.md` | Read-only prod shell with no stored SSH key; extract Mongo/container logs via tar+base64 over SSH |
| **Agent Quality Grading** | `skills/agent-quality-grading/SKILL.md` | Grading agent conversations (task/speed/tools/message), generated assets, and prompts/configs |
| **Finding → Fix Remediation** | `skills/finding-forensic-remediation/SKILL.md` | Turning audit findings into a git-grounded, prioritized fix backlog (root cause, when-introduced, status, exact fix) |
| **Temporal Finding Validation** | `skills/temporal-finding-validation/SKILL.md` | Cross-checking findings vs the commit timeline (UTC-normalized) to confirm still-live vs already-fixed |
| **Unmerged-Work Census** | `skills/unmerged-work-census/SKILL.md` | Finding ALL work that never reached the default branch — hidden code on stale-description PRs, never-PR'd branches, git cherry vs history-rewrite ghosts, local-clone drift, stashes/dangling commits; read-only, spot-verified |

### WRITING & PROSE QUALITY

| Skill | Path | Use When |
|-------|------|----------|
| **Beautiful Prose** | `skills/white-paper-writing/beautiful-prose/SKILL.md` | Eliminating AI tics, enforcing muscular concrete prose |
| **Humanizer** | `skills/white-paper-writing/humanizer/SKILL.md` | Detecting and removing 25 categories of AI writing patterns |
| **Write Concisely** | `skills/white-paper-writing/neolab-write-concisely/SKILL.md` | Strunk's Elements of Style as an agent skill |

### DOCUMENT CO-AUTHORING & RESEARCH

| Skill | Path | Use When |
|-------|------|----------|
| **Doc Co-Authoring** | `skills/white-paper-writing/anthropic-doc-coauthoring/SKILL.md` | Anthropic's 3-stage doc co-authoring workflow |
| **Content Research Writer** | `skills/white-paper-writing/composio-content-research-writer/SKILL.md` | Full content writing partner with outlining and research |
| **Notebook** | `skills/white-paper-writing/blastum-notebook/SKILL.md` | Structured knowledge base for web research |
| **Skill Authoring** | `skills/white-paper-writing/blastum-skill-authoring/SKILL.md` | Anthropic-style skill authoring methodology |

### RESEARCH & DUE DILIGENCE

| Skill | Path | Use When |
|-------|------|----------|
| **Company Legal & Reputation Research** | `skills/company-legal-reputation-research/SKILL.md` | Vetting a company for court cases, liens, sanctions, debarment, BBB complaints, and reputation signals using free public sources only |
| **GitHub Search** | `skills/github-search/SKILL.md` | Finding repos/frameworks/code on GitHub with the official search syntax — repo qualifiers, code-search boolean/regex, REST API + rate limits, find-a-framework playbook |
| **Marketing-Site Authenticity Audit** | skills/marketing-site-authenticity-audit/SKILL.md | Audit a company's OWN marketing site for fabricated case studies/testimonials, stock-as-'real job', reused photos, and over-claims (fetch-and-compare the images), then remediate to honest generic examples |

### SOFTWARE ARCHITECTURE & SYSTEM DESIGN

| Skill | Path | Use When |
|-------|------|----------|
| **System Design & Architecture** | `skills/system-design-architecture/SKILL.md` | Designing/reviewing backend systems end-to-end. Lean SKILL.md (design method + heuristics) over an 11-file reference library: security/secure-by-design, the scaling ladder (low→high volume), capacity limits/thresholds, cost modeling, architecture archetypes (incl. multi-tenant SaaS + multi-agent/LLM), product layers, cloud provider service maps (AWS/GCP/Azure/Cloudflare), real-system case studies, open standards, decision records (ADRs + option-selection) — plus design/production-readiness/security checklists and a worked example. Navigate via `references/INDEX.md`. |

### MARKETING & COPYWRITING

| Skill | Path | Use When |
|-------|------|----------|
| **Marketing Copywriting** | `skills/white-paper-writing/marketing-copywriting/SKILL.md` | Conversion copy: headlines, CTAs, page structure |
| **Content Strategy** | `skills/white-paper-writing/marketing-content-strategy/SKILL.md` | Topic clusters, keyword research, content planning |
| **Copy Editing** | `skills/white-paper-writing/marketing-copy-editing/SKILL.md` | Line-by-line copy editing with plain English alternatives |
| **Launch Strategy** | `skills/white-paper-writing/marketing-launch-strategy/SKILL.md` | Product launch and go-to-market strategy |
| **Pricing Strategy** | `skills/white-paper-writing/marketing-pricing-strategy/SKILL.md` | SaaS pricing, packaging, monetization |
| **Marketing Psychology** | `skills/white-paper-writing/marketing-psychology/SKILL.md` | 30+ psychological principles for marketing |
| **AI Marketing Skills** | `skills/white-paper-writing/ai-marketing-skills/` | 17 marketing frameworks (content ideas, LinkedIn, case studies, homepage audit) |

### PLANNING & BRAINSTORMING

| Skill | Path | Use When |
|-------|------|----------|
| **Writing Skills** | `skills/white-paper-writing/obra-writing-skills/SKILL.md` | TDD-based skill writing methodology |
| **Writing Plans** | `skills/white-paper-writing/obra-writing-plans/SKILL.md` | Strategic documentation creation with bite-sized tasks |
| **Brainstorming** | `skills/white-paper-writing/obra-brainstorming/SKILL.md` | Structured brainstorming with visual companion |

### DOCUMENT EXPORT

| Skill | Path | Use When |
|-------|------|----------|
| **DOCX Export** | `skills/white-paper-writing/blastum-docx/SKILL.md` | Generate .docx files from markdown |
| **Markdown to PDF** | `skills/white-paper-writing/blastum-markdown-to-pdf/SKILL.md` | Convert markdown to PDF |

### FRONTEND ENGINEERING & AGENT ORCHESTRATION

| Skill | Path | Use When |
|-------|------|----------|
| **Parallel Agent Refactor** | `skills/parallel-agent-refactor/SKILL.md` | Running a large multi-file refactor/migration/codemod across routes — fan out disjoint-ownership write-agents behind typecheck+build barriers |
| **Empirical Responsive Audit** | `skills/empirical-responsive-audit/SKILL.md` | Auditing a web UI for mobile/layout defects (overflow, sub-44px targets, sub-16px inputs) by rendering it; shipping a Playwright pre-merge gate |
| **Dark Mode Token Migration** | `skills/dark-mode-token-migration/SKILL.md` | Adding dark mode to an app that uses raw color utilities — semantic token layer + no-flash toggle, light stays pixel-identical |
| **shadcn + Tailwind v4 Primitives** | `skills/shadcn-tailwind-v4-primitives/SKILL.md` | Scaffolding a token-based shadcn/ui + Radix primitive set on Tailwind v4 |
| **UX Decision Rubrics** | `skills/ux-decision-rubrics/SKILL.md` | Choosing the right form control, or scoring which user flows need redesign |

### GTM, PROSPECTING & AGENT ORCHESTRATION

| Skill | Path | Use When |
|-------|------|----------|
| **ICP Prospect List Builder** | `skills/icp-prospect-list-builder/SKILL.md` | Building a prioritized, source-cited B2B prospect dataset from public data — define an ICP in searchable terms, discover matching companies (source-code/technographic search, competitor customer bases, software + AI directories, Product Hunt API, accelerator portfolios), then categorize, ICP-score, dedupe, and pull size-routed contacts |
| **Parallel Agent Fan-Out** | `skills/parallel-agent-fanout/SKILL.md` | Orchestrating dozens of concurrent subagents into one verified dataset — 3-wave discovery→pull→synthesis pipeline, shared instruction templates, no-delegation rule, file-on-disk completion checks, batching, incremental commits, recombine + row-integrity validation |

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
├── PLATFORM OPS?
│   ├── Review AI conversations → Conversation Review
│   ├── Verify a deployment → Deployment Testing
│   ├── Email pipeline → Email Mastery
│   ├── Find UI bugs → UI/UX Audit
│   ├── Manage domains / DNS → GoDaddy API
│   ├── Add error tracking → Sentry Instrumentation
│   ├── Audit DB indexes / relationships → MongoDB Schema Audit
│   ├── Verify admin dashboard features → Admin Dashboard Verification
│   └── Write fast tests → Bun Testing
├── EVERJUST.APP TENANT (Odoo 19 multi-tenant SaaS)?
│   ├── Always read first → EverJust Platform + EverJust Agent MCP
│   ├── Send/read mail as a mailbox, diagnose a blocked send → EverJust Mail Ops
│   ├── Bulk/campaign email blast → EverJust Mass Mailing
│   ├── Rebrand a tenant to a new domain → EverJust Tenant Domain Migration
│   ├── Leads/pipeline → EverJust CRM & Sales
│   ├── Booking/scheduling → EverJust Appointments / EverJust Calendar & Contacts
│   ├── Customer self-service login → EverJust Client Portal
│   ├── Files/folders → EverJust Documents
│   ├── Conference/attendee management → EverJust Events
│   ├── Payroll/attendance → EverJust Payroll & HR
│   ├── Tasks/kanban → EverJust Projects
│   ├── Accounting sync → EverJust QuickBooks
│   ├── E-signature → EverJust Sign
│   ├── SMS → EverJust SMS
│   ├── Calls/voicemail → EverJust Telephony
│   └── Public website → EverJust Website (+ Blog/Community/Events/Forms/Forum/i18n/Newsletter/SEO/Snippets/Themes/Customization)
├── RESEARCH / DUE DILIGENCE?
│   └── Vet a company legally & reputationally → Company Legal & Reputation Research
└── WRITING?
    ├── White paper / technical doc → Doc Co-Authoring → Beautiful Prose → Humanizer
    ├── Marketing copy → Marketing Copywriting + Marketing Psychology
    ├── Content strategy → Content Strategy + Content Research Writer
    ├── Remove AI writing patterns → Humanizer + Beautiful Prose
    ├── Tighten prose → Write Concisely (Elements of Style)
    ├── Product launch → Launch Strategy
    ├── Pricing page → Pricing Strategy
    ├── Brainstorm ideas → Brainstorming + Content Research Writer
    └── Export final doc → DOCX Export or Markdown to PDF
```

## Combining Skills

- **Remotion + D3.js** = Animated data visualization videos
- **Remotion + Remotion Templates** = Professional video with pre-built effects
- **Remotion + Remotion Captions** = Videos with animated subtitles
- **GSAP + D3.js** = Scroll-animated data dashboards
- **Slidev + D3.js** = Data-rich animated presentations
- **Motion Canvas + Manim** = Technical explainer videos
- **Deployment Testing + UI/UX Audit** = Full release verification
- **Sentry Instrumentation + Bun Testing** = Error tracking with verified coverage
- **MongoDB Schema Audit + Admin Dashboard Verification** = DB + UI integrity validation
- **Admin Dashboard Verification + Sentry + Bun Testing** = Complete admin feature verification pipeline
- **Company Legal & Reputation Research + Doc Co-Authoring + Beautiful Prose** = Full due diligence memo pipeline
- **Doc Co-Authoring + Beautiful Prose + Humanizer** = White paper writing pipeline
- **Content Strategy + Marketing Copywriting** = Full content marketing workflow
- **Humanizer + Write Concisely** = De-AI and tighten any text
- **Notebook + Content Research Writer** = Research-backed long-form content
- **Marketing Psychology + Marketing Copywriting** = Persuasive landing page copy
- **ICP Prospect List Builder + Parallel Agent Fan-Out** = A full GTM prospect dataset built at scale across many concurrent agents
- **ICP Prospect List Builder + Company Legal & Reputation Research + Domain Email Enumeration** = A vetted, contactable Tier-1 outreach shortlist

---

*This manifest is the entry point for AI agent skill discovery.*
*Read the SKILL.md file in each skill directory for detailed instructions.*
