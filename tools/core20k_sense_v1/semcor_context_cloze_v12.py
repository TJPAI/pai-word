#!/usr/bin/env python3
"""Produce original usage-context cloze candidates from *attested SemCor sentences*.
Only a source sentence containing target lemma as a whole word is eligible. Mark derived
rewrites and never certify semantic correctness or original literary authorship.
"""
import pathlib,json,re,collections,time
from nltk.corpus import semcor
start=time.monotonic()
found=list(pathlib.Path(".").rglob("ku_draft_allowed_v11.jsonl"));assert len(found)==1
base=found[0].parent
allowed={(r["rank"],r["sense_source_id"]):r for ln in found[0].open() if (r:=json.loads(ln)) and not r["original_contextual_ku_exists"]}
evidence=list(pathlib.Path(".").rglob("semcor_exact_sense_evidence_v8.jsonl"));assert len(evidence)==1
valid={(x["rank"],x["external_sense_id"]) for ln in evidence[0].open() if (x:=json.loads(ln))}
eligible=set(allowed)&valid
# WordNet SemCor synset linkage is validated using exact gloss+lemma, same as V8.
bygloss=collections.defaultdict(list)
for b in range(1,41):
 for ln in (base/f"batch{b:03d}.jsonl").open():
  w=json.loads(ln)
  for s in w["senses"]:
   key=(w["rank"],s["external_sense_id"])
   if key in eligible:
    normalized=lambda x:re.sub(r"[^a-z0-9]+"," ",str(x).lower()).strip()
    bygloss[(normalized(w["lemma"]),normalized(s["definition_en_source"]))].append(key)
out={};c=collections.Counter()
for sent in semcor.tagged_sents(tag="sem"):
 text=" ".join(str(z) for token in sent for z in (token.leaves() if hasattr(token,"leaves") else [token]))
 if len(text)<24 or len(text)>240:continue
 for token in sent:
  label=getattr(token,"label",lambda:None)()
  if not hasattr(label,"synset") or not hasattr(label,"name"):continue
  try:
   n=lambda x:re.sub(r"[^a-z0-9]+"," ",str(x).lower()).strip()
   matches=bygloss.get((n(label.name()),n(label.synset().definition())),[])
  except (AttributeError,ValueError,LookupError):continue
  if len(matches)!=1:continue
  key=matches[0]
  if key in out:continue
  lemma=allowed[key]["lemma"]
  pattern=re.compile(r"(?i)(?<![A-Za-z])"+re.escape(lemma)+r"(?![A-Za-z])")
  match=pattern.search(text)
  if not match:continue
  masked=text[:match.start()]+"____"+text[match.end():]
  out[key]={"rank":key[0],"lemma":lemma,"external_sense_id":key[1],
    "draft_ku_id":f"staging:semcor-cloze:{key[0]}:{key[1]}",
    "render_kind":"cloze","question":masked,"response":text[match.start():match.end()],
    "context_source":"SemCor via NLTK","context_provenance":"CORPUS_DERIVED_NOT_ORIGINAL_AUTHORED",
    "sense_alignment_method":"EXACT_LEMMA_AND_GLOSS_TO_SEMCOR",
    "zh_sense_gloss":None,"certified":False,"production_ready":False}
  c["created"]+=1
outpath=base/"semcor_context_cloze_staging_v12.jsonl"
outpath.write_text("".join(json.dumps(v,ensure_ascii=False)+"\n" for v in out.values()),encoding="utf8")
report={"eligible_source_senses":len(eligible),"new_semcor_derived_context_cloze_candidates":len(out),
"not_original_authored":True,"full_authoring_gate":len(allowed),"runtime_seconds":round(time.monotonic()-start,2),
"caveat":"SemCor-derived cloze drafts, NOT original authored KU, not licensed for production or semantically certified."}
(base/"semcor_cloze_v12_manifest.json").write_text(json.dumps(report,indent=2)+"\n")
print("SEMCOR_CLOZE_V12_PASS",json.dumps(report))
