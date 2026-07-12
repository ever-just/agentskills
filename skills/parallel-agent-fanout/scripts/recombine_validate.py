#!/usr/bin/env python3
"""
Deterministically recombine per-batch agent outputs into one master CSV, asserting
row-count integrity and reporting anomalies. Never let an agent do this step.

Usage:
  python recombine_validate.py <glob_or_dir> <master_out.csv> [--expect N] [--key col]

- <glob_or_dir>: directory of out_*.csv (or a glob). All must share a header.
- --expect N   : assert the combined data-row count equals N (the input count).
- --key col    : report duplicate + blank values of this column (e.g. company_id).

Exits non-zero if the integrity assertion fails, so it can gate a commit.
"""
import csv, glob, os, sys
from collections import Counter

def read(p):
    with open(p, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def main():
    if len(sys.argv) < 3:
        print(__doc__); sys.exit(2)
    src, out = sys.argv[1], sys.argv[2]
    expect = None; key = None
    if "--expect" in sys.argv: expect = int(sys.argv[sys.argv.index("--expect")+1])
    if "--key" in sys.argv:    key = sys.argv[sys.argv.index("--key")+1]

    files = sorted(glob.glob(os.path.join(src, "out_*.csv")) if os.path.isdir(src) else glob.glob(src))
    if not files:
        print(f"no files matched {src}"); sys.exit(2)

    rows, header, problems = [], None, []
    for fp in files:
        recs = read(fp)
        if not recs:
            problems.append(f"EMPTY: {os.path.basename(fp)}"); continue
        if header is None:
            header = list(recs[0].keys())
        rows.extend(recs)
        print(f"  {os.path.basename(fp)}: {len(recs)} rows")

    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=header, extrasaction="ignore"); w.writeheader(); w.writerows(rows)

    print(f"\nTOTAL: {len(rows)} rows -> {out}")
    if key:
        vals = [r.get(key, "") for r in rows]
        blanks = sum(1 for v in vals if not v)
        dups = {k: c for k, c in Counter(v for v in vals if v).items() if c > 1}
        print(f"key '{key}': {blanks} blank, {len(dups)} duplicated" + (f" {list(dups)[:5]}" if dups else ""))
    for p in problems:
        print("  !", p)

    if expect is not None and len(rows) != expect:
        print(f"\nINTEGRITY FAIL: expected {expect}, got {len(rows)}"); sys.exit(1)
    print("integrity OK" if expect is not None else "done")

if __name__ == "__main__":
    main()
