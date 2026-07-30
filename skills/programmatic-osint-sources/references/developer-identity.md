# Developer identity — code repos as an email ↔ identity graph

Public code hosting leaks real names + emails + handles at scale. This is the single most
under-covered high-value cluster: it resolves **email → account** and **account/org → real
emails**, both directions.

### GitHub — consolidated email ↔ identity pivots  [keyless / free-key]
All keyless at 60 req/hr; a free PAT raises to 5,000 req/hr (search 30/min).

- **Commit search (email → username):**
  `curl -s "https://api.github.com/search/commits?q=author-email:jane.doe@acme.com&per_page=10" | jq -r '.items[].author.login'`
  (Replaces the removed user-search `in:email`.)
- **Repo commits (repo → contributor roster with emails):**
  `curl -s "https://api.github.com/repos/OWNER/REPO/commits?per_page=100" | jq -r '.[]|[.commit.author.email,.commit.author.name,.author.login]|@tsv' | sort -u`
- **`.patch` / `.diff` raw `From:` header (lowest lift, not API-rate-limited):**
  `curl -s "https://github.com/OWNER/REPO/commit/SHA.patch" | grep -m1 '^From:'` — also works on `/pull/{n}.patch`.
- **User events (username → push email):**
  `curl -s "https://api.github.com/users/USER/events/public" | jq -r '.[].payload.commits[]?.author|[.name,.email]|@tsv'`
- **Profile enrich (username → employer/site/Twitter):** `curl -s https://api.github.com/users/torvalds`
- **Caveats:** Public repos / default branches only; `@users.noreply.github.com` if the user enabled
  email privacy; author fields are **spoofable** — corroborate before trusting. Gists are an extra
  commit-email surface.

### GH Archive on BigQuery  [free-tier]
- **Input → output:** SQL over all public GitHub events since Feb 2011 → the commit-email leak
  **reversed at scale**: every actor who ever pushed with an `@target.com` email = a complete
  employee/alumni dev roster in one query.
- **Call:**
  ```sql
  SELECT actor.login, JSON_EXTRACT_SCALAR(c,'$.author.email') email
  FROM `githubarchive.day.20260101`, UNNEST(JSON_EXTRACT_ARRAY(payload,'$.commits')) c
  WHERE type='PushEvent' AND JSON_EXTRACT_SCALAR(c,'$.author.email') LIKE '%@acme.com'
  GROUP BY 1,2
  ```
- **Caveats:** Needs a GCP project (1 TB/mo free query). Broad scans burn the TB fast — scope to day
  tables. Pre/post-2015 schema differs. Same noreply caveat.

### Sourcegraph — public code / commit search  [shaky]
- **Input → output:** name/email/username/string across public repos → `type:commit` returns author
  name + `authorEmail`; code search finds emails hardcoded in configs/AUTHORS/CODEOWNERS/.mailmap.
- **Call:** `curl -s "https://sourcegraph.com/.api/search/stream?q=type:commit+repo:%5Egithub%5C.com/gorilla/mux%24+count:20&display=20" -H "Accept: text/event-stream"`
- **Use:** Cross-repo email/name pivot that GitHub search does poorly — find an identifier wherever
  it appears across indexed codebases at once.
- **Caveats:** Sourcegraph 7.0 removed features and now pushes sign-in on `sourcegraph.com/search`;
  public coverage has shrunk and the stream API increasingly expects auth. **Re-test; treat as
  degraded.**

### GitLab — REST API  [keyless / free-key]
- **Input → output:** project → commits carry `author_email`/`committer_email`; `/users?username=`
  → id, name, `public_email`, avatar (Gravatar hash → further pivot).
- **Call:** `curl -s "https://gitlab.com/api/v4/users?username=jamie"` ·
  `curl -s "https://gitlab.com/api/v4/projects/ID/repository/commits?per_page=100"`
- **Use:** GitHub-equivalent leak for targets on gitlab.com or **corporate self-hosted GitLab**
  (common in enterprises, often unthrottled).

### npm registry  [keyless]
- **Input → output:** package → `author {name,email}`, `maintainers[] {name,email}`, per-version
  `_npmUser`, repo/homepage/bugs.
- **Call:** `curl -s "https://registry.npmjs.org/express/latest" | jq '{author, maintainers, _npmUser}'`
- **Use:** A company's / individual's packages → direct maintainer email list; pivot
  handle → other packages → co-maintainers.
- **Caveats:** npm has been **progressively stripping** author/maintainer emails from public
  metadata — older packages retain them, newer often don't. Don't assume presence.

### PyPI — JSON API  [keyless]
- **Input → output:** package → `info.author_email` / `maintainer_email` (`Name <email>` form) +
  `project_urls` (GitHub/source).
- **Call:** `curl -s "https://pypi.org/pypi/requests/json" | jq '.info|{author,author_email,maintainer_email,project_urls}'`
- **Use:** Great for OSS-heavy data/ML/infra companies.
- **Caveats:** PEP 621 combined author fields increasingly omit the email — same softening as npm.

### gitcolombo / gitrecon / gitSome  [free-key]
- Orchestration over the GitHub pivots: point at an org → a de-duped contributor name+email+handle
  table in one run. `pip install gitcolombo && gitcolombo -u https://github.com/acme-corp --json`
  (also hosted at gitcolombo.soxoj.com).
- **Caveats:** Inherits the noreply/spoofing caveats. gitSome's email→account mode can push a probe
  commit (mildly abusive) — prefer read-only commit search.
