#!/usr/bin/env python3
"""V167: source-preserving crosswalk evidence gate, not a pronunciation approval."""
import json, sys, hashlib, collections
from pathlib import Path
src=Path(sys.argv[1]); dst=Path(sys.argv[2]); data=src.read_bytes(); obj=json.loads(data)
rows=obj['records']
assert len(rows)==996
assert len({r['record_id'] for r in rows})==996
assert len({(r['scene_id'],r['source_final_row']) for r in rows})==996
counts=collections.Counter(); by_scene=collections.defaultdict(collections.Counter); queue=[]
for r in rows:
    status=r['status']; phon=r.get('phonemic_variants') or []; other=r.get('other_variants') or []
    evidence=r.get('source_evidence') or []
    assert not r.get('ipa_formal_approved') and not r.get('qa_approved') and not r.get('release_allowed')
    counts['total']+=1; counts['status_'+status]+=1
    if phon: counts['has_phonemic']+=1
    else: counts['no_phonemic']+=1
    if len(phon)==1: counts['one_phonemic']+=1
    if len(phon)==1 and status=='MULTIVARIANT_UNSELECTED':
        counts['one_phonemic_but_unselected']+=1
        queue.append({'scene_id':r['scene_id'],'record_id':r['record_id'],'source_final_row':r['source_final_row'],
          'expression':r['expression'],'phonemic_variants':phon,'other_variants':other,
          'source_pos':sorted(set(str(e.get('pos','')) for e in evidence)),
          'source_tags':sorted(set(str(t) for e in evidence for t in (e.get('tags') or []))),
          'reason':'PHONEMIC_SINGLE_WITH_OTHER_EVIDENCE_HOLD',
          'approved_ipa':None,'qa_approved':False,'release_allowed':False})
    by_scene[r['scene_id']]['total']+=1
    by_scene[r['scene_id']][status]+=1
assert counts['has_phonemic']==330 and counts['no_phonemic']==666
assert counts['one_phonemic']==105 and counts['one_phonemic_but_unselected']==14
result={'version':'V167','scope':'SC0011-SC0014, 996 cards only',
'source_sha256':hashlib.sha256(data).hexdigest(),
'kaikki_archive_sha256':obj['raw_source_sha256'],'counts':dict(counts),
'by_scene':{k:dict(v) for k,v in sorted(by_scene.items())},
'one_phonemic_but_unselected_review_queue':queue,
'interpretation':'Other phonetic variants, tags, POS and source identity require independent review; single phonemic variant is NOT formal approval.',
'original_master_modified':False,'formal_ready':0,'release_allowed':False}
dst.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'counts':result['counts'],'queue':len(queue)},ensure_ascii=False))
