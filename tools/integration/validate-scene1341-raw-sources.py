#!/usr/bin/env python3
"""Validate the two canonical Scene1341 CSVs; no SRS or Runtime mutations."""
import csv, hashlib, json, pathlib, sys
ROOT=pathlib.Path(sys.argv[1]) if len(sys.argv)>1 else pathlib.Path("tools/integration/scene1341-source")
SPECS={
"PAI_Word_Scene50_V1.5_Structural_Catalog.csv":("5ae9ba95eeecfd012782c51396166a5f747a428917217e05221a769bb4e30d9c",212394),
"all_1341_scene_status.csv":("bbd7c8ff92bd4f3c5e51f3d563717d3a732673a40d015d89bd578704d594b36b",127996)}
def load(name):
    data=(ROOT/name).read_bytes()
    digest,size=SPECS[name]
    assert len(data)==size and hashlib.sha256(data).hexdigest()==digest,"SOURCE_DRIFT:"+name
    with (ROOT/name).open(newline="",encoding="utf-8-sig") as f:return list(csv.DictReader(f))
a=load("PAI_Word_Scene50_V1.5_Structural_Catalog.csv")
b=load("all_1341_scene_status.csv")
assert len(a)==len(b)==1341,"COUNT_MISMATCH"
by_a={r["id"]:r for r in a}
by_b={r["scene_id"]:r for r in b}
assert len(by_a)==len(by_b)==1341 and by_a.keys()==by_b.keys(),"IDENTITY_MISMATCH"
assert all(k.startswith("SC50-") for k in by_a),"NAMESPACE_MISMATCH"
assert all(by_a[k]["revised_name"]==by_b[k]["scene_name"] for k in by_a),"NAME_MISMATCH"
assert all(by_a[k]["structural_action"]==by_b[k]["structural_action"] for k in by_a),"ACTION_MISMATCH"
assert all(int(by_a[k]["candidate_count"])==int(by_b[k]["direct_candidate_count"]) for k in by_a),"CANDIDATE_MISMATCH"
assert all(by_a[k]["gate"]=="NOT_CERTIFIED" and int(by_a[k]["certified_count"])==0 for k in by_a),"UNEXPECTED_RELEASE"
result={"status":"PASS","rows":len(a),"distinct_scene_ids":len(by_a),"certified_scene_count":0,
        "legacy_references":sum(bool(row["scene500"].strip()) for row in a),
        "renamed_scene_count":sum(row["name"]!=row["revised_name"] for row in a),
        "production_ready":False,"scene500_crosswalk_verified":False}
print(json.dumps(result,ensure_ascii=False))
