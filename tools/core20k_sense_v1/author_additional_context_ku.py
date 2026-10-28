#!/usr/bin/env python3
"""Original third contexts for 17 reviewed bilingual Sense drafts, and second contexts for nine more.
All output remains isolated staging, with unchanged frozen lexical identities.
"""
import json, pathlib, gzip
root=pathlib.Path("tools/core20k_sense_v1/release/v2.1-missing-first1000-sourced")
sources=[
 (root/"bilingual_editorial_pilot.jsonl",3,{
 "january":("The annual membership expires on the last day of ___.","一月"),
 "february":("In a leap year, ___ has twenty-nine days.","二月"),
 "april":("The cherry trees usually blossom in ___ here.","四月"),
 "june":("The school year ends in ___ before the summer holiday.","六月"),
 "september":("The university welcomes new students each ___.","九月"),
 "october":("The museum will reopen in ___, after the September renovations.","十月"),
 "november":("The harvest festival takes place in ___, just before winter.","十一月"),
 "december":("Many offices close for holidays near the end of ___.","十二月"),
 "monday":("The report is due on ___, at the start of the working week.","星期一"),
 "sunday":("The market is held every ___ morning, at the end of the week.","星期日"),
 "digitization":("The library's ___ project converted fragile manuscripts into searchable files.","将资料数字化的过程"),
 "questioner":("The moderator invited the next ___ to speak into the microphone.","提问者"),
 "discussant":("Each conference ___ was asked to comment on the presented paper.","正式讨论的参与者"),
 "roomful":("A ___ of reporters gathered to hear the announcement.","满屋子的人"),
 "humanize":("The director rewrote the dialogue to ___ the villain.","使角色显得更有人性"),
 "experienced":("Only an ___ pilot should attempt this difficult landing.","有经验的"),
 "informer":("The investigator promised to protect the identity of the ___.","向当局秘密提供消息的人")
 }),
 (root/"next13_bilingual_semantic_adjudication.jsonl",2,{
 "interesting":("Her explanation raised an ___ question about the future of cities.","引人关注的"),
 "urbane":("The host's ___ manner put the visiting diplomats at ease.","温文尔雅的"),
 "surprised":("I was genuinely ___ to hear that the plan had changed overnight.","感到惊讶的"),
 "heartbroken":("The family were ___ when their beloved dog went missing.","伤心欲绝的"),
 "recyclable":("Please separate ___ bottles from general waste.","可回收利用的"),
 "metaphoric":("In the poem, the journey is a ___ description of growing older.","隐喻性的"),
 "operationally":("The emergency center remained ___ effective throughout the storm.","在运行方面"),
 "detachable":("The backpack includes a ___ pocket that can be worn separately.","可拆卸的"),
 "sociocultural":("Researchers compared the ___ backgrounds of students in both schools.","社会文化的")
 })
]
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf8") as f:
    words=json.load(f)["headwords"]
out=[]
for filename,index,items in sources:
    rows=[json.loads(line) for line in filename.open(encoding="utf8")]
    lookup={r["lemma"]:r for r in rows}
    assert set(items)<=set(lookup)
    for lemma,(prompt,cue) in items.items():
        s=lookup[lemma]
        if "decision" in s: assert s["decision"]=="EDITORIAL_DRAFT"
        rank=s["rank"]
        assert words[rank-1][1].casefold()==lemma
        assert prompt.count("___")==1
        sid=s["oewn_sense_id"]
        gloss=s.get("gloss_zh_editorial") or s.get("editorial_gloss_zh")
        assert sid and gloss
        out.append({
          "draft_ku_id":f"staging:v21:missing:{rank}:context{index:02d}",
          "headword_id":f"core20k:rank:{rank}","rank":rank,
          "lemma":lemma,"oewn_sense_id":sid,"canonical_sense_id":None,
          "ku_type":"sense","render_kind":"guided_cloze",
          "question_instruction_zh":f"根据“{cue}”这一义项，补全英文句子。",
          "prompt":prompt,"correct_answer":lemma,
          "acceptable_answers":[lemma],"context_en":prompt.replace("___",lemma),
          "gloss_zh":gloss,"source_attribution":"OEWN 2025 exact Sense; editorial bilingual gloss; original contextual sentence",
          "editorial_status":"AI_AUTHORED_CONTEXT_PENDING_INDEPENDENT_SEMANTIC_QA",
          "independent_semantic_certified":False,
          "production_ready":False,"release_eligible":False
        })
assert len(out)==26 and len({x["draft_ku_id"] for x in out})==26
outpath=root/"additional_26_original_contextual_ku.jsonl"
outpath.write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in out),encoding="utf8")
print("ADDITIONAL_26_CONTEXT_KU_PASS",json.dumps({"new_original_ku":len(out),"independent_certified":0,"production_ready":0}))
