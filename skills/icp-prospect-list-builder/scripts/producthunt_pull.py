#!/usr/bin/env python3
"""
Pull Product Hunt products by ICP topic via the GraphQL API, self-throttling on the
rate limit. Writes name / tagline / website(redirect) / ph_url / votes / topic.

Auth: create a PH app at producthunt.com/v2/oauth/applications (a Redirect URI is
required even though the developer flow doesn't use it — any valid https URL works),
then exchange client_credentials for a token:

  curl -s -X POST https://api.producthunt.com/v2/oauth/token \
    -H 'Content-Type: application/json' \
    -d '{"client_id":"KEY","client_secret":"SECRET","grant_type":"client_credentials"}'

Put the returned access_token in the PH_TOKEN env var (do NOT commit it). Then:
  PH_TOKEN=xxxxx python producthunt_pull.py out.csv

Gotchas baked in below:
- The `Topic` type has NO `posts` connection — use the ROOT `posts(topic:)` field.
- Do NOT request nested `topics{}` on the node — it explodes query complexity.
- Rate limit ~6250 complexity / 900s; watch x-rate-limit-remaining and sleep on reset.
- `node.website` is a producthunt.com/r/ tracking redirect that 403s to bots; resolve
  real domains downstream (e.g. during the contact pull), not here.
"""
import os, sys, json, time, csv, urllib.request, urllib.error

TOKEN = os.environ.get("PH_TOKEN")
URL = "https://api.producthunt.com/v2/api/graphql"
# Clean ICP topics -> pull depth (cap). Tune to your ICP.
TOPICS = {"website-builder":500, "no-code":500, "e-commerce":300, "email-marketing":500,
          "newsletters":500, "marketing-automation":500, "online-learning":500,
          "community":500, "email":300, "seo":300}

Q = ("query($t:String!,$after:String){ posts(topic:$t, first:50, order:VOTES, after:$after){"
     " edges{ node{ id name tagline website url votesCount createdAt } }"
     " pageInfo{ endCursor hasNextPage } } }")

def call(variables, tries=5):
    data = json.dumps({"query": Q, "variables": variables}).encode()
    for _ in range(tries):
        req = urllib.request.Request(URL, data=data, headers={
            "Authorization": "Bearer " + TOKEN, "Content-Type": "application/json",
            "Accept": "application/json"})
        try:
            r = urllib.request.urlopen(req)
            body = json.loads(r.read()); hdr = dict(r.headers)
            rem = int(hdr.get("x-rate-limit-remaining", "9999"))
            rst = int(hdr.get("x-rate-limit-reset", "900"))
            if rem < 350:
                print(f"  [rate] remaining {rem}; sleeping {rst+3}s", flush=True); time.sleep(rst+3)
            return body
        except urllib.error.HTTPError as e:
            if e.code == 429:
                rst = int(e.headers.get("x-rate-limit-reset", "60"))
                print(f"  [429] sleep {rst+3}s", flush=True); time.sleep(rst+3); continue
            print(f"  [http {e.code}] {e.read().decode()[:200]}", flush=True); time.sleep(5)
        except Exception as ex:
            print(f"  [err] {ex}", flush=True); time.sleep(5)
    return None

def main():
    if not TOKEN:
        print("Set PH_TOKEN env var (see header)."); sys.exit(1)
    out = sys.argv[1] if len(sys.argv) > 1 else "producthunt-raw.csv"
    rows, seen = [], set()
    for slug, cap in TOPICS.items():
        after, got = None, 0
        print(f"== {slug} (cap {cap}) ==", flush=True)
        while got < cap:
            res = call({"t": slug, "after": after})
            if not res or "data" not in res or not res["data"].get("posts"):
                print(f"  stop: {str(res)[:150]}", flush=True); break
            conn = res["data"]["posts"]; edges = conn["edges"]
            if not edges:
                break
            for e in edges:
                n = e["node"]
                if n["id"] in seen:
                    continue
                seen.add(n["id"])
                rows.append({"source_topic": slug, "name": n["name"], "tagline": n.get("tagline",""),
                             "website": n.get("website",""), "ph_url": n.get("url",""),
                             "votes": n.get("votesCount",0), "created_at": n.get("createdAt","")})
                got += 1
            pi = conn["pageInfo"]; after = pi["endCursor"]
            if not pi["hasNextPage"]:
                break
        print(f"  -> {got}", flush=True)
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["source_topic","name","tagline","website","ph_url","votes","created_at"])
        w.writeheader(); w.writerows(rows)
    print(f"DONE: {len(rows)} unique posts -> {out}")

if __name__ == "__main__":
    main()
