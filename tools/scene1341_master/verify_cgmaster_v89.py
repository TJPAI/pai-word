#!/usr/bin/env python3
"""Independent source-based QA for V89; no semantic acceptance."""
import collections,csv,gzip,hashlib,json,unicodedata
from pathlib import Path
P=Path('/mnt/data');O=P/'v89';N=lambda s:' '.join(unicodedata.normalize('NFKC',s or '').casefold().split())
rep=json.loads((O/'CGMASTER_V89_V13_ONLY_AND_IDENTITY_REPORT.json').read_text())
def sha(p):
 with p.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
assert sha(P/'PAI_Word_Scene1341_Sense_Scene_MASTER_FINAL.csv')==rep['source_sha256']['final']
assert sha(P/'v87/CGMASTER_V87_8523_V13_UNRESOLVED_SOURCE_RECOVERY.jsonl.gz')==rep['source_sha256']['v87']
original={}; globalen=collections.defaultdict(list)
with (P/'PAI_Word_Scene1341_Sense_Scene_MASTER_FINAL.csv').open(encoding='utf-8-sig',newline='') as f:
 for idx,r in enumerate(csv.DictReader(f),1):original[idx]=r;globalen[N(r['english_expression'])].append(idx)
source={}
with gzip.open(P/'v87/CGMASTER_V87_8523_V13_UNRESOLVED_SOURCE_RECOVERY.jsonl.gz','rt',encoding='utf8') as f:
 for l in f:
  r=json.loads(l)
  if r['recovery_class']!='ONE_EXPRESSION_SOURCE_ROW_GLOSS_DIVERGENCE_REVIEW':source[r['v13_row']]=r
assert len(source)==3464
count=collections.Counter();ambig=collections.Counter();ids=set()
for filename,kind in [('CGMASTER_V89_3140_V13_ONLY_GLOBAL_LINEAGE_AND_KAIKKI_CANDIDATES.jsonl.gz','source'),('CGMASTER_V89_324_DUPLICATE_ORIGINAL_FINAL_SOURCE_IDENTITY_CASES.jsonl.gz','ambig')]:
 path=O/filename;assert sha(path)==rep['files'][filename]['sha256']
 with gzip.open(path,'rt',encoding='utf8') as f:
  for l in f:
   r=json.loads(l);i=r['v13_audit_row'];assert i in source and i not in ids;ids.add(i)
   s=source[i];assert r['scene_id']==s['scene_id'] and r['expression']==s['v13_expression'] and r['v13_original_zh']==s['v13_original_zh']
   assert not r['release_allowed'] and not r.get('canonical_scene1341_sense_id') and not r.get('canonical_sense_id')
   if kind=='source':
    assert s['recovery_class']=='V13_ONLY_OR_RENAMED_EXPRESSION_VERIFY_LINEAGE'
    allrows=globalen.get(N(r['expression']),[]);others=[n for n in allrows if original[n]['scene_id']!=r['scene_id']]
    assert len(allrows)==len(others)
    same=[n for n in others if N(original[n]['sense_zh'])==N(r['v13_original_zh'])]
    typ='EXISTS_IN_OTHER_SCENES_WITH_SAME_ZH_NOT_PROVEN_SAME_SOURCE' if same else 'EXISTS_IN_OTHER_SCENES_DIFFERENT_ZH_NO_SOURCE_MATCH' if others else 'NOT_IN_ORIGINAL_FINAL_ENGLISH_EXPRESSION_INDEX'
    assert typ==r['source_lineage_class']
    assert r['global_same_zh_rows_count']==len(same)
    assert r['kaikki_candidate_count']==len(r['kaikki_candidates'])
    count[typ]+=1
   else:
    assert s['recovery_class']=='MULTIPLE_ORIGINAL_SOURCE_ROWS_NEED_IDENTITY_REVIEW'
    zs={N(original[c['final_source_row']]['sense_zh']) for c in s['candidate_source_rows']}
    typ='SAME_ZH_DUPLICATE_FINAL_ROWS' if len(zs)==1 else 'DIFFERENT_ZH_COMPETING_FINAL_ROWS'
    assert typ==r['identity_ambiguity']
    ambig[typ]+=1
assert len(ids)==3464
assert dict(count)==rep['counts']['v13_only_lineage']
assert dict(ambig)==rep['counts']['multiple_original_identity_class']
qa={'version':'V89-INDEPENDENT-STRUCTURAL-QA','status':'PASS_STRUCTURAL_ONLY','records_checked':len(ids),'v13_only':sum(count.values()),'duplicate_source':sum(ambig.values()),'lineage_class_counts':dict(count),'ambiguous_counts':dict(ambig),'input_source_hashes_verified':True,'outputs_sha_verified':True,'no_auto_source_link':True,'no_authorized_sense_id':True,'release_allowed':False,'errors':[]}
(O/'CGMASTER_V89_INDEPENDENT_STRUCTURAL_QA.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(qa,ensure_ascii=False,indent=2))
