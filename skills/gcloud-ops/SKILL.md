---
name: gcloud-ops
description: Operate EverJust's Google Cloud (GCP) from the local gcloud CLI across every project the signed-in owner account can see. Inventory, status checks and management of VMs, Cloud Run, Firebase, Secret Manager, enabled APIs, billing. Use when the user mentions Google Cloud, GCP, gcloud, Compute Engine, a GCP project id, enabled APIs, or says "check my gcloud" or "manage gcloud for me".
---

# gcloud-ops

Account specifics (which Google account, org id, per-project map) are deliberately **not** in this repo because it is public. They live in `~/CLAUDE.md` (section "Google Cloud (gcloud CLI)") and `~/.claude/gcloud-project-map.md` on the owner's machine.

## Access
- CLI: `gcloud` at `/opt/homebrew/bin/gcloud`. Check who is signed in with `gcloud auth list` (the `*` row is active) and `gcloud config get-value account`.
- List what is reachable with `gcloud projects list`. Some projects (for example Workspace system projects under a different org) return 403. Ignore those.
- The configured default project is rarely the one you want. **Always pass `--project`**, never rely on the default.
- The Google Compute Engine connector in the Claude directory is not needed. The CLI covers every service.
- Application Default Credentials (`~/.config/gcloud/application_default_credentials.json`) are separate from CLI login. Verify before relying on them for SDK code.

## Rules
- **Read-only commands (list, describe, get): run freely.**
- When the owner asks for a change, do it. Stop and confirm only for what is destructive and was not explicitly requested: deleting a project or data, or widening IAM.
- Never print secret values from Secret Manager. List names only unless asked for one specific secret.
- Keep prose free of em and en dashes (global rule in `~/CLAUDE.md`).

## When auth has expired
Symptom: `Reauthentication failed. cannot prompt during non-interactive execution.`

The owner must run this in their own terminal and approve it in the browser. It asks for the Google account password, which an agent must not type, fetch from a password manager, or ask for in chat:

```bash
gcloud auth login <owner account from ~/CLAUDE.md>
```

Then re-run your command and confirm with `gcloud auth list`.

## Inventory sweep
Read-only. Lists enabled APIs, VMs, Cloud Run, Functions, GKE, Cloud SQL, App Engine, Secret Manager count, buckets and billing flag for every project.

```bash
bash ~/.claude/skills/gcloud-ops/scripts/sweep-all.sh                            # all projects, prints a report
bash ~/.claude/skills/gcloud-ops/scripts/sweep-project.sh PROJECT_ID /some/dir   # one project to /some/dir/PROJECT_ID.txt
```

It only queries a service when that API is enabled, so you do not get noisy "API not enabled" errors.

## Useful read-only commands
```bash
gcloud projects list --format='table(projectId,name,parent.id)'
gcloud services list --enabled --project P --format='value(config.name)'
gcloud compute instances list --project P
gcloud run services list --project P
gcloud secrets list --project P --format='value(name)'
gcloud billing projects describe P
gcloud billing accounts list
```

## Gotchas
- A per-service command fails if that API is off. Check `services list --enabled` first (the sweep does).
- The console URL `/compute/instances?project=P` redirects to the "Enable Compute Engine API" page when Compute is off. No API means no VMs.
- `gcloud app describe` erroring with "does not contain an App Engine application" means none exists. It is not a fault.
- `billingEnabled: False` means no billing account is linked, so paid services cannot run there.
- Console project names are display names and differ from ids. Use the id.
- The project map goes stale. Re-run the sweep before trusting it.
