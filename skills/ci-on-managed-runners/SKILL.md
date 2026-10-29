---
name: ci-on-managed-runners
description: Use when CI is slow, runs on a laptop, or GitHub-hosted Actions minutes are blocked or too expensive, and the job is to move CI and deploys onto cheap managed or self-hosted runners that Claude sessions can use without any cloud key. Covers choosing a vendor, the CI_RUNNER repo variable that swaps runners without a workflow edit, a plan/matrix/result workflow that posts one commit status, gating a hand-started deploy on that status, and the traps (runner context in job env, public repos, spot quotas, unpolled CI). Trigger words: self-hosted runners, Ubicloud, spot runners, CI too slow, Actions billing blocked, local-ci status, deploy gate.
---

# CI on managed runners

Move CI off a developer machine (or off blocked GitHub-hosted minutes) with one repository variable,
one workflow, and one commit status that both people and agents read.

## 1. Pick the vendor by what blocks you

| Situation | Choice |
|---|---|
| Need it today, small volume | A managed runner vendor (for example Ubicloud): install its GitHub App, use its labels, pay per minute. About 0.0025 USD a minute for 4 vCPU. |
| Cloud account with spot quota and Terraform skills | Ephemeral spot runners from the open-source `github-aws-runners/github-runner/aws` module. Check the account's **spot vCPU quota first**: a quota below the instance size (a new or small account can read 1) starts nothing, and a quota request can be denied. |
| Public repository | Stay on GitHub-hosted runners. A fork's pull request would otherwise run its code on your machines. |

Ask the owner before anything that costs money. Store vendor tokens in the secret manager, never in a
GitHub secret (a pull request workflow could read it).

## 2. Swap runners with one variable

Every `runs-on` in a CI workflow reads a repository variable:

```yaml
runs-on: ${{ fromJSON(vars.CI_RUNNER || '["ubuntu-latest"]') }}
```

Set it with `gh variable set CI_RUNNER --body '["<vendor-label>"]' -R <owner>/<repo>`. Delete it to fall back
to GitHub-hosted runners; change it to move vendors. No workflow edit, no PR.

## 3. One workflow, three jobs

- `plan`: decides the tier and the matrix, marks the commit `pending` through the commit status API.
- `run`: a matrix, one runner per entry, each running the same script a developer runs locally
  (`scripts/ci.sh <job>`), so the Mac, a cloud session and Actions cannot drift apart. `fail-fast: false`.
- `ci-result`: `if: ${{ !cancelled() }}`, posts the final status (context `local-ci`) on the tested commit. For a
  pull request that is the **head commit, not the merge commit**: `github.event.pull_request.head.sha`.

Tiers keep it cheap: a draft PR runs only the quick jobs and leaves the status `pending`; marking it ready runs
everything; a docs-only change runs the quick jobs and succeeds. Shard slow suites across runners with a
variable the script reads (for example a list of Go modules per matrix entry).

## 4. Gate the deploy on the status

Make the deploy workflow `workflow_dispatch` only (a merge deploys nothing) and have its first step fail unless
the commit has a passing `local-ci` status:

```bash
gh api repos/$GITHUB_REPOSITORY/commits/$GITHUB_SHA/status \
  --jq '.statuses[]|select(.context=="local-ci")|.state' | grep -qx success
```

An agent then deploys with `gh workflow run deploy.yml --ref main`, with no cloud key on its side: cloud
credentials stay in the workflow (OIDC role trusted for `refs/heads/main` only).

## 5. Traps

- A job-level `env:` cannot read the `runner` context (`runner.temp`). The whole run fails with "workflow file
  issue" and zero jobs. Set such values in a first step with `echo "X=$RUNNER_TEMP/..." >> "$GITHUB_ENV"`.
- A workflow disabled by hand (`disabled_manually`) ignores pushes. `gh workflow enable <name>` first.
- Lint workflows before pushing: `actionlint` catches context errors locally.
- Stock images lack some tools (a browser, a database client). Install them in a setup script keyed by job, and
  confirm on the first real run rather than assuming.
- Never poll CI. Read the checks once when a run should be done, or let the pull request hook wake the agent.
- Do not widen the cloud deploy role's trust to make a tag or branch trigger work; keep it on `main`.
