#!/usr/bin/env python3
"""V166 source-preserving audit of V165 display normalization on V154 996 cards.
Counts are only for the retained 996-card Kaikki crosswalk, not all Scene1341.
This mirrors the source-pinned JS conversion sequence; final user-facing code is in V165 .mjs.
"""
import json, re, hashlib, collections, sys
from pathlib import Path
IN=Path(sys.argv[1]) if len(sys.argv)>1 else Path('/mnt/data/CGMASTER_V154_SC0011_0014_KAIKKI_IPA_TEST_CROSSWALK_20261114.json')
OUT=Path(sys.argv[2]) if len(sys.argv)>2 else Path('/mnt/data/CGMASTER_V166_996_CARDS_IPA_DISPLAY_INTEGRITY_20261114.json')
blob=IN.read_bytes();d=json.loads(blob)
rows=d['records'];assert len(rows)==996
ipa_re=re.compile(r'^([/\[])([^/\]\r\n]+)([/\]])$')
def display(x, lang='en'):
    if not isinstance(x,str) or not re.match(r'^en(?:-|$)',str(lang),re.I):return x
    original=x.strip();m=ipa_re.match(original)
    if not m or (m[1]=='/' and m[3]!='/') or (m[1]=='[' and m[3]!=']'):return x
    content=m[2].replace('ɹ','r').replace('ɡ','g').replace('t͡ʃ','tʃ').replace('d͡ʒ','dʒ')
    return m[1]+content+m[3]
def remainder_changed(src,dst):
    # reverse display-only variants; displays never assert full phonemic equivalence.
    return src!=dst
counts=collections.Counter();changes=collections.Counter();changed_rows=[];collision_rows=[];flat_counts=collections.Counter()
for r in rows:
    variants=r.get('phonemic_variants') or []
    if not variants:continue
    orig_by_display=collections.defaultdict(set)
    modified=[]
    for orig in variants:
        shown=display(orig)
        assert shown==display(shown),('not idempotent',orig)
        assert display(orig,'fr')==orig
        assert all(orig.count(c)==shown.count(c) for c in ('ɚ','ɝ','ˈ','ˌ','ː','ɾ','ʔ','ɫ','ʰ','̩','̯')),('protected symbol mutated',orig,shown)
        orig_by_display[shown].add(orig)
        flag=[]
        for k,test in [('ɹ_to_r','ɹ' in orig),('ɡ_to_g','ɡ' in orig),('t͡ʃ_to_tʃ','t͡ʃ' in orig),('d͡ʒ_to_dʒ','d͡ʒ' in orig)]:
            if test:flag.append(k);flat_counts[k]+=1
        if orig!=shown:
            modified.append({'raw_ipa':orig,'display_ipa':shown,'rules':flag})
        counts['variant_total']+=1
    if modified:
        counts['cards_changed']+=1
        for k in set(k for x in modified for k in x['rules']): changes[k]+=1
        changed_rows.append({'scene_id':r['scene_id'],'record_id':r['record_id'],'source_final_row':r['source_final_row'],'expression':r['expression'],'status':r['status'],'changes':modified,'selected_ipa':None,'qa_approved':False,'release_allowed':False})
    for shown, originals in orig_by_display.items():
        if len(originals)>1:
            counts['cards_with_display_collision']+=1
            collision_rows.append({'scene_id':r['scene_id'],'record_id':r['record_id'],'source_final_row':r['source_final_row'],'expression':r['expression'],'display_ipa':shown,'distinct_originals':sorted(originals),'qa_status':'HOLD_DISTINCT_SOURCE_VARIANTS_MUST_NOT_MERGE','release_allowed':False})
    counts['cards_with_phonemic']+=1
    counts['variant_unchanged']+=len(variants)-len(modified)
counts['changed_variant_occurrences']=sum(len(r['changes']) for r in changed_rows)
assert counts['cards_with_phonemic']==330 and counts['variant_total']==959
assert all(not r['qa_approved'] and not r['release_allowed'] for r in changed_rows)
assert not any(row.get('ipa_formal_approved') or row.get('qa_approved') or row.get('release_allowed') for row in rows)
report={'version':'V166','source':'V154 ORIGINAL KAIKKI-DERIVED CROSSWALK / V165 DISPLAY-ONLY ALGORITHM',
 'input_sha256':hashlib.sha256(blob).hexdigest(),'kaikki_archive_sha256':d['raw_source_sha256'],
 'counts':dict(counts),'changed_cards_by_rule':dict(changes),'variant_occurrences_by_rule':dict(flat_counts),
 'display_collisions':collision_rows,'changed_records':changed_rows,
 'source_raw_preserved':True,'question_answer_ipa_status_unchanged':True,'formal_ready':0,'release_allowed':False,
 'policy_notes':['Changed display strings do not change underlying IPA candidate identity.','Any display collision must retain ALL distinct source candidates (no silently merging source variants).','Only complete English bracketed IPA strings are eligible.','QA status is never promoted.','Data scope is only 996 cards, not all 1341 scenes.']}
OUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'counts':report['counts'],'changed_cards_by_rule':report['changed_cards_by_rule'],'collisions':collision_rows[:8]},ensure_ascii=False))