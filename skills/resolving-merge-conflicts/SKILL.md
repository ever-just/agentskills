---
name: resolving-merge-conflicts
description: Resolve an in-progress git merge or rebase conflict by understanding the intent behind each side (commit messages, PRs, issues) before touching a hunk, preserving both intents where possible, then running the project's checks and finishing the operation. Use when you hit a git merge/rebase conflict, or the user asks to resolve one.
---

# Resolving Merge Conflicts

1. **See the current state** of the merge/rebase. Check git history, and the conflicting files.

2. **Find the primary sources** for each conflict. Understand deeply why each change was made, and what the original intent was. Read the commit messages, check the PRs, check original issues/tickets.

3. **Resolve each hunk.** Preserve both intents where possible. Where incompatible, pick the one matching the merge's stated goal and note the trade-off. Do **not** invent new behavior. Always resolve; never `--abort`.

4. Discover the project's **automated checks** and run them — typically typecheck, then tests, then format/lint. Fix anything the merge broke.

5. **Finish the merge/rebase.** Stage everything and commit. If rebasing, continue the rebase process until all commits are rebased.

## Combining with other skills

- `production-revert-discipline` — if a conflict surfaces because two branches both touched a reverted feature, check whether the revert is still the right call before resolving in its favor.
- `unmerged-work-census` — a conflict is sometimes the first sign that a stale branch's content already landed elsewhere under different history; verify before assuming the conflicting branch is still the source of truth.
- `tdd` / `diagnosing-bugs` — step 4's test run is the gate; a test that breaks post-merge is a real regression to diagnose, not noise to silence.

## Attribution

Adapted from [mattpocock/skills](https://github.com/mattpocock/skills) (`skills/engineering/resolving-merge-conflicts`), MIT licensed, © Matt Pocock.
