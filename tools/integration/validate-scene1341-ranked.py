#!/usr/bin/env python3
"""Issue #2: verify immutable V51-V61 ranked recommendations; never write Runtime."""
import collections, csv, hashlib, json
from pathlib import Path
base=Path(__file__).parent/'scene1341-ranked'
manifest=json.loads((base/'manifest.json').read_text(encoding='utf-8'))
index=json.loads((base/'index.json').read_text(encoding='utf-8'))
assert manifest['schema']=='pai-scene1341-ranked-recommendations-v1'
assert manifest['master_release_approved'] is False and manifest['production_eligible'] is False
assert len(manifest['files'])==11 and len(index['scenes'])==110
expected_index={r['scene_id']:r for r in index['scenes']}
assert len(expected_index)==110
counts=collections.Counter(); names={}; tier_counts=collections.Counter(); all_ids=set()
total=0
for i,spec in enumerate(manifest['files']):
    assert spec['version']==51+i
    source=Path(__file__).parents[2]/spec['path']
    raw=source.read_bytes()
    git_blob=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
    assert git_blob==spec['git_blob_sha'],f'BLOB_DRIFT_V{spec["version"]}'
    assert len(raw)==spec['size_bytes']
    with source.open(encoding='utf-8-sig',newline='') as handle:
        reader=csv.DictReader(handle)
        required={'scene_id','scene_name','rank','sense_id','expression','sense_zh','tier'}
        assert required.issubset(reader.fieldnames),f'BAD_HEADERS_{spec["version"]}'
        assert ('dimension' in reader.fieldnames)==(spec['version']>=53)
        seen_ranks=set(); seen_scenes=set(); batch_count=0
        for row in reader:
            sid=row['scene_id'].strip(); rank=row['rank'].strip()
            assert sid in expected_index,('UNKNOWN_SCENE',sid)
            n=int(sid[-4:])
            assert (spec['version']-51)*10+1<=n<=(spec['version']-50)*10
            assert rank.isdigit() and int(rank)>0
            assert row['expression'].strip() and row['sense_zh'].strip()
            assert row['sense_id'].strip()
            assert row['tier'].strip()
            assert (sid,rank) not in seen_ranks,('RANK_CONFLICT',sid,rank)
            assert row['sense_id'] not in all_ids,('DUPLICATE_SENSE_ID',row['sense_id'])
            seen_ranks.add((sid,rank));all_ids.add(row['sense_id'])
            if sid in names:assert names[sid]==row['scene_name'],('SCENE_NAME_DRIFT',sid)
            names[sid]=row['scene_name'];counts[sid]+=1;seen_scenes.add(sid)
            tier_counts[row['tier']]+=1;total+=1;batch_count+=1
        assert batch_count==spec['records'],('BATCH_COUNT',spec['version'],batch_count)
        assert len(seen_scenes)==10
assert total==manifest['record_count']==index['records']==19371
assert len(counts)==110
for sid,record in expected_index.items():
    assert record['count']==counts[sid],('INDEX_COUNT',sid)
    assert record['name']==names[sid],('INDEX_NAME',sid)
    assert record['version']==51+(int(sid[-4:])-1)//10
assert set(counts)=={f'SC50-{i:04d}' for i in range(1,111)}
print(json.dumps({'status':'PASS','batches':11,'scenes':len(counts),'records':total,
    'unique_sense_ids':len(all_ids),'tiers':dict(sorted(tier_counts.items())),
    'index_verified':True,'production_eligible':False},ensure_ascii=False))
