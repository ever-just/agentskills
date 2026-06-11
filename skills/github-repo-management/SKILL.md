# GitHub Repo Management

## Overview

Workflows for initializing a local directory as a git repo, creating a new GitHub repository (public or private), pushing existing work, and cleaning up after structural changes (renames, deletes). Uses the GitHub CLI (`gh`) — no manual web UI steps required.

Use this skill when you need to:
- Turn a local project directory into a versioned, remote-backed repo for the first time
- Push a completed project (research dossier, app, data vault) to a private GitHub repo
- Perform cleanup operations after restructuring (remove deleted files, update remote)
- Manage repo visibility (public ↔ private)

---

## Prerequisites

```bash
# Check gh is installed and authenticated
gh auth status
```

Expected output includes `✓ Logged in to github.com account [USERNAME]` and `Token scopes: 'repo', ...`.

If not installed: `brew install gh && gh auth login`

The `repo` scope is required for creating and pushing to private repos.

---

## Workflow 1 — Initialize and push a new private repo

Use when a local directory has no git history and you want to create a new private GitHub repo from it.

```bash
# 1. Initialize git
git -C /path/to/project init

# 2. Rename default branch to main
git -C /path/to/project branch -m main

# 3. Create .gitignore before first commit
cat > /path/to/project/.gitignore << 'EOF'
.DS_Store
**/.DS_Store
*.pyc
__pycache__/
.env
*.swp
EOF

# 4. Stage and commit everything
git -C /path/to/project add -A
git -C /path/to/project commit -m "Initial commit: [description]"

# 5. Create private repo, add remote, and push in one command
gh repo create [REPO-NAME] --private --source /path/to/project --remote origin --push
```

The `gh repo create` command with `--source` and `--push`:
- Creates the repo under the authenticated GitHub account
- Adds `origin` remote pointing to the new repo
- Pushes `main` to `origin`

**Output confirms:** `✓ Created repository [OWNER]/[REPO-NAME]` + `✓ Pushed commits`

---

## Workflow 2 — Subsequent commits and push

```bash
git -C /path/to/project add -A
git -C /path/to/project commit -m "Short description of what changed"
git -C /path/to/project push
```

For scoped commits (don't commit everything, just specific files):
```bash
git -C /path/to/project add path/to/file1.md path/to/file2.csv
git -C /path/to/project commit -m "Specific description"
git -C /path/to/project push
```

---

## Workflow 3 — Committing a file deletion

When you delete a file locally, git tracks the deletion automatically with `git add -A`. But to commit only the deletion:

```bash
git -C /path/to/project rm path/to/deleted/file.csv
git -C /path/to/project commit -m "Remove duplicate [file]; canonical copy at [new path]"
git -C /path/to/project push
```

---

## Workflow 4 — Change repo visibility

```bash
# Make private repo public
gh repo edit [OWNER]/[REPO-NAME] --visibility public

# Make public repo private
gh repo edit [OWNER]/[REPO-NAME] --visibility private
```

---

## Workflow 5 — Clone an existing private repo

```bash
gh repo clone [OWNER]/[REPO-NAME] /path/to/local/destination
```

Or using SSH directly (if `gh` auth uses SSH):
```bash
git clone git@github.com:[OWNER]/[REPO-NAME].git /path/to/local/destination
```

---

## Common patterns

### .gitignore for research / data projects

```gitignore
# macOS
.DS_Store
**/.DS_Store

# Python
*.pyc
__pycache__/
.env
*.swp

# Large binary files that should be in Git LFS instead
*.pdf
*.xlsx
*.zip
```

Note: If PDFs and Excel files are essential to the repo (e.g., a research dossier), do NOT add them to `.gitignore`. Only exclude them if they are build artifacts or downloads that can be regenerated.

### Git LFS for large files

If a file exceeds GitHub's 50 MB recommended limit, GitHub will warn but still accept it (up to 100 MB hard limit). To handle large files cleanly:

```bash
# Install LFS
git lfs install

# Track large file types
git lfs track "*.pdf"
git lfs track "*.xlsx"

# The .gitattributes file is created automatically — commit it
git add .gitattributes
git commit -m "Add Git LFS tracking for large files"
```

**Warning:** GitHub warns at >50 MB and may reject at >100 MB. Files between 50-100 MB push successfully but trigger a warning. Check for these in push output:
```
remote: warning: File path/to/large/file.ext is 61.62 MB; this is larger than GitHub's recommended maximum file size of 50.00 MB
```

### Verify remote URL

```bash
git -C /path/to/project remote -v
```

### Check what would be committed

```bash
git -C /path/to/project status
git -C /path/to/project diff --cached   # staged changes
git -C /path/to/project diff            # unstaged changes
```

---

## Pitfalls

- **`cd` in `run_command`** — The `run_command` tool does not support `cd`. Always use `git -C /absolute/path` or specify `cwd` in the tool call.
- **Heredoc mangling** — Heredoc syntax (`<< 'EOF'`) in `run_command` can be mangled by the shell wrapper. Write multi-line content to files using the `write_to_file` tool instead.
- **SSH vs HTTPS** — `gh auth status` shows the active protocol. SSH is preferred (no token expiry). If the remote URL is `https://` but auth is SSH, pushes may prompt for credentials. Fix: `git remote set-url origin git@github.com:[OWNER]/[REPO].git`
- **`.gitignore` after first commit** — Files already committed are tracked even if you later add them to `.gitignore`. To untrack: `git rm --cached path/to/file`.
- **Large binary files** — Research projects accumulate PDFs and images. Warn before committing files >20 MB. Check with: `find /path/to/project -size +10M -not -path '*/.git/*'`

---

## Combining with other skills

- **`intelligence-dossier`** — The canonical use case: build a dossier, then push it to a private repo for version control. Each session of updates = one commit.
- **`deep-research`** — After a research session, commit the new raw evidence files to the repo so the vault is versioned.
