#!/usr/bin/env node
// Generate canonical S001-S500 Sense-level candidate rows for Core20K V2.0.6.
// Output is ALWAYS pending review. This script never emits verified membership.
import fs from 'node:fs';
import path from 'node:path';

const BASELINE='Core20K_LongTerm_V2.0.6';
const argv=process.argv.slice(2);
const arg=name=>{const i=argv.indexOf(name);return i>=0?argv[i+1]:null};
const taxonomyPath=arg('--taxonomy')||'data/scene500-taxonomy-20x25-v1.txt';
const corePath=arg('--core');
const outPath=arg('--out')||'data/scene500-fine-candidates-v1.json';
if(!corePath)throw new Error('Usage: node scripts/generate-scene500-fine-candidates.mjs --core <core20k-sense-catalog.json> [--taxonomy ...] [--out ...]');

const taxonomyText=fs.readFileSync(taxonomyPath,'utf8');
const sceneLines=[...taxonomyText.matchAll(/^(S\d{3})\s+(.+)$/gm)].map(m=>({id:m[1],name:m[2].trim()}));
if(sceneLines.length!==500)throw new Error(`Expected 500 canonical scenes, found ${sceneLines.length}`);
for(let i=0;i<500;i++)if(sceneLines[i].id!==`S${String(i+1).padStart(3,'0')}`)throw new Error(`Scene ID discontinuity at ${i+1}: ${sceneLines[i].id}`);

const raw=JSON.parse(fs.readFileSync(corePath,'utf8'));
const words=Array.isArray(raw)?raw:(raw.words||raw.entries||[]);
if(words.length!==20000)throw new Error(`Expected Core20K 20000 words, found ${words.length}`);

function sensesOf(w){
  if(Array.isArray(w.senses))return w.senses;
  if(w.s&&typeof w.s==='object')return Object.entries(w.s).filter(([,s])=>String(s?.kuType||s?.type||'sense').toLowerCase()==='sense').map(([id,s])=>({...s,sense_id:s.sense_id||s.senseId||s.id||id,ku_id:s.ku_id||id}));
  return [];
}
function textOfSense(w,s){return [w.lemma,w.w,w.pos,s.pos,s.meaning_zh,s.zh_core,s.m,s.title_zh,s.kuTitle,s.content_zh,s.content_en,s.en_cluster].filter(Boolean).join(' ').toLowerCase()}
function tokens(s){return [...new Set(String(s||'').toLowerCase().match(/[a-z][a-z-]{2,}|[\u4e00-\u9fff]{2,}/g)||[])]}
function overlapScore(scene,w,s){
  const st=tokens(scene.name),wt=new Set(tokens(textOfSense(w,s)));
  if(!st.length)return 0;
  let hit=0;for(const t of st)if(wt.has(t))hit++;
  return hit/st.length;
}

const scenes={};
for(const scene of sceneLines){
  const candidates=[];
  for(const w of words){
    const lemma=String(w.lemma||w.w||'').trim();if(!lemma)continue;
    for(const s of sensesOf(w)){
      const score=overlapScore(scene,w,s);if(score<=0)continue;
      const senseId=String(s.sense_id||s.senseId||s.id||s.ku_id||s.kuId||'');if(!senseId)continue;
      const kuId=String(s.ku_id||s.kuId||senseId);
      candidates.push({
        word_id:String(w.word_id||w.id||w.rank||''),sense_id:senseId,ku_ids:[kuId],lemma,
        relevance_score:Number(score.toFixed(6)),scene_rank:null,
        evidence_status:'generated_draft_pending_review',review_status:'pending',binding_method:'generated_candidate'
      });
    }
  }
  candidates.sort((a,b)=>b.relevance_score-a.relevance_score||a.lemma.localeCompare(b.lemma)||a.sense_id.localeCompare(b.sense_id));
  candidates.forEach((x,i)=>x.scene_rank=i+1);
  scenes[scene.id]={name_zh:scene.name,entries:candidates};
}

const output={
  schema:'pai-word-scene500-fine-candidates-v1',baselineId:BASELINE,taxonomyId:'PAI_Word_Scene500_20x25_S001-S500',
  status:'GENERATED_CANDIDATES_PENDING_REVIEW',generatedCandidatesAutoVerified:false,membershipUnit:'sense',learningUnit:'KU',
  note:'Candidate discovery only. Lexical overlap is intentionally conservative and is not production membership evidence.',
  scenes
};
fs.mkdirSync(path.dirname(outPath),{recursive:true});
fs.writeFileSync(outPath,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({out:outPath,scenes:Object.keys(scenes).length,totalCandidates:Object.values(scenes).reduce((n,x)=>n+x.entries.length,0)},null,2));
