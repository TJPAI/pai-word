#!/usr/bin/env python3
"""V120 quarantine gate for 90-row editorial export. Never publish uncertified content."""
import csv,sys,collections
path=sys.argv[1] if len(sys.argv)>1 else 'tools/core20k_lexicon/production_v3/editorial/v120_full90_review_evidence.csv'
with open(path,encoding='utf-8-sig',newline='') as f: rows=list(csv.DictReader(f))
assert len(rows)==90, f'expected 90, got {len(rows)}'
keys=[r['sense_key'] for r in rows]
assert len(set(keys))==90 and all(keys)
assert all(r['definition_en'].strip() and r['v119_gloss_zh_draft'].strip() and r['ili'].strip() and r['wn30'].strip() for r in rows)
counts=collections.Counter(r['v119_editorial_status'] for r in rows)
assert counts=={'INHERITED_V118_ACCEPT_DRAFT':6,'INHERITED_V118_REVISE':9,'ACCEPT_AS_EDITORIAL_DRAFT':55,'REVISE_DRAFT':20},counts
print({'draft_rows':len(rows),'unique_senses':len(set(keys)),'statuses':dict(counts),'semantically_certified':0,'production_ready':0})
