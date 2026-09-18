#!/usr/bin/env python3
"""
jev_eval.py: frozen-case eval harness for Jev questions.

Cases JSONL: {"id", "state": <string|object>, "expect": {"qid": <expected>}, ...}
  expected for noul:   true/false  (or a [lo,hi] band for probability)
  expected for choice: the option key
  expected for score:  the numeric level (or [lo,hi] range)
Questions file: same shape as jev_batch.py; keys starting with "_" are ignored.

Usage:
  TYPESAFE_API_KEY=... python3 jev_eval.py cases.jsonl questions.json
  add --live to require the API run (fails if Jev never ran: the shadow-eval guard);
  omit it for a dry run over cached results. --model <id> pins the model (env
  JEV_MODEL otherwise). Results are written next to the cases file as
  <cases>.eval_results.jsonl.

Writes eval results and prints a per-question accuracy report plus every
disagreement with its probability detail: read probabilities on the misses.
"""
import json, os, sys, statistics
from jev_batch import call, flag_value

MODEL = os.environ.get("JEV_MODEL", "jev-latest")
WORKERS = 16            # eval cases are independent; parallel calls are safe

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
    args = sys.argv[3:]
    live = "--live" in args
    model = flag_value(args, "--model", MODEL)
    results_path = cases_path.replace(".jsonl", "") + ".eval_results.jsonl"
    cases = [json.loads(l) for l in open(cases_path) if l.strip()]
    questions = {k: v for k, v in json.load(open(q_path)).items()
                 if not k.startswith("_")}

    unknown = sorted({qid for c in cases for qid in c.get("expect", {})
                      if qid not in questions})
    if unknown:
        print(f"WARN: expect qids not in the question bank: {unknown}", file=sys.stderr)

    rows = []
    if live:
        if not os.environ.get("TYPESAFE_API_KEY"):
            sys.exit("--live requires TYPESAFE_API_KEY")
        from concurrent.futures import ThreadPoolExecutor
        def run(c):
            res, err = call(c["state"], questions, model)
            return {"id": c["id"], "model": (res or {}).get("model"),
                    "answers": (res or {}).get("answers"),
                    "usage": (res or {}).get("usage"), "error": err}
        with ThreadPoolExecutor(max_workers=WORKERS) as ex:
            rows = list(ex.map(run, cases))
        with open(results_path, "w") as f:
            for r in rows:
                f.write(json.dumps(r) + "\n")
        ran = sum(1 for r in rows if r.get("answers"))
        if ran == 0:
            sys.exit("Jev never ran: eval is invalid (shadow-eval guard)")
    else:
        if not os.path.exists(results_path):
            sys.exit(f"no cached results at {results_path}: run --live first")
        rows = [json.loads(l) for l in open(results_path) if l.strip()]
        models = sorted({r.get("model") for r in rows if r.get("model")})
        print(f"dry run over {len(rows)} cached results "
              f"({results_path}; models: {', '.join(models) or 'unknown'})")

    exp_map = {c["id"]: c for c in cases}
    per_q = {}
    disagreements = []
    soft_hits = []      # noul judged correct but |p - 0.5| < 0.1: not calibrated
    errored = [r["id"] for r in rows if not r.get("answers")]
    missing = [c["id"] for c in cases if c["id"] not in {r["id"] for r in rows}]
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
            if ok and ans.get("type") == "noul" and not isinstance(expect, list) \
               and abs(ans.get("noul", 0.5) - 0.5) < 0.1:
                soft_hits.append((r["id"], qid, ans["noul"]))
            if "confidence" in ans:
                st["conf"].append(ans["confidence"])
            if not ok:
                disagreements.append((r["id"], qid, expect, ans))

    n_judged = sum(s["n"] for s in per_q.values())
    print(f"\n=== {len(cases)} cases, {n_judged} judgments "
          f"({len(errored)} errored, {len(missing)} missing) ===")
    if errored or missing:
        print(f"  coverage: {len(cases) - len(missing) - len(errored)}/{len(cases)} "
              f"cases answered; accuracy below counts ANSWERED judgments only")
        if errored:
            print(f"  errored: {errored[:10]}{'...' if len(errored) > 10 else ''}")
        if missing:
            print(f"  missing: {missing[:10]}{'...' if len(missing) > 10 else ''}")
    for qid, s in per_q.items():
        acc = s["hit"] / s["n"]
        mc = statistics.mean(s["conf"]) if s["conf"] else float("nan")
        print(f"  {qid:<22} acc={acc:.2f} ({s['hit']}/{s['n']})  mean_conf={mc:.2f}")
    if soft_hits:
        print(f"\n=== {len(soft_hits)} soft hits: noul within 0.1 of 0.5 counted "
              f"correct by bool expect ===")
        print("  binarizing near-uncertain answers inflates accuracy; "
              "use a [lo,hi] band expect for these (03: band nouls, don't binarize)")
        for cid, qid, p in soft_hits[:10]:
            print(f"  {cid} {qid}: p={p:.3f}")
    if disagreements:
        print(f"\n=== {len(disagreements)} disagreements (read probabilities on the misses) ===")
        for cid, qid, expect, ans in disagreements:
            got = ans.get("choice", ans.get("noul", ans.get("score")))
            probs = ans.get("probabilities", {})
            print(f"  {cid} {qid}: expected={expect} got={got} conf={ans.get('confidence','-')} probs={probs}")

if __name__ == "__main__":
    main()
