#!/usr/bin/env python3
"""Original third contexts for 17 reviewed bilingual Sense drafts, and second contexts for nine more.
All output remains isolated staging, with unchanged frozen lexical identities.
"""
import json, pathlib, gzip
root=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch-all")
sources=[
 (None,4,{
 "january":("The budget for ___ must be approved before the new year begins.","一月"),
 "february":("The northern city hosts its winter festival every ___.","二月"),
 "april":("The tax filing deadline falls in ___ in many countries.","四月"),
 "june":("The days are especially long in ___ near the summer solstice.","六月"),
 "september":("The exhibition opens in ___, shortly after the summer holidays.","九月"),
 "october":("The temperature often drops sharply during ___.","十月"),
 "november":("The committee will publish its report in ___, one month before December.","十一月"),
 "december":("The final examination is scheduled for ___, just before the winter break.","十二月"),
 "monday":("The laboratory is closed on weekends and reopens on ___.","星期一"),
 "sunday":("The library opens later on ___ than on weekdays.","星期日"),
 "digitization":("Researchers accelerated the ___ of handwritten archives using high-resolution scanners.","将资料数字化的过程"),
 "questioner":("The ___ requested a more precise explanation of the experimental result.","提问者"),
 "discussant":("The invited ___ challenged the author's assumptions during the symposium.","正式讨论的参与者"),
 "roomful":("The comedian entertained a ___ of delighted guests.","满屋子的人"),
 "humanize":("Small acts of kindness can ___ a character who first seems cruel.","使角色显得更有人性"),
 "experienced":("The rescue team relied on an ___ climber to lead the expedition.","有经验的"),
 "informer":("The agency verified the ___'s account before taking action.","向当局秘密提供消息的人")
 }),
 (None,3,{
 "interesting":("The scientist noticed an ___ pattern in the unexpected results.","引人关注的"),
 "urbane":("His ___ conversation made the formal dinner feel relaxed.","温文尔雅的"),
 "surprised":("The students were ___ by the announcement of an extra holiday.","感到惊讶的"),
 "heartbroken":("She felt ___ after learning that her close friend was leaving permanently.","伤心欲绝的"),
 "recyclable":("The manufacturer redesigned the container using entirely ___ materials.","可回收利用的"),
 "metaphoric":("The writer used a ___ image of a locked door to suggest isolation.","隐喻性的"),
 "operationally":("The two agencies are legally connected but ___ separate.","在运行方面"),
 "detachable":("The tablet's ___ keyboard makes it easier to carry.","可拆卸的"),
 "sociocultural":("The policy ignored important ___ differences between the communities.","社会文化的")
 })
]
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf8") as f:
    words=json.load(f)["headwords"]
evidence={r["lemma"].casefold():r for line in (root/"missing_lexical_sense_evidence.jsonl").open(encoding="utf8") for r in [json.loads(line)]}
out=[];skipped=[]
for _,index,items in sources:
    for lemma,(prompt,cue) in items.items():
        s=evidence.get(lemma)
        if not s:
            skipped.append((lemma,"NOT_IN_MISSING_COHORT"));continue
        senses=s["oewn_sense_candidates"]
        if len(senses)!=1:
            skipped.append((lemma,"MULTIPLE_OR_NO_OEWN_SENSES"));continue
        if not s["ecdict_translation_zh_wordlevel"]:
            skipped.append((lemma,"NO_BILINGUAL_SOURCE"));continue
        rank=s["rank"]
        assert words[rank-1][1].casefold()==lemma
        assert prompt.count("___")==1
        sid=senses[0]["oewn_sense_id"]
        gloss=cue
        out.append({
          "draft_ku_id":f"staging:v21:missing:{rank}:context{index:02d}",
          "headword_id":f"core20k:rank:{rank}","rank":rank,
          "lemma":lemma,"oewn_sense_id":sid,"canonical_sense_id":None,
          "ku_type":"sense","render_kind":"guided_cloze",
          "question_instruction_zh":f"根据“{cue}”这一义项，补全英文句子。",
          "prompt":prompt,"correct_answer":lemma,
          "acceptable_answers":[lemma],"context_en":prompt.replace("___",lemma),
          "gloss_zh":gloss,"source_attribution":"OEWN 2025 sole attested Sense; ECDICT bilingual word evidence; independently authored contextual sentence",
          "editorial_status":"AI_AUTHORED_CONTEXT_PENDING_INDEPENDENT_SEMANTIC_QA",
          "independent_semantic_certified":False,
          "production_ready":False,"release_eligible":False
        })
assert len(out)>0 and len({x["draft_ku_id"] for x in out})==len(out)
outpath=root/"additional_original_contextual_ku_round2.jsonl"
outpath.write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in out),encoding="utf8")
print("ADDITIONAL_ROUND2_CONTEXT_KU_PASS",json.dumps({"new_original_ku":len(out),"skipped_ambiguous":skipped,"independent_certified":0,"production_ready":0}))
