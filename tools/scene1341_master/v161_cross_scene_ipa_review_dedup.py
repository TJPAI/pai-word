#!/usr/bin/env python3
"""V161: deduplicate *review tasks*, never Scene1341 records or canonical senses."""
import json, collections, sys, hashlib
from pathlib import Path
src=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
rows=[r for r in src['records'] if r['qa_queue_status']=='MULTIPLE_US_TARGET_POS_READINGS_MANUAL_QA']
assert len(rows)==30
G=collections.defaultdict(list)
for r in rows:
    G[(r['expression'].casefold(),r['target_pos_editorial_inferred'])].append(r)
entries=[]
for (expression,pos),cards in sorted(G.items()):
    candidate_lists=[sorted(r['us_region_union_target_pos_variants']) for r in cards]
    matching=all(x==candidate_lists[0] for x in candidate_lists)
    risk=[]
    if not matching:risk.append('CROSS_SCENE_IPA_SET_DIFFERENCE_HOLD')
    if len(cards)>1:risk.append('REPEATED_EXPRESSION_MULTI_SCENE_KEEP_RECORD_AND_SENSE_SEPARATE')
    if expression=='steady':risk.append('PHONEMIC_VARIANT_SUSPICIOUS_VOWEL_MANUAL_SOURCE_VERIFICATION')
    if expression=='frustrated':risk.append('POSSIBLE_NONSTANDARD_R_DELETION_MANUAL_SOURCE_VERIFICATION')
    if expression=='carer':risk.append('BRITISH_USAGE_CONTEXT_US_REGION_SELECTION_NOT_DEFAULT')
    if expression in ('supervision',):risk.append('STRESS_PLACEMENT_VARIANTS_REQUIRE_LEXICAL_REVIEW')
    if expression in ('calm',):risk.append('FIVE_WIDE_REGIONAL_VARIANTS_NO_AUTOMATIC_CANONICAL')
    if expression in ('mobile',):risk.append('THREE_SYLLABIFICATION_VARIANTS_NO_AUTOMATIC_CANONICAL')
    if expression in ('veterinarian',):risk.append('REDUCED_COLLOQUIAL_VARIANTS_REQUIRE_LEXICAL_REVIEW')
    source_lines=sorted({e['line'] for r in cards for e in r['source_kaikki_evidence'] if e.get('ipa') in r['us_region_union_target_pos_variants'] and e.get('pos')==pos})
    key=hashlib.sha256((expression+'\0'+pos).encode()).hexdigest()[:16]
    entries.append(dict(review_group_id='V161-'+key,expression=expression,editorial_context_pos=pos,
      linked_record_ids=[r['record_id'] for r in cards],linked_scene_ids=[r['scene_id'] for r in cards],source_final_rows=[r['source_final_row'] for r in cards],
      meanings_zh=[r['meaning_zh_source'] for r in cards],examples_en=[r['author_draft_example_en'] for r in cards],
      ipa_variant_sets=candidate_lists,source_evidence_identical_across_cards=matching,
      candidate_ipa_unselected=candidate_lists[0] if matching else None,kaikki_source_line_numbers=source_lines,risk_flags=risk,
      editorial_pos_is_not_reviewed_master=True,canonical_sense_id=None,approved_ipa=None,qa_approved=False,release_allowed=False))
assert len(entries)==27
assert sum(len(x['linked_record_ids']) for x in entries)==30
assert len([x for x in entries if len(x['linked_record_ids'])>1])==3
assert all(x['source_evidence_identical_across_cards'] for x in entries)
counts={'multi_us_same_pos_cards':30,'unique_expression_pos_review_groups':27,'cross_scene_duplicate_review_groups':3,'duplicate_extra_cards':3,
 'suspicious_source_vowel_groups':sum('PHONEMIC_VARIANT_SUSPICIOUS_VOWEL_MANUAL_SOURCE_VERIFICATION' in x['risk_flags'] for x in entries),
 'ga_us_conflict_from_v160_excluded':2,'target_pos_no_us_from_v160_excluded':2,'formally_approved':0}
out=dict(version='V161',input_version='V160',input_kaikki_sha256=src['source_kaikki_sha256'],counts=counts,
 policy='Group only expression+context POS review tasks; never merge record ID, scene association or Sense. All candidates remain unselected.',groups=entries,formal_ready=0,release_allowed=False)
Path(sys.argv[2]).write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps(counts,ensure_ascii=False))