#!/usr/bin/env python3
"""Editorial adjudication of eight observed near-neighbor pairs; no release certification."""
import pathlib,json,collections
p=pathlib.Path("tools/core20k_sense_v1/reports/source_join")
rows=json.loads((p/"first500_merge_review_8_pairs.json").read_text(encoding="utf8"))
decisions={
 ("which",0):("MERGE_TEACHING_SENSE_KEEP_GRAMMAR_VARIANTS","Restrictive/non-restrictive clause distinction is grammatical usage; retain both contextual constructions."),
 ("this",0):("MERGE_TEACHING_SENSE_KEEP_DISCOURSE_VARIANTS","Anaphoric vs cataphoric reference is usage, not necessarily separate lexical meaning."),
 ("them",0):("MERGE_TEACHING_SENSE_KEEP_SYNTAX_VARIANTS","Direct versus indirect object is syntactic function, not different referents."),
 ("our",0):("MERGE_TEACHING_SENSE_KEEP_PRAGMATIC_VARIANTS","Inclusive/exclusive addressee interpretation is contextual; preserve as pragmatic usage."),
 ("us",0):("REQUIRE_GRAMMAR_SOURCE_CHECK","Dictionary marks determiner objective versus subjective; verify rare usage, POS and examples before deciding."),
 ("us",1):("MERGE_TEACHING_SENSE_KEEP_PRAGMATIC_VARIANTS","Inclusive/exclusive pronoun referents differ by discourse context; retain examples."),
 ("whoever",0):("REVIEW_RELATIVE_VS_FREE_RELATIVE_CONSTRUCTION","Presence of 'that' may signal different syntactic distribution; avoid unreviewed merge."),
 ("whichever",0):("REVIEW_RELATIVE_VS_FREE_RELATIVE_CONSTRUCTION","Short glosses share words but relative clause construction may differ.")
}
seen=collections.Counter();out=[]
for row in rows:
 lemma=row["lemma"];index=seen[lemma];seen[lemma]+=1
 decision,reason=decisions[(lemma,index)]
 out.append({**row,"editorial_action":decision,"rationale":reason,
  "retain_both_original_glosses":True,"preserve_source_identity":True,
  "auto_merged":False,"independent_signoff":False,"release_eligible":False})
assert len(out)==8
counts=collections.Counter(x["editorial_action"] for x in out)
(p/"first500_merge_editorial_decisions_8.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("EDITORIAL_ADJUDICATION_8",json.dumps({"pairs":8,"actions":dict(counts),"independently_certified":0,"actual_id_merges":0},ensure_ascii=False))
