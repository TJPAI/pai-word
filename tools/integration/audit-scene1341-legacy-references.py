#!/usr/bin/env python3
"""Read-only SC50-to-S migration audit. References are hints, NOT migration approval."""
import csv, collections, json, pathlib, re
root=pathlib.Path('tools/integration/scene1341-source')
with (root/'PAI_Word_Scene50_V1.5_Structural_Catalog.csv').open(encoding='utf-8-sig',newline='') as f:
 rows=list(csv.DictReader(f))
assert len(rows)==1341 and len({r['id'] for r in rows})==1341
refs=collections.defaultdict(set); invalid=[]; cells=0
for r in rows:
 raw=r['scene500'].strip()
 if not raw: continue
 cells+=1
 for part in raw.split(','):
  key=part.strip()
  if not re.fullmatch(r'S(?:00[1-9]|0[1-9][0-9]|[1-4][0-9][0-9]|500)',key):
   invalid.append({'scene_id':r['id'],'reference':key})
  else: refs[key].add(r['id'])
assert not invalid, f'INVALID_LEGACY_SCENE_REFERENCES: {invalid[:5]}'
assert all(r['gate']=='NOT_CERTIFIED' and int(r['certified_count'])==0 for r in rows)
shared={k:sorted(v) for k,v in refs.items() if len(v)>1}
unreferenced=[f'S{i:03d}' for i in range(1,501) if f'S{i:03d}' not in refs]
summary={'status':'SOURCE_AUDIT_ONLY','source_scenes':len(rows),'nonempty_reference_cells':cells,
 'individual_reference_edges':sum(len(v) for v in refs.values()),
 'distinct_legacy_scene_references':len(refs),'unreferenced_legacy_scene_count':len(unreferenced),
 'shared_legacy_scene_references':len(shared),
 'source_action_counts':dict(sorted(collections.Counter(r['structural_action'] for r in rows).items())),
 'source_evidence_counts':dict(sorted(collections.Counter(r['evidence_status'] for r in rows).items())),
 'migration_approved':False,'legacy_id_remap_allowed':False,'playable_ku_verified':False}
print(json.dumps(summary,ensure_ascii=False,sort_keys=True))
