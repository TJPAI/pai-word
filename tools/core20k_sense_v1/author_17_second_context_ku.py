#!/usr/bin/env python3
"""Add a second, independently authored contextual practice item per each of 17 bilingual Sense drafts."""
import json,pathlib,gzip,collections
root=pathlib.Path("tools/core20k_sense_v1/release/v2.1-missing-first1000-sourced")
data=[json.loads(x) for x in (root/"bilingual_editorial_pilot.jsonl").open(encoding="utf8")]
questions={"digitization":{"prompt":"The ___ of old photographs made them easier to archive.","cue":"将照片转成数字形式"},"questioner":{"prompt":"The ___ asked the speaker to clarify her answer.","cue":"提出问题的人"},"discussant":{"prompt":"A ___ responded to the research paper during the panel.","cue":"正式讨论中的参与者"},"humanize":{"prompt":"The new rules aim to ___ the treatment of patients.","cue":"使待遇更有人情味"},"experienced":{"prompt":"An ___ technician repaired the machine safely.","cue":"经验丰富的"},"informer":{"prompt":"An anonymous ___ provided the police with a useful tip.","cue":"向警方提供秘密消息的人"},"roomful":{"prompt":"A ___ of visitors gathered for the exhibition.","cue":"满屋子的人"},"monday":{"prompt":"The next class is on ___, the day after Sunday.","cue":"星期一"},"sunday":{"prompt":"We will meet on ___, the day after Saturday.","cue":"星期日"},"january":{"prompt":"The calendar begins with ___, the first month.","cue":"一月"},"february":{"prompt":"The calendar lists ___ as its second month.","cue":"二月"},"april":{"prompt":"The fourth month of the year is ___.","cue":"四月"},"june":{"prompt":"The sixth month of the year is ___.","cue":"六月"},"september":{"prompt":"The ninth month of the year is ___.","cue":"九月"},"october":{"prompt":"The tenth month of the year is ___.","cue":"十月"},"november":{"prompt":"The eleventh month of the year is ___.","cue":"十一月"},"december":{"prompt":"The twelfth month of the year is ___.","cue":"十二月"}}
assert len(data)==len(questions)==17
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf8") as f:words=json.load(f)["headwords"]
out=[];known=set()
for s in data:
 lemma=s["lemma"];rank=s["rank"];q=questions[lemma]
 assert words[rank-1][1].casefold()==lemma and q["prompt"].count("___")==1
 key=f"staging:v21:missing:{rank}:context02"
 assert key not in known;known.add(key)
 out.append({"draft_ku_id":key,"rank":rank,"headword_id":s["headword_id"],"lemma":lemma,
 "external_sense_id":s["oewn_sense_id"],"canonical_sense_id":None,
 "render_kind":"guided_cloze","prompt":q["prompt"],"question_instruction_zh":q["cue"]+"：请填写对应英文单词。",
 "correct_answer":lemma,"acceptable_answers":[lemma],"context_en":q["prompt"].replace("___",lemma),
 "gloss_zh":s["gloss_zh_editorial"],"gloss_en":s["gloss_en"],
 "review_status":"NEW_CONTEXT02_PENDING_INDEPENDENT_BILINGUAL_AND_ASSESSMENT_QA",
 "source_attribution":"OEWN2025 Sense + ECDICT word-level evidence + original editorial context",
 "release_eligible":False,"production_ready":False})
assert len(out)==17
with (root/"bilingual_editorial_17_second_context_ku.jsonl").open("w",encoding="utf8") as f:
 for r in out:f.write(json.dumps(r,ensure_ascii=False)+"\n")
print("SECOND_CONTEXT17_PASS",json.dumps({"new_second_context_ku_drafts":len(out),"production_ready":0}))
