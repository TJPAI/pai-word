#!/usr/bin/env python3
"""V241: convert prior V176/V178 native/CMU candidate gzip source to SC0071-0100 L1 TEST cards.
Never infer missing IDs, scene, Chinese cue, or canonical IPA. Fail if schema is incompatible.
"""
import gzip,json,pathlib,collections,hashlib
ROOT=pathlib.Path(__file__).resolve().parent/"qa_reports"
OUT=ROOT/"v241_scene_test";OUT.mkdir(exist_ok=True)
CONF=[(176,71,86,3036,[759,759,759,759]),(178,87,100,2582,[650,650,650,632])]
groups=collections.defaultdict(list);seen=set();rows_seen=set();shards=[]
def pick(r,*keys):
 for k in keys:
  v=r.get(k)
  if v is not None and v!="":return v
 return None
def decode(payload,name):
 try:
  x=json.loads(payload)
  if isinstance(x,list):return x
  if isinstance(x,dict):
   for k in ("records","rows","items"):
    if isinstance(x.get(k),list):return x[k]
  raise ValueError("missing records list")
 except json.JSONDecodeError:
  return [json.loads(line) for line in payload.decode("utf-8").splitlines() if line.strip()]
for v,start,end,n,parts in CONF:
 for part,expected in enumerate(parts,1):
  fn=f"CGMASTER_V{v}_SC{start:04d}_{end:04d}_PART{part}_KAIKKI_CMU_COMPLEMENT_20261114.json.gz"
  raw=(ROOT/fn).read_bytes();recs=decode(gzip.decompress(raw),fn)
  assert len(recs)==expected,(fn,len(recs),expected)
  shards.append({"file":fn,"count":len(recs),"sha256":hashlib.sha256(raw).hexdigest()})
  for r in recs:
   q=r.get("question_page") or {};a=r.get("answer_page") or {}
   rid=pick(r,"record_id","original_record_id_candidate")
   sid=pick(r,"scene_id")
   row=pick(r,"source_final_row")
   expr=pick(q,"english_expression","expression","word") or pick(r,"expression","english_expression","word")
   cue=pick(q,"cue_zh","meaning_zh","original_sense_zh") or pick(a,"meaning_zh","cue_zh") or pick(r,"original_sense_zh","cue_zh","meaning_zh")
   assert rid and sid and isinstance(row,int) and expr and cue,(fn,str(r)[:400])
   sn=int(sid.rsplit("-",1)[-1]);assert start<=sn<=end,(fn,sid)
   assert rid not in seen and row not in rows_seen,(fn,rid,row)
   seen.add(rid);rows_seen.add(row)
   ipa=pick(q,"ipa","ipa_candidate") or pick(r,"ipa","selected_ipa","ipa_candidate")
   st=pick(q,"ipa_status","ipa_source_status") or pick(r,"ipa_status","pronunciation_category","ipa_category") or "SOURCE_PREVIEW_UNVERIFIED"
   groups[sid].append({"record_id":rid,"source_final_row":row,"scene_id":sid,
    "question_page":{"expression":expr,"ipa_candidate":ipa,"ipa_source_status":st,"ipa_approved":False,"qa_label":"待审"},
    "answer_page":{"expression":expr,"meaning_zh":cue,"gloss_en":None,"examples":[],"collocations":[],"usage_note":None,"qa_label":"待审"},
    "coverage_level":"L1_SOURCE_CUE_WITH_TEST_IPA","source":{"file":fn,"pronunciation_policy":r.get("pronunciation_policy"),"kaikki_source_sha256":"4d03b6cba283744756c57ff661c2c6cbfe34fcf8ff513a966576cf7d97e91a99"},
    "complete":False,"formal_ready":0,"release_allowed":False})
assert len(groups)==30,len(groups)
assert len(seen)==5618,len(seen)
for sid,rs in sorted(groups.items()):
 rs.sort(key=lambda x:x["source_final_row"])
 item={"version":"V241","scene_id":sid,"record_count":len(rs),"qa_stage":"待审","release_allowed":False,"records":rs}
 (OUT/f"CGMASTER_V241_{sid}_L1_TEST_PAGES.json").write_text(json.dumps(item,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf8")
manifest={"version":"V241","scene_count":30,"source_records":5618,"by_scene":{k:len(v) for k,v in sorted(groups.items())},"shards":shards,
 "qa_stage":"待审","release_allowed":False,"note":"L1 test previews; Kaikki variants and CMU compound IPA not canonical sense IPA."}
(OUT/"CGMASTER_V241_MANIFEST.json").write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+"\n")
print("V241",len(groups),len(seen))
