#!/usr/bin/env python3
"""V240: expand original V172/V173/V174 IPA candidate gzip sources to scene-first L1 test cards.
Use: python tools/scene1341_master/build_v240_sc0026_0070.py
All output test-only; derived IPA (CMU/composed) is never Kaikki-native authority.
"""
import collections,gzip,hashlib,json,pathlib
P=pathlib.Path(__file__).resolve().parent/"qa_reports"
D=P/"v240_scene_test";D.mkdir(exist_ok=True)
sets=[
 ("V172",list(range(26,40)),2978,[(26,29),(30,32),(33,35),(36,39)]),
 ("V173",list(range(40,55)),2927,[(40,43),(44,47),(48,51),(52,54)]),
 ("V174",list(range(55,71)),2994,[(55,58),(59,62),(63,66),(67,70)])]
known={"V172":{"26-29":"8a0021f418b8ac1f5bfdd7b147b43f30cd7005ab8ceafd45a36ff2f2e21d0903","30-32":"a8eb421ceb36f6bf914fff8d4f06cb45fdde0b54ecd10fdd50840ec8bba955b4","33-35":"e049cb5ce2060fd3d2c2f2848d4c3a46fe1507ff156af5306d26069887460e2a","36-39":"118b8361f8a2857994ebfb520a9d1cb6eac427db88ebb06d7637908abbd4fd06"}}
expected_master="62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986"
expected_kaikki="4d03b6cba283744756c57ff661c2c6cbfe34fcf8ff513a966576cf7d97e91a99"
scene_cards=collections.defaultdict(list);seen_ids=set();seen_source=set();source_shards=[]
for v,scene_range,expected_total,ranges in sets:
  count=0
  for a,z in ranges:
    fn=f"CGMASTER_{v}_SC{a:04d}_{z:04d}_QUESTION_IPA_TEST_20261114.json.gz"
    raw=(P/fn).read_bytes()
    payload=gzip.decompress(raw)
    data=json.loads(payload)
    assert isinstance(data,dict) and isinstance(data.get("records"),list),fn
    assert data["source_master_sha256"]==expected_master,fn
    assert data["kaikki_archive_sha256"]==expected_kaikki,fn
    if v=="V172":assert hashlib.sha256(payload).hexdigest()==known[v][f"{a}-{z}"],fn
    source_shards.append({"file":fn,"rows":len(data["records"]),"gzip_sha256":hashlib.sha256(raw).hexdigest()})
    for r in data["records"]:
      sid=r["scene_id"];nr=int(sid.rsplit("-",1)[-1]);assert a<=nr<=z,(fn,sid)
      rid=r["record_id"];row=r["source_final_row"];assert rid and rid not in seen_ids,(fn,rid)
      assert row not in seen_source,(fn,row)
      seen_ids.add(rid);seen_source.add(row)
      q=r["question_page"];expr=q.get("english_expression");cue=q.get("cue_zh")
      assert expr and cue,(fn,rid)
      ipa=q.get("ipa");status=q.get("ipa_status","UNSPECIFIED_PREVIEW")
      scene_cards[sid].append({"record_id":rid,"source_final_row":row,"scene_id":sid,
        "question_page":{"expression":expr,"ipa_candidate":ipa,"ipa_source_status":status,"ipa_approved":False,"qa_label":"待审"},
        "answer_page":{"expression":expr,"meaning_zh":cue,"gloss_en":None,"examples":[],"collocations":[],"usage_note":None,"qa_label":"待审"},
        "coverage_level":"L1_SOURCE_CUE_WITH_TEST_IPA","source":{"file":fn,"native_source_archive_sha256":expected_kaikki,"pronunciation_policy":r["pronunciation_policy"]},
        "complete":False,"formal_ready":0,"release_allowed":False})
      count+=1
  assert count==expected_total,(v,count,expected_total)
  assert set(scene_cards).issuperset({f"SC50-{n:04d}" for n in scene_range}),v
assert len(scene_cards)==45,len(scene_cards)
assert len(seen_ids)==8899 and len(seen_source)==8899
for sid,rows in sorted(scene_cards.items()):
  rows.sort(key=lambda r:r["source_final_row"])
  doc={"version":"V240","scene_id":sid,"record_count":len(rows),"status":"L1_SOURCE_CUE_WITH_TEST_IPA","qa_stage":"待审","release_allowed":False,"records":rows}
  (D/f"CGMASTER_V240_{sid}_L1_TEST_PAGES.json").write_text(json.dumps(doc,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf8")
manifest={"version":"V240","source_master_sha256":expected_master,"source_archive_sha256":expected_kaikki,
 "source_records":len(seen_ids),"scene_count":len(scene_cards),"qa_stage":"待审","release_allowed":False,
 "by_scene":{s:len(r) for s,r in sorted(scene_cards.items())},"shards":source_shards}
(D/"CGMASTER_V240_MANIFEST.json").write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
print(json.dumps({"version":"V240","scenes":len(scene_cards),"rows":len(seen_ids)},ensure_ascii=False))
