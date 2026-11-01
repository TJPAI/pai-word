#!/usr/bin/env python3
"""Targeted revision of 27 flagged candidates; source identity issues remain held."""
import pathlib,json,collections
B=pathlib.Path(__file__).resolve().parent; D=B/"teaching_qa/full_recognition_audit"
v1=[json.loads(x) for x in (D/"isolated_patch_v1/recognition_patch_candidates_117.jsonl").read_text().splitlines() if x.strip()]
v2=[json.loads(x) for x in (D/"isolated_patch_v2/recognition_v2_semantic_review_117.jsonl").read_text().splitlines() if x.strip()]
flags={x["review_number"] for x in v2 if x["decision"]=="REVISE_OR_SEMANTIC_CHECK"}
overrides={int(k):v for k,v in json.loads("{\"1\":[\"get\",\"depart\",\"leave\",\"return\"],\"12\":[\"hatchback\",\"limousine\",\"minivan\",\"pickup\"],\"13\":[\"limo\",\"hatchback\",\"minivan\",\"pickup\"],\"25\":[\"sledge\",\"wagon\",\"carriage\",\"snowmobile\"],\"26\":[\"accidentally\",\"spontaneously\",\"intentionally\",\"randomly\"],\"34\":[\"enumeration\",\"characterization\",\"calculation\",\"prediction\"],\"37\":[\"hesitation\",\"obedience\",\"indifference\",\"tenacity\"],\"47\":[\"calmness\",\"indifference\",\"fatigue\",\"excitement\"],\"55\":[\"rustle\",\"clank\",\"whisper\",\"squeak\"],\"58\":[\"rudely\",\"merrily\",\"silently\",\"angrily\"],\"60\":[\"flexible\",\"rigid\",\"solid\",\"rickety\"],\"65\":[\"amuse\",\"annoy\",\"provoke\",\"pacify\"],\"67\":[\"attendance\",\"austerity\",\"riser\",\"abstention\"],\"72\":[\"overture\",\"coda\",\"cantata\",\"medley\"],\"78\":[\"kidney\",\"pancreas\",\"liver\",\"testicle\"],\"80\":[\"innovative\",\"trite\",\"novel\",\"original\"],\"81\":[\"everlasting\",\"sporadic\",\"temporary\",\"intermittent\"],\"82\":[\"fleeting\",\"unending\",\"intermittent\",\"temporary\"],\"93\":[\"delirious\",\"unyielding\",\"supine\",\"agreeable\"],\"100\":[\"forebear\",\"dissenter\",\"freedman\",\"successor\"],\"107\":[\"belatedly\",\"earlier\",\"causally\",\"hereto\"],\"109\":[\"subsequently\",\"hereto\",\"analytically\",\"sooner\"],\"111\":[\"queasy\",\"wholesome\",\"chargeable\",\"passable\"],\"112\":[\"extroverted\",\"stoic\",\"animated\",\"expressionless\"],\"113\":[\"plateau\",\"canyon\",\"morass\",\"ridge\"],\"117\":[\"inspector\",\"mender\",\"designer\",\"supervisor\"]}").items()}
clues={int(k):v for k,v in json.loads("{\"54\":\"the act of watching or observing something, rather than producing or presenting it\"}").items()}
assert len(flags)==27 and set(overrides)|set(clues)==flags
result=[]
for x in v1:
 n=x["review_number"]
 if n not in flags and n not in (31,64):continue
 change=x["candidate_changes"]
 options=overrides.get(n,change["options"])
 clue=clues.get(n,change["gloss_en"])
 answer=x["original"]["response"]
 if options:
  assert len(options)==len(set(y.casefold() for y in options))==4
  assert options.index(answer)==x["original"]["options"].index(answer)
 assert n not in (31,64) or (options is None and clue is None)
 result.append({"review_number":n,"ku_id":x["ku_id"],"source":x["source"],"source_line":x["source_line"],"answer":answer,"original_options":x["original"]["options"],"candidate_options":options,"candidate_definition":clue,"status":"SOURCE_SENSE_HOLD" if n in (31,64) else "TARGETED_EDITORIAL_DRAFT","approval":"NOT_CERTIFIED","source_unchanged":True})
assert len(result)==29
O=D/"isolated_patch_v3";O.mkdir(exist_ok=True)
(O/"targeted_29.jsonl").write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in result))
summary={"targeted_rewrites":27,"sense_holds":2,"records":29,"unique_ku_ids":len({x["ku_id"] for x in result}),"semantic_certifications":0,"source_modified":False,"runtime_modified":False}
(O/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(summary))
