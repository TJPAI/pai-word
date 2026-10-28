#!/usr/bin/env python3
"""Create an integration-safe runtime: frozen base unchanged and separately keyed V2.1 staging."""
import json,gzip,pathlib,hashlib
p=pathlib.Path("tools/core20k_sense_v1/release/v2.1-rc1")
manifest=json.loads((p/"manifest.json").read_text(encoding="utf8"))
base=(p/"core20k-v206-frozen-runtime.json.gz").read_bytes()
assert hashlib.sha256(base).hexdigest()==manifest["frozen_runtime_sha256"]
with gzip.open(p/"core20k-v206-frozen-runtime.json.gz","rt",encoding="utf8") as f:runtime=json.load(f)
assert len(runtime["headwords"])==20000
read=lambda n:[json.loads(x) for x in (p/n).open(encoding="utf8")]
ss=read("v21-sense-editorial-staging.jsonl");kk=read("v21-ku-teaching-staging.jsonl");bad=read("v21-quarantined-ku.jsonl")
assert len(ss)==10 and len(kk)==11 and len(bad)==1
index={w[0]:w[1] for w in runtime["headwords"]}
for q in ss+kk:
 assert q["rank"] in index and q["lemma"]==index[q["rank"]]
 assert not q["production_ready"] and not q["release_eligible"]
assert not ({q["ku_id"] for q in kk}&{q["ku_id"] for q in bad})
pack={"schema":"pai-core20k-v21-preview-runtime-rc1","baseline":"Core20K_LongTerm_V2.0.6","base_runtime":"core20k-v206-frozen-runtime.json.gz",
"headword_count":20000,"legacy_runtime_unmodified":True,"editorial_sense_overlay_file":"v21-sense-editorial-staging.jsonl",
"teaching_ku_overlay_file":"v21-ku-teaching-staging.jsonl","quarantine_file":"v21-quarantined-ku.jsonl",
"overlay_activation":"DISABLED_BY_DEFAULT","requires_independent_qa":True,
"counts":{"sense_drafts":len(ss),"ku_drafts":len(kk),"quarantined":len(bad)}}
(p/"integration-manifest.json").write_text(json.dumps(pack,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("V21_INTEGRATION_SAFE",json.dumps(pack,ensure_ascii=False))
