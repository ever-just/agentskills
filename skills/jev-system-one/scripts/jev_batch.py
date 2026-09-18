#!/usr/bin/env python3
"""
jev_batch.py: resumable concurrent batch judgment over a corpus (Jev/System One).

Input : records JSONL   {"id": <unique>, "state": <string|object>, ...anything}
Questions file: JSON     {"qid": {"type": "noul|choice|score", "instructions": ..., "criteria": ...}, ...}
Output: results JSONL    {"id", "model", "answers", "usage"} or {"id", "error"}

Usage:
  TYPESAFE_API_KEY=... python3 jev_batch.py records.jsonl questions.json results.jsonl
  python3 jev_batch.py records.jsonl questions.json results.jsonl --workers 16 --model jev-latest

Smoke test first: run on ~5 records before a full batch. Re-running resumes
(skips ids already present in the output file).
"""
import json, os, sys, time, threading, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor

API = "https://api.typesafe.ai/v1/systemone"
KEY = os.environ.get("TYPESAFE_API_KEY", "")

def call(state, questions, model, tries=5):
    body = json.dumps({"model": model, "state": state, "questions": questions}).encode()
    for i in range(tries):
        req = urllib.request.Request(API, data=body, method="POST",
            headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read()), None
        except urllib.error.HTTPError as e:
            if e.code in (429, 529) and i < tries - 1:
                time.sleep(min(2 ** i * 0.5 + 0.2, 20)); continue
            return None, f"HTTP {e.code}: {e.read()[:200]!r}"
        except Exception as e:
            if i < tries - 1:
                time.sleep(min(2 ** i * 0.5 + 0.2, 20)); continue
            return None, f"{type(e).__name__}: {e}"
    return None, "exhausted"

def main():
    if len(sys.argv) < 4:
        sys.exit(__doc__)
    recs_path, q_path, out_path = sys.argv[1:4]
    args = sys.argv[4:]
    workers = int(args[args.index("--workers") + 1]) if "--workers" in args else 16
    model = args[args.index("--model") + 1] if "--model" in args else os.environ.get("JEV_MODEL", "jev-latest")
    if not KEY:
        sys.exit("TYPESAFE_API_KEY not set")

    questions = json.load(open(q_path))
    recs = [json.loads(l) for l in open(recs_path) if l.strip()]
    done = set()
    if os.path.exists(out_path):
        for l in open(out_path):
            try: done.add(json.loads(l)["id"])
            except Exception: pass
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
        print("Errors are saved in the output file; re-run to retry failed ids only after removing their error rows.", file=sys.stderr)

if __name__ == "__main__":
    main()
