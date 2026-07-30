# Presence oracles — identifier → "does a real person exist here?" + profile

The direct generalization of the Gravatar trick: hand a platform an email / username / phone and it
tells you whether an account exists — often with a name, photo, or last-seen. Order by lift.

> Several of these are **undocumented** endpoints or **forbid automation** in ToS. They're for
> low-volume investigative pivots, not bulk scraping. Each entry flags the risk. `holehe`, `GHunt`,
> `Maigret`, `Epieos`, and Microsoft `GetCredentialType` live in
> [domain-email-enumeration](../../domain-email-enumeration/SKILL.md) — cross-referenced, not repeated.

## Email → person

### Duolingo — public users API  [keyless]
- **Input → output:** **email OR username** → user object: id, username, real name, bio, avatar URL,
  courses, streak, `hasPlus`, `hasGoogleId`/`hasFacebookId` (linked-login signal). Empty / `id:0` = no account.
- **Call:** `curl -s 'https://www.duolingo.com/2017-06-30/users?email=target@example.com' -H 'User-Agent: Mozilla/5.0'`
- **Use:** One of the richest **no-auth email→person** oracles that accepts an email directly — real
  name + username + avatar to pivot elsewhere.
- **Caveats:** Undocumented (path can change). ToS forbids automated scraping — keep it investigative.

### Spotify — signup-validation oracle  [keyless]
- **Input → output:** email → status code (`20` = account exists, `1` = available).
- **Call:** `curl -s 'https://spclient.wg.spotify.com/signup/public/v1/account?validate=1&email=test@gmail.com' -H 'User-Agent: Mozilla/5.0'`
- **Use:** Dependency-free version of holehe's Spotify check.
- **Caveats:** Undocumented; status mapping reverse-engineered; IP rate-limits.

## Username → identity / linked accounts

### Keybase — user lookup  [keyless]
- **Input → output:** username → cryptographically-verified **linked accounts** (Twitter/GitHub/
  Reddit/HN/domains) + PGP key + name.
- **Call:** `curl -s 'https://keybase.io/_/api/1.0/user/lookup.json?usernames=foo'`
- **Use:** The cleanest free **identity-consolidation** pivot — one handle → a verified cross-platform set.

### Chess.com — Published-Data API  [keyless]
- **Input → output:** username → player_id, real name, location, country, **`last_online`** (last-seen),
  joined date, title, followers, premium, `twitch_url`.
- **Call:** `curl -s 'https://api.chess.com/pub/player/hikaru' -H 'User-Agent: research/1.0'`
- **Use:** A rare **sanctioned** presence/last-seen leak; a reused handle → real name + geo + stream identity.

### Reddit — about.json  [keyless]
- `curl -s 'https://www.reddit.com/user/USERNAME/about.json' -H 'User-Agent: research/1.0'` → exists,
  karma, created date, bio, avatar.

### Hacker News — Algolia search  [keyless]
- `curl -s 'https://hn.algolia.com/api/v1/search?query=target@example.com'` → posts/comments that
  match a handle or email (comments frequently leak emails/contact info).

### Steam  [free-key]
- Vanity name → SteamID → profile (`ISteamUser/ResolveVanityURL`, `GetPlayerSummaries`).

## Domain / account triage (Microsoft)

### Microsoft — GetUserRealm  [keyless]
- **Input → output:** domain/email → `NameSpaceType` (Managed/Federated/Unknown),
  `FederationBrandName`, `CloudInstanceName`, AuthURL/STS (if federated) — is the domain on M365, and
  which external IdP/SSO handles auth.
- **Call:** `curl -s 'https://login.microsoftonline.com/getuserrealm.srf?login=user@example.com&json=1'`
- **Use:** Domain-level triage **before** per-user enumeration; a federated result = a tech-stack /
  vendor signal for B2B. Gate `GetCredentialType` (in `domain-email-enumeration`) on this.

## Phone → account existence

### ignorant  [shaky]
- **Input → output:** country code + phone → per-site exists boolean (Amazon/Instagram/Snapchat) via
  recovery flows. The phone analogue of holehe (same author, megadose).
- **Call:** `pip install ignorant && ignorant 33 644637111`
- **Caveats:** Only ~3 modules now; fragile / CAPTCHA'd; ToS-gray. (More phone tooling in
  [phone-and-messaging.md](phone-and-messaging.md).)

## Scoped / lower-value
- **Slack `users.lookupByEmail`** `[free-key, scoped]` — email → named member + photo + tz, but only
  within workspaces your token belongs to; not an internet-wide oracle.
- Cross-reference (already in `domain-email-enumeration`): **GHunt** (Google email → name+photo+GAIA),
  **holehe** (email → 120+ sites), **Maigret** (username → 3000+ sites, parses profile data — the
  strongest username oracle), **Epieos** (hosted aggregator).
