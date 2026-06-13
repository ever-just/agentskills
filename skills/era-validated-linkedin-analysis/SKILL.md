# Era-Validated LinkedIn Analysis

## Overview

A QA methodology for preventing misattribution when analyzing a LinkedIn feed that spans multiple employers. Without era separation, you will contaminate your dossier with a prior employer's products, events, and relationships. Validated on BROGAV Solutions: caught 7 pre-era misattributions and 1 AI date-misread (2021→2025).

## When to Use

- Analyzing a LinkedIn activity feed for competitive intelligence where the person held 2+ roles
- Integrating LinkedIn findings into a structured dossier where accuracy matters
- Any time LinkedIn posts span more than 3 years

## The Problem

A founder's LinkedIn feed is a multi-year time capsule. Posts from 2021 show Emcor products; posts from 2024 show BROGAV products. Without separation, you attribute "Protector Cabinets" (Emcor brand) to BROGAV, list Belden as a BROGAV supplier from a 2021 event, and credit factory photos from a prior employer.

**Real example caught:** Agent reported Belden events as "Dec 2025" when the invitation read "December 9, 2021." AI vision misread the year because "2025" was the expected answer.

## Method

### Step 1: Map Career Timeline
```
Posts 1-140:   BROGAV Solutions (2022-present)  ← CURRENT
Posts 141-172: Emcor Enclosures (2020-2022)     ← PRIOR
Posts 173-181: Clearfield, Inc. (2019-2020)      ← PRIOR
```

### Step 2: Classify Every Finding by Era

| Signal | How to Determine Era |
|---|---|
| Post number | Primary signal — check era map |
| Company branding in images | Logo/URL/phone confirms era |
| Date text on event materials | Read the YEAR carefully at full resolution |
| Product brand names | Research brand ownership |

### Step 3: Flag Pre-Era Content
Label with era. Store as career context, NOT integrated into main dossier.

### Step 4: Contamination Check
```bash
grep -i "protector\|defender\|belden\|clearfield" supplier_line_card.csv SUPPLIER_DEEP_DIVE.md PRODUCT_SERVICE_DEEP_DIVE.md
# Should return 0 results
```

### Step 5: Audit Report
```
✅ OK:    Vertiv confirmed — Post 135 — Era: BROGAV
⚠️ FLAG: Belden Mobile Center — Post 148 — Era: EMCOR (Dec 2021)
❓ CHECK: EnerSys battery spec — mhtml_137 — Era: UNKNOWN
```

## Common Traps

| Trap | Example | Fix |
|---|---|---|
| Inclusive "we" | "We build in Jacksonville" = supplier's factory | Verify on manufacturer site |
| Date misreading | AI reads "2021" as "2025" | Zoom to full-size |
| Unbranded spec sheets | Generic datasheet, no company logo | Don't attribute |
| Golf sponsor signs | Emcor sign from 2021 event | Check logo on sign |
| Factory photos | Emcor production line from employment era | Label as career context |

## Validation Checklist

- [ ] Post number checked against era map
- [ ] Image branding matches current era
- [ ] Year verified at full resolution (not thumbnail)
- [ ] Product brand ownership confirmed
- [ ] Contamination grep run on core files
- [ ] Finding marked with era in analysis

## Results

BROGAV project: 24 correct, 7 flagged pre-era, 3 uncertain resolved, zero contamination.
