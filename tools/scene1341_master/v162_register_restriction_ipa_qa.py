#!/usr/bin/env python3
"""V162 audit: source-tag register filter only; never choose canonical IPA or certify."""
import json,collections
from pathlib import Path
base=Path('/mnt/data')
v160=json.loads((base/'CGMASTER_V160_SC0011_0014_34_MULTIREADING_TARGET_CONTEXT_QA_20261114.json').read_text())
v161=json.loads((base/'CGMASTER_V161_30_CARDS_27_IPA_REVIEW_GROUPS_20261114.json').read_text())
exclusion={'archaic','obsolete','nonstandard','dated'}
byid={x['record_id']:x for x in v160['records']}
out=[]
for g in v161['groups']:
    candidates=set(g['candidate_ipa_unselected'])
    evidence=[]
    for rid in g['linked_record_ids']:
        r=byid[rid]
        pos=r['target_pos_editorial_inferred']
        tagged=[e for e in r['source_kaikki_evidence'] if e.get('pos')==pos and e.get('ipa') in candidates and ('General-American' in e.get('tags',[]) or 'US' in e.get('tags',[]))]
        assert tagged and set(e['ipa'] for e in tagged)==candidates,(g['expression'],rid)
        evidence.append({'record_id':rid,'source_evidence':tagged})
    standing={}
    for v in sorted(candidates):
        vv=[e for item in evidence for e in item['source_evidence'] if e['ipa']==v]
        flags=sorted(set(t for e in vv for t in e['tags'] if t in exclusion))
        unmarked=any(not (set(e['tags']) & exclusion) for e in vv)
        standing[v]={'evidence_count':len(vv),'has_unmarked_US_evidence':unmarked,'marked_restrictions':flags,'source_line_numbers':sorted(set(e['line'] for e in vv))}
    kept=sorted(k for k,v in standing.items() if v['has_unmarked_US_evidence'])
    if not kept: status='ALL_US_EVIDENCE_MARKED_REQUIRE_ALTERNATE_SOURCE'
    elif len(kept)==1 and len(standing)>1: status='ONE_UNMARKED_US_VARIANT_OTHER_VARIANTS_RESTRICTED_QA_HOLD'
    elif len(kept)>1: status='MULTIPLE_UNMARKED_US_VARIANTS_STILL_HOLD'
    else:status='NO_REDUCTION_HOLD'
    out.append({'review_group_id':g['review_group_id'],'expression':g['expression'],'target_pos_editorial_only':g['editorial_context_pos'],'linked_record_ids':g['linked_record_ids'],'linked_scene_ids':g['linked_scene_ids'],'all_US_ipa_variants':sorted(candidates),'variant_register_evidence':standing,'unmarked_US_ipa_variants_not_selected':kept,'classification':status,'source_original_evidence_per_record':evidence,'canonical_sense_id':None,'selected_ipa':None,'qa_approved':False,'release_allowed':False})
assert len(out)==27 and sum(len(x['linked_record_ids']) for x in out)==30
counts=dict(collections.Counter(r['classification'] for r in out))
result={'version':'V162','input_version':'V161','original_kaikki_source_sha256':v161['input_kaikki_sha256'],'counts':counts,'review_groups':out,'filter_register_tags':sorted(exclusion),'policy':'Register-tag only; source tags might describe provenance not word-level acceptability. Never publish or select canonical IPA automatically.','formal_ready':0,'release_allowed':False}
p=base/'CGMASTER_V162_27_GROUPS_REGISTER_RESTRICTION_QA_20261114.json'
p.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(counts)
for x in out:
 if x['classification']!='MULTIPLE_UNMARKED_US_VARIANTS_STILL_HOLD':print(x['expression'],x['classification'],x['unmarked_US_ipa_variants_not_selected'])