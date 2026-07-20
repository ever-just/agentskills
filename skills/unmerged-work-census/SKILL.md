---
name: unmerged-work-census
description: Find ALL work that never reached the default branch or production — hidden
  code on "docs-only" PRs, never-PR'd remote branches, stale local clones in long-lived
  agent containers, stashes, dangling commits, and history-rewrite ghosts. Use when asked
  "what haven't we shipped", "find everything not pushed/merged", "did any work get
  lost", or before deleting old branches. Covers verifying PR descriptions against actual
  branch diffs (they go stale), git branch --no-merged + git cherry to separate genuinely
  unique patches from rewritten-history duplicates, ahead/behind local-master drift,
  spot-verifying that "re-landed" content really exists on the target branch, and the
  multi-agent reality that every remote session container holds its own clone whose
  unpushed work is invisible to every other session.
---

# Unmerged-Work Census

## Overview

On a repo worked by many agents and sessions, real work goes missing in predictable
places: branches nobody opened a PR for, PRs whose descriptions stopped matching their
branches, long-lived containers holding stale clones, and history rewrites that make
old branches look "ahead" when their content already landed. A census sweeps every
hiding place and — the hard part — proves for each find whether it is genuinely
unlanded or just a ghost of rewritten history.

## The sweep (run all of it — each check finds a different class)

### 1. Open PRs: verify the description against the branch

PR descriptions rot. A PR opened as "docs-only audit" can accumulate thousands of lines
of implementation as the session continued pushing to its branch.

```bash
git fetch origin --prune
git diff --stat origin/master...origin/<pr-branch>     # what the PR REALLY contains
git log origin/master..origin/<pr-branch> --oneline    # commits after the description was written
```

Treat the diff, not the description, as the PR's content. This single check is how
"docs PRs" hiding full feature builds get found.

### 2. Remote branches with no PR at all

```bash
git branch -r --no-merged origin/master                # candidates
git log origin/master..origin/<branch> --oneline       # what's on each
```

Cross-reference against the PR list; branches with commits but no PR are the classic
forgotten-work bucket.

### 3. Separate real uniqueness from history-rewrite ghosts

After a force-push/rebase/squash era, old branches show as "ahead" even though their
content landed under new SHAs. `git cherry` compares by **patch-id**, not SHA:

```bash
git cherry origin/master origin/<branch> | grep -c '^+'   # patches NOT upstream by content
```

But patch-id comparison also fails across rewrites that changed context lines, so a
high count is a *lead*, not a verdict. **Spot-verify**: pick the branch's most
important changes and check the target branch for the actual content —

```bash
git show origin/master:<path> | grep -n "<distinctive line from the branch's change>"
git ls-tree origin/master <dir>                            # does the module/file exist at all?
```

Only after spot-verification say "content re-landed, branch is a ghost" or "genuinely
unmerged". Also list files that exist ONLY on the old branch:

```bash
git diff origin/master <branch> --name-status -- <dirs> | grep '^A'
```

Files added going master→branch exist on the branch but not master — each one is either
superseded-by-rename or lost work. Adjudicate individually.

### 4. Local state of the clone you're standing in

Long-lived agent containers accumulate drift invisibly:

```bash
git status --porcelain          # uncommitted + untracked
git stash list                  # parked work
git branch -vv                  # local branches: ahead/behind their upstreams
git worktree list               # secondary worktrees
git fsck --no-reflogs --lost-found | head   # dangling commits (often discarded temps)
```

A local `master` that is "ahead N, behind M" of origin is a stale snapshot from before
a history rewrite — census it with steps 3's tools, don't assume either way.

### 5. Odd branches

Automation branches (`*/checkpoints/*`, backup refs, bot branches) may hold session
transcripts or snapshots rather than code — `git ls-tree -r --name-only` them before
counting them as work.

### 6. Beyond this clone (multi-agent blind spot)

Every remote/cloud agent session gets its **own** clone; work a session never pushed
exists only inside its container and is invisible to every other session and to this
census. So report the census as "everything visible from the remote", and name the
unreachable places: other sessions' containers, teammates' laptops, and any deploy
target whose working copy can drift from git.

## Output form

A table per find: **where** (branch/stash/local), **what** (one-line content summary
from the actual diff), **unique?** (verified how), **age/last commit**, **recommended
disposition** (rescue via rebase+PR / confirm-superseded then delete / needs owner
decision). Never recommend deleting anything whose uniqueness you did not spot-verify.

## Pitfalls

- Trusting `git cherry` counts raw — rewrites inflate them; spot-verify content.
- Trusting PR descriptions — diff the branch (step 1).
- Declaring "nothing lost" from SHA comparisons alone.
- `rm -rf`-ing or force-deleting anything during a *census* — a census is read-only;
  disposition is a separate, owner-approved step.
- Forgetting `--prune` on fetch: deleted-upstream branches linger locally and double-count.

## Combining with other skills

- `finding-forensic-remediation` — turn each rescued finding into an actionable fix item.
- `temporal-finding-validation` — timeline discipline when dating when work diverged.
- `deploy-log-forensics` — whether merged work actually *deployed* is a separate question
  this census does not answer.
