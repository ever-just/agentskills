#!/usr/bin/env python3
"""
Normalize many per-source prospect CSVs (each with its own schema) into two
cross-linked master grains — companies.csv and contacts.csv — and print integrity
stats. Edit MAPPINGS to describe each source file's columns.

Usage:  python rollup.py <out_dir> <source1.csv> [<source2.csv> ...]
The two grains are written to <out_dir>/master-companies.csv and
<out_dir>/master-contacts.csv. Domain is the preferred dedup key; company name
(version/suffix-stripped) is the fallback.
"""
import csv, os, re, sys
from collections import Counter

COMPANY_COLS = ["company_id","dataset","segment","organization","domain","description",
                "category","tags","icp_fit","icp_rationale","size_or_stage","location",
                "num_contacts","source_url","confidence"]
CONTACT_COLS = ["company_id","dataset","segment","organization","contact_name","title",
                "linkedin_url","email","email_status","source_url","confidence"]

def norm_domain(d):
    d = (d or "").strip().lower()
    d = re.sub(r"^https?://", "", d); d = re.sub(r"^www\.", "", d)
    return d.split("/")[0].split("?")[0].strip()

def norm_name(n):
    n = (n or "").lower()
    n = re.sub(r"\bby .*$", "", n)                 # drop "by <maker>"
    n = re.sub(r"\bv?\d+(\.\d+)*\b", "", n)        # drop version numbers / v2 / 3.0
    n = re.sub(r"\b(ai|app|pro|plus|beta)\b", "", n)
    return re.sub(r"[^a-z0-9]", "", n)

def key_for(row):
    return norm_domain(row.get("domain")) or norm_name(row.get("organization") or row.get("company"))

def read(p):
    with open(p, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def main():
    if len(sys.argv) < 3:
        print(__doc__); sys.exit(1)
    out_dir, sources = sys.argv[1], sys.argv[2:]
    os.makedirs(out_dir, exist_ok=True)

    companies, contacts, seen_ids = {}, [], set()
    for path in sources:
        dataset = os.path.splitext(os.path.basename(path))[0]
        for r in read(path):
            org = (r.get("organization") or r.get("company") or "").strip()
            if not org:
                continue
            k = key_for(r)
            if k not in companies:
                cid = re.sub(r"[^a-z0-9]+", "-", org.lower()).strip("-")[:40] or f"c{len(companies)}"
                b, i = cid, 2
                while cid in seen_ids:
                    cid = f"{b}-{i}"; i += 1
                seen_ids.add(cid)
                companies[k] = {c: (r.get(c) or "") for c in COMPANY_COLS}
                companies[k].update(company_id=cid, dataset=r.get("dataset") or dataset,
                                    organization=org, domain=norm_domain(r.get("domain")),
                                    num_contacts=0)
            cid = companies[k]["company_id"]
            name = (r.get("contact_name") or "").strip()
            if name:
                row = {c: (r.get(c) or "") for c in CONTACT_COLS}
                row.update(company_id=cid, dataset=companies[k]["dataset"], organization=org)
                contacts.append(row)
                companies[k]["num_contacts"] = int(companies[k]["num_contacts"] or 0) + 1

    with open(os.path.join(out_dir, "master-companies.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=COMPANY_COLS, extrasaction="ignore"); w.writeheader()
        w.writerows(companies.values())
    with open(os.path.join(out_dir, "master-contacts.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=CONTACT_COLS, extrasaction="ignore"); w.writeheader()
        w.writerows(contacts)

    print(f"companies: {len(companies)}  contacts: {len(contacts)}")
    print("by icp_fit:", dict(Counter(c['icp_fit'] for c in companies.values())))
    print("by category:", dict(Counter(c['category'] for c in companies.values())))
    print("contacts missing company_id:", sum(1 for c in contacts if not c['company_id']))

if __name__ == "__main__":
    main()
