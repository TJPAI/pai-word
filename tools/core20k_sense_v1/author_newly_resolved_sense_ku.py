#!/usr/bin/env python3
"""Two newly resolved sense-level Chinese editorial drafts and original KU.
Uncertain OEWN alignment aborts rather than silently assigning ECDICT word-level translation.
"""
import json,pathlib,gzip,re
root=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch-all")
evidence={r["lemma"].casefold():r for line in (root/"missing_lexical_sense_evidence.jsonl").open(encoding="utf8") for r in [json.loads(line)]}
entries={
 "judgmental":{"zh":"爱评判他人的；动辄指责的","meaning":"tending to judge other people's behavior critically","en":"Her ___ remarks made the younger students reluctant to speak.","cue":"对他人动辄作出负面评价的"},
 "evaluative":{"zh":"评价性的；评估性的","meaning":"involving assessment or evaluation","en":"The report includes an ___ section comparing the two teaching methods.","cue":"对教学方法进行评价的"}
}
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf8") as f:words=json.load(f)["headwords"]
out=[];rejected=[]
for lemma,v in entries.items():
    e=evidence.get(lemma)
    if not e or len(e["oewn_sense_candidates"])!=1:
        rejected.append({"lemma":lemma,"reason":"MISSING_OR_MULTIPLE_OEWN_SENSES"});continue
    sense=e["oewn_sense_candidates"][0];definition=sense["gloss_en"]
    # Review only the exact OEWN source record; no automatic word-level Chinese assignment.
    if not definition or not sense["oewn_sense_id"]:
        rejected.append({"lemma":lemma,"reason":"MISSING_SOURCE_DEFINITION"});continue
    rank=e["rank"]
    assert words[rank-1][1].casefold()==lemma and v["en"].count("___")==1
    out.append({"draft_sense_id":f"staging:v21:zh-editorial:{rank}:{sense['oewn_sense_id']}",
       "headword_id":f"core20k:rank:{rank}","rank":rank,"lemma":lemma,
       "oewn_sense_id":sense["oewn_sense_id"],"definition_en_source":definition,
       "gloss_zh_editorial":v["zh"],"editorial_meaning_en":v["meaning"],
       "ecdict_wordlevel_reference":e["ecdict_translation_zh_wordlevel"],
       "editorial_rationale":"Corrected narrow/misaligned ECDICT headword translation; human-readable AI judgement requires independent signoff.",
       "draft_ku_id":f"staging:v21:missing:{rank}:editorial01",
       "ku_type":"sense","render_kind":"guided_cloze",
       "question_instruction_zh":f"根据“{v['cue']}”补全句子。",
       "prompt":v["en"],"context_en":v["en"].replace("___",lemma),
       "correct_answer":lemma,"acceptable_answers":[lemma],
       "source_attribution":"OEWN2025 exact-sense English source; ECDICT word-level evidence distinguished; original editor-authored context",
       "review_status":"BILINGUAL_SENSE_AND_ORIGINAL_KU_EDITORIAL_PENDING_INDEPENDENT_QA",
       "independent_semantic_certified":False,"release_eligible":False,"production_ready":False})
assert len(out)+len(rejected)==2 and len({x["draft_ku_id"] for x in out})==len(out)
(root/"newly_resolved_sense_ku_editorial.jsonl").write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in out),encoding="utf8")
print("NEWLY_RESOLVED_SENSE_KU_EDITORIAL_PASS",json.dumps({"new_bilingual_sense_edits":len(out),"new_original_ku":len(out),"rejected":rejected,"independent_certified":0,"production_ready":0},ensure_ascii=False))
