#!/usr/bin/env python3
"""Generate deterministic read-only SC50 legacy candidate crosswalk and review queues."""
import csv, collections, hashlib, json, pathlib, re
root=pathlib.Path('tools/integration/scene1341-source')
source=root/'PAI_Word_Scene50_V1.5_Structural_Catalog.csv'
assert hashlib.sha256(source.read_bytes()).hexdigest()=='5ae9ba95eeecfd012782c51396166a5f747a428917217e05221a769bb4e30d9c'
with source.open(encoding='utf-8-sig',newline='') as f: rows=list(csv.DictReader(f))
assert len(rows)==1341 and len({r['id'] for r in rows})==1341
entries=[]; reverse=collections.defaultdict(list)
for row in rows:
    old=[x.strip() for x in row['scene500'].split(',') if x.strip()]
    for sid in old:
        assert re.fullmatch(r'S(?:00[1-9]|0[1-9][0-9]|[1-4][0-9][0-9]|500)',sid),(row['id'],sid)
        reverse[sid].append(row['id'])
    if not old: continue
    is_rename=row['name']!=row['revised_name']
    review=bool(len(old)>1 or is_rename or row['decision']!='UNCHANGED' or row['structural_action']!='NONE')
    entries.append({'scene_id':row['id'],'scene_name':row['revised_name'],'legacy_refs':old,
      'decision':row['decision'],'structural_action':row['structural_action'],
      'requires_semantic_review':review,'migration_approved':False})
assert len(entries)==410
assert sum(len(x['legacy_refs']) for x in entries)==500
assert len(reverse)==500 and all(len(v)==1 for v in reverse.values())
report={'schema':'pai-scene1341-crosswalk-candidates-v1','source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
 'status':'UNAPPROVED_CANDIDATE_ONLY','migration_approved':False,'srs_remap_allowed':False,
 'source_scene_count':1341,'linked_new_scene_count':len(entries),
 'legacy_id_coverage':len(reverse),'legacy_reference_edges':500,
 'multi_legacy_new_scenes':sum(len(x['legacy_refs'])>1 for x in entries),
 'changed_names':sum(row['name']!=row['revised_name'] for row in rows),
 'review_queue_count':sum(x['requires_semantic_review'] for x in entries),
 'entries':entries}
print(json.dumps(report,ensure_ascii=False,sort_keys=True,indent=2))
