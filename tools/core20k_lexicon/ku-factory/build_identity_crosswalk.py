#!/usr/bin/env python3
"""Auditable identity mapping from existing b500 source packs; never certifies Sense IDs."""
import collections,hashlib,json,pathlib,re
base=pathlib.Path("tools/core20k_lexicon/ku-factory/source-packs/b500")
manifest=json.loads((base/"source_manifest.json").read_text())
assert len(manifest["packs"])==40
records=[]; seen_ids=set(); ranks=[]; counts=collections.Counter()
for p in manifest["packs"]:
    raw=(base/p["path"]).read_bytes()
    assert hashlib.sha256(raw).hexdigest()==p["sha256"],p["path"]
    pack=json.loads(raw)
    assert len(pack["headwords"])==500
    for w in pack["headwords"]:
        rank=w["runtime_rank"];ranks.append(rank)
        ku_ids=[k["ku_id"] for k in w["kus"]]
        assert len(ku_ids)==len(set(ku_ids))
        assert not seen_ids.intersection(ku_ids)
        seen_ids.update(ku_ids)
        prefixes={re.sub(r"_ku[0-9]+$","",kid) for kid in ku_ids if re.search(r"_ku[0-9]+$",kid)}
        hinted=next(iter(prefixes)) if len(prefixes)==1 else None
        if hinted:counts["headword_hint_from_ku"]+=1
        elif len(prefixes)>1:counts["conflicting_headword_hints"]+=1
        sense_ku=[k["ku_id"] for k in w["kus"] if k["ku_type"]=="sense"]
        counts["existing_sense_type_ku"]+=len(sense_ku)
        counts["total_existing_ku"]+=len(ku_ids)
        if not sense_ku:counts["no_sense_type_ku"]+=1
        records.append({"runtime_rank":rank,"lemma":w["lemma"],"formal_rank_status":"B167_PRIOR_AUDIT_ONLY",
          "canonical_headword_id":None,"headword_id_hint":hinted,"headword_identity_status":"NOT_VERIFIED",
          "formal_sense_ids":[],"formal_sense_identity_status":"BLOCKED_PENDING_REVIEWED_CROSSWALK",
          "existing_ku_ids":ku_ids,"sense_typed_ku_ids":sense_ku,
          "candidate_sense_to_ku_mappings":[]})
assert ranks==list(range(1,20001))
assert len({r["lemma"].casefold() for r in records})==20000
out=base/"identity_crosswalk_provisional.jsonl"
out.write_text("".join(json.dumps(r,ensure_ascii=False,separators=(",",":"))+"\n" for r in records))
audit={"schema":"enlex-provisional-identity-crosswalk-qa-v1","status":"PASS_STRUCTURE_BLOCKED_SEMANTIC_IDENTITY",
  "source_runtime_sha256":manifest["runtime_sha256"],"headword_count":len(records),
  "unique_existing_ku_ids":len(seen_ids),"observations":dict(counts),
  "formal_headword_id_mapping_approved":0,"formal_sense_id_mapping_approved":0,
  "frozen_rank_evidence":"B167 previous full 20000-row CSV SHA and rank-lemma match audit; CSV bytes not re-read here",
  "source_sha256":hashlib.sha256(out.read_bytes()).hexdigest(),
  "production_ready":False}
(base/"identity_crosswalk_qa.json").write_text(json.dumps(audit,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(audit,ensure_ascii=False))
