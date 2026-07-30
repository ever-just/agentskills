# Phone & messaging-app intelligence

Phone → carrier / line-type / name, and handle/phone → messaging-app footprint.

## Phone reverse

### Twilio Lookup v2  [free-tier → paid]
- **Input → output:** E.164 → free basic validation; paid packages add `line_type_intelligence`
  (mobile/VoIP/landline + carrier + MCC/MNC), **`caller_name`/CNAM (US subscriber name)**, sim_swap,
  call_forwarding, identity_match.
- **Call:** `curl -s -X GET 'https://lookups.twilio.com/v2/PhoneNumbers/+14152007986?Fields=line_type_intelligence,caller_name' -u $TWILIO_SID:$TWILIO_AUTH`
- **Use:** The best **legitimate** phone enrichment — filter VoIP/burner leads, get carrier, and
  CNAM = phone→name under clean ToS. (A Twilio MCP server is available in this environment.)
- **Caveats:** CNAM is US-only and not always populated; packages billed beyond the ~$15 trial credit
  (~$0.008–0.01 each).

### Veriphone  [free-key]
- **Input → output:** phone → valid, phone_type (mobile/fixed/voip/toll_free), region, carrier, E.164.
- **Call:** `curl -s 'https://api.veriphone.io/v2/verify?phone=%2B14152007986&key=$VERIPHONE_KEY'`
- **Use:** Best **free quota** in the tier (~1,000 lookups/mo, no card) — bulk first-pass line-type filter.
- **Caveats:** No subscriber name. (Literal `demo` key = 401.)

### NumVerify / apilayer  [free-key]
- Phone → valid, formats, country, location, carrier, line_type; 232 countries. ~100/mo free
  (HTTP-only on free). **AbstractAPI Phone Validation** is an equivalent alternative.
- **Caveats:** Line-type mislabels ~1 in 4 VoIP as mobile — corroborate with Twilio for anything that matters.

### Truecaller (unofficial)  [shaky]
- Phone + country + your `installationId` → crowd-sourced **name + carrier + city**.
- **Call:** `pip install truecallerpy` (register a real phone first).
- **Use:** Strongest cheap phone→identity pivot; best coverage India/MENA/SEA.
- **Caveats:** Requires registering a real phone, **violates ToS**, throttles hard (~3 searches then
  block), ban risk. Investigative last resort only.

## Messaging apps & social handles

### X / Twitter — Syndication API  [keyless]
- **Input → output:** tweet ID + throwaway token → full tweet JSON + author (id_str, name,
  screen_name, is_blue_verified, photo, affiliation). Derives the stable numeric user id (survives
  handle changes).
- **Call:** `curl -s -A 'Mozilla/5.0' 'https://cdn.syndication.twimg.com/tweet-result?id=20&token=abc123&lang=en'`
- **Use:** Zero-auth X profile verification/enrichment — the low-lift substitute for the now-paid
  official API.
- **Caveats:** Unofficial, IP-blocked at scale, no follower counts, needs one known tweet id. Official
  X API v2 is paid-only for reads.

### Telegram — getChat + MTProto  [free-key]
- **Input → output:** `@username` → user/channel id, name, bio, photo, verified/premium flags (Bot
  API `getChat`); **phone → Telegram identity** via MTProto `importContacts` (if the target's privacy
  allows) / `resolveUsername`.
- **Call:** `curl -s 'https://api.telegram.org/bot$TG_TOKEN/getChat?chat_id=@durov'`
- **Use:** Handle→identity, and phone→person on a messaging platform.
- **Caveats:** No token = 401 (BotFather token; MTProto needs my.telegram.org API_ID/HASH).
  `importContacts` respects discoverability privacy; mass use trips flood limits / ban.

### Discord — /users/{id} + snowflake decode  [keyless (decode) / bot-token (profile)]
- **No-auth account age:** decode a snowflake → exact creation timestamp:
  `python3 -c 'print((80351110224678912>>22)+1420070400000)'` (ms epoch) — 100% offline, reliable
  throwaway-account detection.
- **Profile:** `curl -s 'https://discord.com/api/v10/users/{id}' -H 'Authorization: Bot $DISCORD_BOT_TOKEN'`
  → username, global_name, avatar, banner, public_flags (badges). 401 without a bot token.

### WhatsApp — existence + About + photo  [shaky]
- Phone (E.164) → has-WhatsApp (`wa_id`), About text, profile pic (if public), via whatsapp-web.js /
  Baileys (your own QR session) or gateways (Whapi/Wassenger). A "reachable human" signal + photo/bio.
- **Caveats:** ToS-violating on a self-session — use a dedicated number; ban risk.

### Signal  [shaky]
- Phone → registered boolean only (`getUserStatus`). Signal is deliberately OSINT-hostile — no
  profile data for non-contacts. A flag, not enrichment.

### LinkedIn — Voyager internal API  [shaky]
- public_id/URN → the richest B2B person object (positions, tenure, education, skills) +
  `get_profile_contact_info` (published email/phone/websites/Twitter), using your logged-in `li_at`
  cookie.
- **Caveats:** **Strictly against LinkedIn ToS** (ban + legal exposure, cf. `hiQ`); throttle
  1–2 req/min. `tomquirk/linkedin-api` went private — community forks (e.g. `EseToni/open-linkedin-api`)
  exist. High risk; already partially covered by `linkedin-activity-intelligence`.
