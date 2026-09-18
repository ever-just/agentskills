#!/usr/bin/env python3
"""
jev_eval.py — frozen-case eval harness for Jev questions.

Cases JSONL: {"id", "state": <string|object>, "expect": {"qid": <expected>}, ...}
  expected for noul:   true/false  (or a [lo,hi] band for probability)
  expected for choice: the option key
  expected for score:  the numeric level (or [lo,hi] range)
Questions file: same shape as jev_batch.py.

Usage:
  TYPESAFE_API_KEY=... python3 jev_eval.py cases.jsonl questions.json
  add --live to require the API run (fails if Jev never ran — the shadow-eval guard);
  omit it for a dry run over cached results.

Writes eval_results.jsonl and prints a per-question accuracy report plus every
disagreement with its probability detail — read probabilities on the misses.
"""
import json, os, sys, statistics
from jev_batch import call  # reuses the same request/retry

MODEL = os.environ.get("JEV_MODEL", "jev-latest")

def verdict(ans, expect):
    if ans is None:
        return None
    t = ans.get("type")
    if t == "noul":
        p = ans["noul"]
        if isinstance(expect, list):
            return expect[0] <= p <= expect[1]
        return (p >= 0.5) == bool(expect)
    if t == "choice":
        return ans.get("choice") == expect
    if t == "score":
        s = ans.get("score")
        if isinstance(expect, list):
            return expect[0] <= s <= expect[1]
        return abs(s - expect) <= 0.5
    return None

def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    cases_path, q_path = sys.argv[1:3]
    live = "--live" in sys.argv
    cases = [json.loads(l) for l in open(cases_path) if l.strip()]
    questions = json.load(open(q_path))

    rows = []
    if live:
        if not os.environ.get("TYPESAFE_API_KEY"):
            sys.exit("--live requires TYPESAFE_API_KEY")
        from concurrent.futures import ThreadPoolExecutor
        def run(c):
            res, err = call(c["state"], questions, MODEL)
            return {"id": c["id"], "answers": (res or {}).get("answers"), "error": err}
        with ThreadPoolExecutor(max_workers=16) as ex:
            rows = list(ex.map(run, cases))
        with open("eval_results.jsonl", "w") as f:
            for r in rows:
                f.write(json.dumps(r) + "\n")
        ran = sum(1 for r in rows if r.get("answers"))
        if ran == 0:
            sys.exit("Jev never ran — eval is invalid (shadow-eval guard)")
    else:
        rows = [json.loads(l) for l in open("eval_results.jsonl")]
        print(f"dry run over {len(rows)} cached results")

    exp_map = {c["id"]: c for c in cases}
    per_q = {}
    disagreements = []
    for r in rows:
        c = exp_map.get(r["id"])
        if not c or not r.get("answers"):
            continue
        for qid, expect in c.get("expect", {}).items():
            ans = r["answers"].get(qid)
            ok = verdict(ans, expect)
            if ok is None:
                continue
            st = per_q.setdefault(qid, {"n": 0, "hit": 0, "conf": []})
            st["n"] += 1
            st["hit"] += bool(ok)
            if "confidence" in ans:
                st["conf"].append(ans["confidence"])
            if not ok:
                disagreements.append((r["id"], qid, expect, ans))

    print(f"\n=== {len(cases)} cases, {sum(s['n'] for s in per_q.values())} judgments ===")
    for qid, s in per_q.items():
        acc = s["hit"] / s["n"]
        mc = statistics.mean(s["conf"]) if s["conf"] else float("nan")
        print(f"  {qid:<22} acc={acc:.2f} ({s['hit']}/{s['n']})  mean_conf={mc:.2f}")
    if disagreements:
        print(f"\n=== {len(disagreements)} disagreements (read probabilities on the misses) ===")
        for cid, qid, expect, ans in disagreements:
            got = ans.get("choice", ans.get("noul", ans.get("score")))
            probs = ans.get("probabilities", {})
            print(f"  {cid} {qid}: expected={expect} got={got} conf={ans.get('confidence','-')} probs={probs}")

if __name__ == "__main__":
    main()
