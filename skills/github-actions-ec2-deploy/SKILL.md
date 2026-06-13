# GitHub Actions → EC2 Deploy Pipeline

## Overview

Set up a CI/CD pipeline that deploys on every push to master by SSHing into an EC2 instance, pulling code, rebuilding containers, and verifying health.

---

## Workflow

```yaml
name: Deploy to Production

on:
  push:
    branches: [master]

permissions: {}  # No GitHub token needed

concurrency:
  group: deploy-production
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    environment: production  # Scoped secrets

    steps:
      # Pin to commit SHA — prevents supply-chain tag hijacking
      - name: Deploy via SSH
        uses: appleboy/ssh-action@0ff4204d59e8e51228ff73bce53f80d53301dee2
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            set -euo pipefail
            cd /opt/your-app
            sudo git config --global --add safe.directory /opt/your-app
            sudo git fetch origin master
            sudo git reset --hard origin/master
            cd deployment
            sudo docker compose build --no-cache control-plane
            sudo docker compose up -d --remove-orphans
            sudo docker compose restart app  # Reload Python code
            sleep 5
            sudo docker compose exec -T app python -c "from urllib.request import urlopen; assert urlopen('http://localhost:8000/healthz').status == 200"
```

## Security Hardening

| Measure | How |
|---|---|
| Pin action to SHA | `uses: action@SHA` not `@v1` |
| Minimal permissions | `permissions: {}` |
| Environment-scoped secrets | Secrets on `production` env, not repo-level |
| Branch restriction | Environment only allows master |
| Concurrency guard | One deploy at a time |

## Setup Commands

```bash
# Create GitHub environment
gh api repos/OWNER/REPO/environments/production -X PUT \
  --input <(echo '{"deployment_branch_policy":{"protected_branches":false,"custom_branch_policies":true}}')

# Restrict to master
gh api repos/OWNER/REPO/environments/production/deployment-branch-policies \
  -X POST -f name="master" -f type="branch"

# Set secrets on environment (not repo)
gh secret set DEPLOY_HOST --env production <<< "1.2.3.4"
gh secret set DEPLOY_USER --env production <<< "ubuntu"
gh secret set DEPLOY_SSH_KEY --env production < ~/.ssh/key.pem

# Delete repo-level secrets
gh secret delete DEPLOY_SSH_KEY
```

## Pitfalls
- `git fetch` fails with "dubious ownership" → add `safe.directory` config
- `git` commands need `sudo` if repo owned by root
- Health check fails if app listens inside Docker network → use `docker compose exec`
- `script_stop` is not a valid input for appleboy/ssh-action v1 — remove it
- fail2ban can lock you out after many rapid SSH sessions from CI — whitelist the runner IP or increase thresholds
- `docker compose up -d` only restarts changed containers — explicitly `restart app` for code changes in volume-mounted directories
- EC2 Instance Connect Endpoint (EICE) is the escape hatch when fail2ban blocks SSH
