#!/usr/bin/env python3
"""Produce V230 preview pages from V229 native Kaikki candidate JSON.
Usage: python tools/scene1341_master/build_v230_single_sense_preview.py input_v229.json output_v230.json
No QA approval is implied by a unique native sense.
"""
import json,sys
src=json.load(open(sys.argv[1],encoding="utf-8"))
out={"version":"V230","scope":"SC50-0001..0005","status":"UNREVIEWED_TEST_PREVIEW_ONLY","scene_records":{},"total":0,"native_examples":0,"with_ipa":0,"qa_stage":"待审","release_allowed":False}
abbr={"noun":"n.","verb":"v.","adj":"adj.","adjective":"adj.","adv":"adv.","adverb":"adv.","phrase":"phr."}
for scene,records in src["scenes"].items():
    dest=out["scene_records"][scene]=[]
    for r in records:
        if r["native_sense_status"]!="SINGLE_NATIVE_SENSE_CANDIDATE": continue
        assert len(r["native_candidates"])==1 and len(r["native_candidates"][0]["senses"])==1
        n=r["native_candidates"][0];s=n["senses"][0];ipa=n.get("ipa_candidates",[]);ex=s.get("examples_en",[])
        pos=n["pos"];meaning=abbr.get(pos,pos+".")+" "+r["cue_zh"]
        dest.append({"record_id":r["record_id"],"source_final_row":r["source_final_row"],"scene_id":scene,
          "question_page":{"expression":r["expression"],"ipa_candidate":ipa[0] if len(ipa)==1 else None,"ipa_candidates":ipa,"ipa_approved":False,"qa_label":"待审"},
          "answer_page":{"expression":r["expression"],"meaning_display":meaning,"gloss_en":(s.get("glosses") or [None])[0],
            "examples":[{"en":e,"zh":None,"origin":"KAIKKI_NATIVE_EXAMPLE_UNTRANSLATED"} for e in ex],
            "collocations":[],"usage_note":None,"qa_label":"待审"},
          "source":{"kaikki_native_line":n["native_source_line"],"sense_index":s["native_sense_index"],"pos":pos},
          "complete":False,"formal_ready":0,"release_allowed":False})
        out["total"]+=1;out["native_examples"]+=len(ex);out["with_ipa"]+=bool(ipa)
assert out["total"]==127, out["total"]
with open(sys.argv[2],"w",encoding="utf-8") as f:json.dump(out,f,ensure_ascii=False,indent=2)
print({k:len(v) for k,v in out["scene_records"].items()},out["native_examples"],out["with_ipa"])
