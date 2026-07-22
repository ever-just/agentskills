# White Paper Writing — Agent Skills Collection

Curated collection of agent skills imported from GitHub repos to support writing high-quality white papers, marketing content, and persuasive technical documents.

## Skills Index

### Writing & Prose Quality

| Skill | Source | Purpose |
|-------|--------|---------|
| **[beautiful-prose](./beautiful-prose/)** | [SHADOWPR0/beautiful_prose](https://github.com/SHADOWPR0/beautiful_prose) | Hard-edged writing style contract. Eliminates AI tics, filler, therapy tone. Enforces muscular, concrete, verb-forward prose. |
| **[humanizer](./humanizer/)** | [blader/humanizer](https://github.com/blader/humanizer) | Detects and removes 25 categories of AI-generated writing patterns based on Wikipedia's "Signs of AI writing" guide. Includes before/after examples for every pattern. |
| **[neolab-write-concisely](./neolab-write-concisely/)** | [NeoLabHQ/context-engineering-kit](https://github.com/NeoLabHQ/context-engineering-kit) | Full text of Strunk's *The Elements of Style* (1918) as an agent skill. Active voice, omit needless words, concrete language. |

### Document Co-Authoring & Research

| Skill | Source | Purpose |
|-------|--------|---------|
| **[anthropic-doc-coauthoring](./anthropic-doc-coauthoring/)** | [anthropics/skills](https://github.com/anthropics/skills) | Anthropic's official 3-stage doc co-authoring workflow: Context Gathering → Refinement & Structure → Reader Testing with sub-agents. |
| **[composio-content-research-writer](./composio-content-research-writer/)** | [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) | Full content writing partner: outlining, research with citations, hook improvement, section-by-section feedback, voice preservation. Includes workflows for blog posts, newsletters, tutorials, and thought leadership. |
| **[blastum-notebook](./blastum-notebook/)** | [blastum/AgentSkills](https://github.com/blastum/AgentSkills) | Structured knowledge base for web research. Capture sources, then query for facts or cross-cutting synthesis. |
| **[blastum-skill-authoring](./blastum-skill-authoring/)** | [blastum/AgentSkills](https://github.com/blastum/AgentSkills) | Anthropic-style skill authoring: token efficiency, progressive disclosure, refactoring skills. |

### Marketing & Copywriting

| Skill | Source | Purpose |
|-------|--------|---------|
| **[marketing-copywriting](./marketing-copywriting/)** | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | Expert conversion copywriting: clarity over cleverness, benefits over features, specificity over vagueness. Includes headline formulas, CTA guidelines, page structure frameworks. |
| **[marketing-content-strategy](./marketing-content-strategy/)** | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | Content strategy planning: searchable vs shareable content, topic clusters, keyword research by buyer stage, content ideation from calls/surveys/forums, prioritization scoring. |
| **[marketing-copy-editing](./marketing-copy-editing/)** | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | Line-by-line copy editing with plain English alternatives reference. |
| **[marketing-launch-strategy](./marketing-launch-strategy/)** | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | Product launch and go-to-market strategy planning. |
| **[marketing-pricing-strategy](./marketing-pricing-strategy/)** | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | SaaS pricing, packaging, and monetization strategy. |
| **[marketing-psychology](./marketing-psychology/)** | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | 30+ psychological principles and mental models for marketing: first principles, jobs to be done, social proof, scarcity, loss aversion, anchoring, framing, and more. |
| **[ai-marketing-skills](./ai-marketing-skills/)** | [BrianRWagner/ai-marketing-skills](https://github.com/BrianRWagner/ai-marketing-skills) | 23 marketing frameworks including content idea generator, LinkedIn authority builder, newsletter creation, testimonial collector, case study builder, homepage audit, de-AI-ify, and YouTube summarizer. |

### Planning & Brainstorming

| Skill | Source | Purpose |
|-------|--------|---------|
| **[obra-writing-skills](./obra-writing-skills/)** | [obra/superpowers](https://github.com/obra/superpowers) | TDD-based skill writing methodology. Includes persuasion principles reference and Anthropic best practices. |
| **[obra-writing-plans](./obra-writing-plans/)** | [obra/superpowers](https://github.com/obra/superpowers) | Strategic documentation creation with bite-sized tasks and plan review. |
| **[obra-brainstorming](./obra-brainstorming/)** | [obra/superpowers](https://github.com/obra/superpowers) | Structured brainstorming with visual companion and spec document review. |

### Document Export

| Skill | Source | Purpose |
|-------|--------|---------|
| **[blastum-docx](./blastum-docx/)** | [blastum/AgentSkills](https://github.com/blastum/AgentSkills) | Generate .docx files from markdown. |
| **[blastum-markdown-to-pdf](./blastum-markdown-to-pdf/)** | [blastum/AgentSkills](https://github.com/blastum/AgentSkills) | Convert markdown to PDF. |

---

## How to Use These for White Paper Writing

### Recommended Workflow

1. **Research & Planning** — Use `blastum-notebook` to build a structured knowledge base of sources, then `marketing-content-strategy` to plan the content pillars and target audience.

2. **Outlining & Structure** — Use `anthropic-doc-coauthoring` for the 3-stage co-authoring workflow (Context Gathering → Refinement → Reader Testing).

3. **Writing** — Use `composio-content-research-writer` for the thought leadership workflow (brainstorm angle → research → develop thesis → write with strong POV → add evidence → craft conclusion).

4. **Persuasion** — Apply `marketing-psychology` mental models (social proof, loss aversion, jobs to be done) and `marketing-copywriting` principles (specificity, benefits over features).

5. **De-AI & Polish** — Run `humanizer` to remove AI writing patterns, then `beautiful-prose` for muscular, concrete prose. Apply `neolab-write-concisely` (Elements of Style) for final tightening.

6. **Copy Edit** — Use `marketing-copy-editing` for line-by-line review with plain English alternatives.

7. **Export** — Use `blastum-markdown-to-pdf` or `blastum-docx` to generate the final deliverable.

---

## Source Repos

| Repo | Stars | Description |
|------|-------|-------------|
| [anthropics/skills](https://github.com/anthropics/skills) | Official | Anthropic's official agent skills for Claude |
| [blastum/AgentSkills](https://github.com/blastum/AgentSkills) | Community | Cursor agent skills collection (CC0 public domain) |
| [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) | Community | Curated Claude skills by Composio |
| [SHADOWPR0/beautiful_prose](https://github.com/SHADOWPR0/beautiful_prose) | Community | Anti-slop writing style contract |
| [blader/humanizer](https://github.com/blader/humanizer) | Community | Wikipedia-based AI writing pattern removal |
| [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | Official | Full SaaS marketing stack by Corey Haines |
| [BrianRWagner/ai-marketing-skills](https://github.com/BrianRWagner/ai-marketing-skills) | Community | 23 marketing frameworks |
| [obra/superpowers](https://github.com/obra/superpowers) | Community | Agentic skills framework & dev methodology |
| [NeoLabHQ/context-engineering-kit](https://github.com/NeoLabHQ/context-engineering-kit) | Community | Elements of Style as agent skill |
