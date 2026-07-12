---
name: marketing-site-authenticity-audit
description: Audit a company's OWN public marketing website (case studies, testimonials, gallery, hero copy) for fabricated or misrepresented claims, then remediate to honest equivalents. Use when reviewing a marketing site for authenticity/honesty before launch, or when case studies and reviews look too good or mismatched. Detects: a stock or AI-generated image captioned as 'this exact [city] job'; an image whose content does not match its caption (verified by FETCHING the image attachment and comparing it to the claimed caption); ONE photo reused as several different 'exact' jobs (cross-image dedup); invented pull-quote 'reviews' with city-only attribution (e.g. a 'Google review' with no real author); and over-claims such as 'no stock photos' contradicted by the assets themselves. Remediates by reframing fabricated case studies into honest GENERIC examples, keeping ratings/reviews ONLY where real (real author + verbatim body), restricting the gallery to real photos only, and allowing AI-generated illustrations but NEVER claimed as a specific job. Reuses the confidence-tier + strike-through retraction spine from [[verification-audit]] but its novel core is image-fetch-and-compare, reused-photo dedup, fabricated-testimonial detection, and the honest-generic remediation doctrine. NOT for verifying OSINT claims about THIRD parties (use [[verification-audit]]) and NOT for auditing an AI agent's chat/email output (use [[conversation-review]]). Cross-references [[verification-audit]], [[conversation-review]], [[local-business-aeo-schema]].
---

# Marketing-Site Authenticity Audit — Agent Skill

Audit a company's **own marketing website** — its case studies, testimonials, gallery, and hero claims — for **fabrication and misrepresentation**, and remediate to honest equivalents. The target is the company's self-representation, not a third party. Where [[verification-audit]] checks whether an OSINT claim about someone else is true (via external registries), and [[conversation-review]] checks an AI agent's chat output against logs, this skill checks whether a marketing site's **images and testimonials actually match what they claim**.

Borrow [[verification-audit]]'s confidence-tier ladder and strike-through retraction audit trail as the spine. The novel, uncovered core here is **fetch-and-compare on the site's own media assets**, **reused-photo dedup**, **fabricated-testimonial detection**, and the **honest-generic remediation doctrine**.

## When to use this skill

- Pre-launch honesty review of a marketing site (especially service-business sites with 'our work' / case-study sections).
- Case studies or testimonials look too polished, too specific, or mismatched.
- The site makes an authenticity claim ('real photos only', 'no stock photos', 'verified reviews') you should check against the assets.
- You are about to schema-ify reviews ([[local-business-aeo-schema]]) and must confirm they're real first.

**Do NOT use this skill for**:
- **OSINT claims about THIRD parties** (registrations, partnerships, financials) → [[verification-audit]].
- **An AI agent's conversational output** vs activity logs → [[conversation-review]].

## The fabrication pattern catalog

| Pattern | What it looks like | How to catch it |
|---|---|---|
| Stock/generated-as-'exact job' | A stock or AI image captioned 'this exact [city] job' | Fetch the image; is it a generic/stock/AI asset, not a jobsite photo? |
| Image↔caption mismatch | Caption describes X; image shows Y | Fetch the image and compare content to the caption |
| One photo, many 'exact' jobs | The SAME photo used for multiple different captioned jobs | Cross-image dedup (hash/visual compare) across all case studies |
| Invented testimonial | A 'Google review' pull-quote with city-only attribution, no real author | Cross-check the quote + attribution; is there a real author / source? |
| Over-claim | 'No stock photos' / '100% real' contradicted by the assets | Test the claim against the fetched assets |

## Verification mechanism — fetch and compare (the core)

Unlike external-lookup verification, here you **fetch the subject's OWN media assets and compare each to its claimed caption**:

```python
# 1) enumerate case-study images + their captions from the page HTML
# 2) fetch each image attachment
# 3) compare content to caption; 4) hash to find reuse
import hashlib, requests
seen = {}
for img_url, caption in items:
    data = requests.get(img_url, timeout=20).content
    h = hashlib.sha256(data).hexdigest()
    if h in seen:
        print('REUSED across jobs:', seen[h], 'and', caption)   # one photo, many 'exact' jobs
    seen[h] = caption
    # then: does the image content match `caption`? (view the image, compare to the claim)
```
For each image, view it and ask: does it match the caption, is it stock/AI, and is it claimed as a SPECIFIC job? For each testimonial: is there a real author and source, or is it a city-only-attributed pull-quote?

## Confidence + retraction spine (from verification-audit)

Tag each claim: **Verified** (image matches caption, real author) → keep; **Suspect** (mismatch / stock / city-only) → flag; **Fabricated** (reused-as-different-job, invented quote, over-claim contradicted by assets) → retract with a strike-through audit-trail line noting the original claim and why it fails. Preserve the trail so the remediation is reviewable.

## Remediation doctrine (honest-generic)

- **Case studies** → reframe fabricated 'this exact [city] job' into honest GENERIC examples ('example of a typical X project'); never claim a stock/AI image is a specific job.
- **Ratings/reviews** → keep ONLY where real (real author + verbatim body); delete invented pull-quotes.
- **Gallery** → real photos only.
- **Generated illustrations** → allowed, but NEVER captioned as a specific real job; label them as illustrative.
- **Over-claims** → drop the claim ('no stock photos') or make it true.

## Recipes

1. **Enumerate** every case study, testimonial, gallery image, and authenticity claim, with its caption/attribution.
2. **Fetch + compare** each image to its caption; hash all images to surface reuse (mechanism above).
3. **Verify testimonials** — real author + source, or city-only invented.
4. **Tier + retract** using the verification-audit spine.
5. **Remediate** per the honest-generic doctrine; produce a diff of claim → honest replacement.
6. **Re-check** the authenticity claims hold after remediation (e.g. if you kept AI illustrations, is 'no stock photos' now removed?).

## Pitfalls

1. **Auditing text only.** The lie is usually in the IMAGE vs its caption — you must fetch and view the asset, not just read the copy.
2. **Missing reused photos.** Hash/compare ALL images; the same photo captioned as two different 'exact' jobs is the tell.
3. **Deleting real reviews to be safe.** Keep genuinely real reviews (real author + verbatim body) — over-retraction is its own dishonesty. Only retract the fabricated ones.
4. **Banning AI illustrations outright.** They're fine as illustrations — the violation is CLAIMING one is a specific real job. Relabel, don't necessarily remove.
5. **Leaving a now-false authenticity claim.** If you keep AI illustrations, a 'no stock photos / all real' claim must go.
6. **Confusing this with third-party verification.** Don't reach for external registries — the source of truth is the site's own assets vs its own captions.

## Combining with other skills
- [[verification-audit]] — the confidence-tier + strike-through retraction spine this reuses.
- [[conversation-review]] — the sibling for AI-agent conversational honesty.
- [[local-business-aeo-schema]] — only schema-ify reviews this audit confirmed are real.
