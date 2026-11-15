#!/usr/bin/env python3
"""V236: bulk export V190 first 3,000 source-row records into scene-first L1-L3 TEST JSON.
Input is existing committed V190 gzip shards; output files are deterministic.
No new semantic inference or QA approval.
"""
import collections,gzip,json,pathlib,sys
root=pathlib.Path(__file__).resolve().parent/"qa_reports"
dest=pathlib.Path(sys.argv[1]) if len(sys.argv)>1 else root/"v236_scene_test"
dest.mkdir(parents=True,exist_ok=True)
groups=collections.defaultdict(list)
for first,last in [(1,1000),(1001,2000),(2001,3000)]:
    name=f"CGMASTER_V190_SOURCE{first:05d}_{last:05d}_BATCH03_AUTHOR_MERGED_OVERLAY.jsonl.gz"
    with gzip.open(root/name,"rt",encoding="utf8") as fh:
        for line in fh:
            r=json.loads(line);q=r.get("question_page") or {};a=r.get("answer_page") or {}
            sid=r["scene_id"];expression=q.get("expression") or q.get("english_expression")
            cue=q.get("cue_zh") or a.get("meaning_zh")
            assert expression and cue and r.get("record_id") and sid
            examples=a.get("examples") or []
            if not examples and a.get("example_en"):
                examples=[{"example_en":a["example_en"],"example_zh":a.get("example_zh"),"source":"V190_EDITOR_DRAFT_UNREVIEWED"}]
            card={"record_id":r["record_id"],"source_final_row":r["source_final_row"],"scene_id":sid,
                  "question_page":{"expression":expression,"ipa_candidate":q.get("ipa"),"ipa_source_status":q.get("ipa_status"),"ipa_approved":False,"qa_label":"待审"},
                  "answer_page":{"expression":expression,"meaning_zh":a.get("meaning_zh") or cue,"gloss_en":a.get("gloss_en"),"pos":a.get("pos"),"examples":examples,"collocations":a.get("collocations") or [],"usage_note":a.get("usage_note"),"qa_label":"待审"},
                  "coverage_level":"L3_AUTHOR_DRAFT_UNREVIEWED" if examples else ("L2_GLOSS_CANDIDATE" if a.get("gloss_en") else "L1_SOURCE_CUE_ONLY"),
                  "source":{"v190_record_id":r["record_id"],"v190_source_row":r["source_final_row"],"schema":r.get("schema")},
                  "complete":False,"formal_ready":0,"release_allowed":False}
            groups[sid].append(card)
assert sum(map(len,groups.values()))==3000
assert len({r["record_id"] for rows in groups.values() for r in rows})==3000
for sid,rows in sorted(groups.items()):
    rows.sort(key=lambda r:r["source_final_row"])
    output={"version":"V236","scene_id":sid,"source":"CGMASTER_V190_3000_SOURCE_SAFE_AUTHOR_MERGED","record_count":len(rows),"qa_stage":"待审","release_allowed":False,"records":rows}
    (dest/f"CGMASTER_V236_{sid}_SOURCE_ROW_TEST_CARDS.json").write_text(json.dumps(output,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf8")
manifest={"version":"V236","source_rows":3000,"scene_count":len(groups),"by_scene":{sid:len(rows) for sid,rows in sorted(groups.items())},"release_allowed":False}
(dest/"CGMASTER_V236_MANIFEST.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print(json.dumps(manifest,ensure_ascii=False))
