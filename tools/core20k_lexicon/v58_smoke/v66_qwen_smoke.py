#!/usr/bin/env python3
"""V66 CPU-feasibility and lexicographic generation smoke; NEVER production certification."""
import json,time,pathlib,hashlib,os
import torch
from transformers import AutoTokenizer,AutoModelForCausalLM
src=pathlib.Path("tools/core20k_lexicon/v58_smoke/real200.jsonl")
rows=[json.loads(x) for x in src.read_text(encoding="utf8").splitlines()[:8]]
assert len(rows)==8 and len({r["teaching_sense_id"] for r in rows})==8
model_id="Qwen/Qwen2.5-0.5B-Instruct"
torch.set_num_threads(2)
start=time.monotonic()
tokenizer=AutoTokenizer.from_pretrained(model_id)
model=AutoModelForCausalLM.from_pretrained(model_id,torch_dtype=torch.float32).eval()
loaded=round(time.monotonic()-start,2)
out=[]
for i,r in enumerate(rows):
    prompt=("你是英语学习词典编纂员。请准确理解下列英语单词在指定定义中的单一义项，"
            "只输出简洁、自然、准确的中文释义（不超过25个汉字），不要解释、不要编号。\n"
            f"词头：{r['lemma']}\n词性：{r['pos']}\n英文定义：{r['definition_en']}")
    msgs=[{"role":"user","content":prompt}]
    input_ids=tokenizer.apply_chat_template(msgs,tokenize=True,add_generation_prompt=True,return_tensors="pt")
    with torch.no_grad():
        tokens=model.generate(input_ids,max_new_tokens=56,do_sample=False,pad_token_id=tokenizer.eos_token_id)
    gloss=tokenizer.decode(tokens[0][input_ids.shape[-1]:],skip_special_tokens=True).strip()
    out.append({**r,"gloss_zh_qwen_candidate":gloss,"quality_status":"MACHINE_UNVERIFIED","semantic_certified":False,"production_ready":False})
    print("RESULT",i+1,r["lemma"],gloss,flush=True)
outdir=pathlib.Path("v66_results");outdir.mkdir(exist_ok=True)
blob="".join(json.dumps(x,ensure_ascii=False)+"\n" for x in out)
(outdir/"candidate_8.jsonl").write_text(blob,encoding="utf8")
assert len([json.loads(t) for t in (outdir/"candidate_8.jsonl").read_text(encoding="utf8").splitlines()])==8
report={"model":model_id,"sample":len(out),"load_sec":loaded,"total_sec":round(time.monotonic()-start,2),"machine_drafts":len(out),"certified":0}
(outdir/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2))
print("SUMMARY",json.dumps(report,ensure_ascii=False))
