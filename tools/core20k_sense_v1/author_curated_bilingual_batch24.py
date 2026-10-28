#!/usr/bin/env python3
"""AI-authored bilingual Sense glosses and original contextual cloze KUs grounded in exact OEWN records.
No automatic word-level Chinese-to-polysemy assignment; not independently certified.
"""
import json,pathlib,gzip
root=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
batchroot=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
entries=json.loads(r'''{"opulence":["奢华","The palace reflected extraordinary ___.","奢华"],"midline":["正中线","The surgeon marked the body's ___.","正中线"],"generalist":["通才","The team needed a ___ with broad knowledge.","通才"],"abhorrent":["令人憎恶的","The committee condemned the ___ practice.","憎恶"],"disservice":["帮倒忙","Spreading rumors would do the community a ___.","帮倒忙"],"viewable":["可观看的","The exhibit is ___ online.","可观看"],"sardonically":["讥讽地","He smiled ___ at the claim.","讥讽"],"tacitly":["默许地","The managers ___ approved the change.","默许"],"erratically":["不规律地","The sensor readings fluctuated ___.","不规律"],"mayoral":["市长的","The candidate entered the ___ election.","市长"],"untamed":["未驯化的","Wild horses crossed the ___ valley.","未驯化"],"unharmed":["安然无恙的","The hikers returned ___.","安然无恙"],"derisively":["嘲讽地","The audience laughed ___ at the proposal.","嘲讽"],"dishearten":["使灰心","One setback should not ___ the team.","灰心"],"unremarkable":["平凡的","The scans showed an ___ result.","平凡"],"agreeably":["令人愉快地","They chatted ___ throughout the journey.","愉快"],"insincere":["不真诚的","His apology sounded ___.","不真诚"],"uninhabited":["无人居住的","They approached an ___ island.","无人居住"],"portend":["预示","The dark clouds seemed to ___ a storm.","预示"],"credo":["信条","The organization's ___ emphasized service.","信条"],"allegorical":["寓言式的","The novel contains an ___ story.","寓言"],"hanker":["渴望","She began to ___ for home.","渴望"],"outlandish":["离奇的","He proposed an ___ solution.","离奇"],"venison":["鹿肉","The restaurant served roasted ___.","鹿肉"],"celebratory":["庆祝的","They gathered for a ___ dinner.","庆祝"],"steamship":["蒸汽船","The old ___ crossed the Atlantic.","蒸汽船"],"overvalue":["高估","Investors sometimes ___ companies.","高估"],"idiomatic":["地道的","The teacher recommended ___ expressions.","地道"],"dreamily":["出神地","She stared ___ out of the window.","出神"],"doctrinal":["教义的","The disagreement concerned ___ questions.","教义"]}''')
allowed={r["lemma"]:r for line in (root/"next500_uncovered_source_cards.jsonl").open(encoding="utf8") for r in [json.loads(line)]}
excluded=[lemma for lemma in entries if lemma not in allowed]
entries={lemma:value for lemma,value in entries.items() if lemma in allowed}
assert entries, "No current deduplicated source entries"
index=json.loads((batchroot/"index.json").read_text())
by_lemma={}
for b in index["batches"]:
    f=batchroot/("batch%03d"%b["batch"])/"bilingual_ku_editorial_candidates.jsonl"
    for line in f.open(encoding="utf8"):
        r=json.loads(line)
        if r["lemma"] in entries and r["editing_state"]=="EDITORIAL_SINGLE_GLOSS_CANDIDATE":
            by_lemma.setdefault(r["lemma"],[]).append(r)
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf8") as f:
    words=json.load(f)["headwords"]
out=[];skipped={}
for lemma,(zh,prompt,cue) in entries.items():
    candidates=by_lemma.get(lemma,[])
    if len(candidates)!=1:
        skipped[lemma]="NOT_EXACTLY_ONE_LOW_RISK_SOURCE";continue
    r=candidates[0];rank=r["rank"]
    assert allowed[lemma]["rank"]==rank and allowed[lemma]["oewn_sense_id"]==r["oewn_sense_id"]
    assert words[rank-1][1].casefold()==lemma and prompt.count("___")==1
    response=lemma.title() if lemma in {"october","january","june","february","november","december","september","april","monday"} else lemma
    out.append({"draft_sense_id":f"staging:v21:bilingual:{rank}:{r['oewn_sense_id']}",
      "headword_id":f"core20k:rank:{rank}","rank":rank,"lemma":lemma,
      "oewn_sense_id":r["oewn_sense_id"],"definition_en_source":r["definition_en"],
      "gloss_zh_editorial":zh,"ecdict_wordlevel_reference":r["translation_zh_wordlevel_source"],
      "draft_ku_id":f"staging:v21:missing:{rank}:editorial24",
      "ku_type":"sense","render_kind":"guided_cloze",
      "question_instruction_zh":f"根据“{cue}”补全英文句子。",
      "prompt":prompt,"context_en":prompt.replace("___",response),
      "correct_answer":response,"acceptable_answers":[response],
      "source_attribution":"OEWN2025 exact Sense + ECDICT word-level evidence + original AI editorial context",
      "review_status":"AI_BILINGUAL_EDITORIAL_NEEDS_INDEPENDENT_SEMANTIC_AND_ASSESSMENT_QA",
      "independent_semantic_certified":False,"release_eligible":False,"production_ready":False})
assert len(out)>0 and len({x["draft_ku_id"] for x in out})==len(out)
dest=root/"bilingual_sense_ku_curated_batch24.jsonl"
dest.write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in out),encoding="utf8")
print("BILINGUAL_CURATED_BATCH24_PASS",json.dumps({"authored":len(entries),"new_bilingual_editorial_senses":len(out),"new_original_context_kus":len(out),"skipped":skipped,"independent_certified":0,"production_ready":0},ensure_ascii=False))
