#!/usr/bin/env python3
"""
jev_batch.py: resumable concurrent batch judgment over a corpus (Jev/System One).

Input : records JSONL   {"id": <unique>, "state": <string|object>, ...anything}
Questions file: JSON     {"qid": {"type": "noul|choice|score", "instructions": ..., "criteria": ...}, ...}
                         keys starting with "_" (e.g. "_meta") are ignored.
Output: results JSONL    {"id", "model", "answers", "usage"} or {"id", "error"}

Usage:
  TYPESAFE_API_KEY=... python3 jev_batch.py records.jsonl questions.json results.jsonl
  python3 jev_batch.py records.jsonl questions.json results.jsonl --workers 16 --model jev-latest

Smoke test first: run on ~5 records before a full batch. Re-running resumes:
only rows WITH answers count as done; error rows are retried automatically.
"""
import json, os, sys, time, threading, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor

API = "https://api.typesafe.ai/v1/systemone"
KEY = os.environ.get("TYPESAFE_API_KEY", "")
TIMEOUT_S = 60          # batch calls are offline; a stuck call must not hang the pool
RETRYABLE_HTTP = {429, 529}
MAX_TRIES = 5
BACKOFF_BASE_S = 0.5    # exponential: base * 2^attempt + jitter, capped
BACKOFF_CAP_S = 20
DEFAULT_WORKERS = 16    # at ~300ms/call, 16 workers can exceed the documented
                        # 1,200 req/min; the 429 retry path absorbs it

def call(state, questions, model, tries=MAX_TRIES):
    body = json.dumps({"model": model, "state": state, "questions": questions}).encode()
    for i in range(tries):
        req = urllib.request.Request(API, data=body, method="POST",
            headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT_S) as r:
                return json.loads(r.read()), None
        except urllib.error.HTTPError as e:
            if e.code in RETRYABLE_HTTP and i < tries - 1:
                time.sleep(min(BACKOFF_BASE_S * 2 ** i + 0.2, BACKOFF_CAP_S)); continue
            return None, f"HTTP {e.code}: {e.read()[:200]!r}"
        except Exception as e:
            if i < tries - 1:
                time.sleep(min(BACKOFF_BASE_S * 2 ** i + 0.2, BACKOFF_CAP_S)); continue
            return None, f"{type(e).__name__}: {e}"
    return None, "exhausted"

def flag_value(args, name, default):
    if name not in args:
        return default
    i = args.index(name)
    if i + 1 >= len(args):
        sys.exit(f"{name} needs a value")
    return args[i + 1]

def main():
    if len(sys.argv) < 4:
        sys.exit(__doc__)
    recs_path, q_path, out_path = sys.argv[1:4]
    args = sys.argv[4:]
    workers = int(flag_value(args, "--workers", DEFAULT_WORKERS))
    model = flag_value(args, "--model", os.environ.get("JEV_MODEL", "jev-latest"))
    if not KEY:
        sys.exit("TYPESAFE_API_KEY not set")

    raw_questions = json.load(open(q_path))
    questions = {k: v for k, v in raw_questions.items() if not k.startswith("_")}
    recs = []
    for n, l in enumerate(open(recs_path), 1):
        if not l.strip():
            continue
        r = json.loads(l)
        if "id" not in r or "state" not in r:
            print(f"WARN line {n}: record missing 'id' or 'state', skipped", file=sys.stderr)
            continue
        recs.append(r)
    done = set()
    if os.path.exists(out_path):
        for l in open(out_path):
            try:
                row = json.loads(l)
            except Exception:
                continue
            if row.get("answers"):          # error rows do NOT count: they retry
                done.add(row["id"])
    todo = [r for r in recs if r["id"] not in done]
    print(f"{len(recs)} records, {len(done)} done, {len(todo)} to go", flush=True)
    if not todo:
        return

    lock = threading.Lock()
    fout = open(out_path, "a", buffering=1)
    stats = {"ok": 0, "err": 0, "t0": time.time()}

    def work(r):
        res, err = call(r["state"], questions, model)
        row = {"id": r["id"]}
        if res:
            row.update({"model": res.get("model"), "answers": res.get("answers"),
                        "usage": res.get("usage")})
        else:
            row["error"] = err
        with lock:
            fout.write(json.dumps(row) + "\n")
            stats["ok" if res else "err"] += 1
            n = stats["ok"] + stats["err"]
            if n % 50 == 0:
                el = time.time() - stats["t0"]
                print(f"  {n}/{len(todo)} ok={stats['ok']} err={stats['err']} {n/el:.1f}/s", flush=True)

    with ThreadPoolExecutor(max_workers=workers) as ex:
        list(ex.map(work, todo))
    print(f"DONE ok={stats['ok']} err={stats['err']} in {time.time()-stats['t0']:.0f}s", flush=True)
    if stats["err"]:
        print("Error rows stay in the output file; re-run retries them (only answered rows count as done).", file=sys.stderr)

if __name__ == "__main__":
    main()
