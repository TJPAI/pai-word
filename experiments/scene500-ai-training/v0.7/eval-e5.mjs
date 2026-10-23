#!/usr/bin/env node
/**
 * Scene500 multilingual E5 retrieval evaluation (research only).
 * Run at repository root:
 *   npm install --no-save @huggingface/transformers@^3
 *   node experiments/scene500-ai-training/v0.7/eval-e5.mjs
 *
 * IMPORTANT: Downloads ONNX model (~118 MB quantized, plus tokenizer).
 * No pretrained weights or packages are bundled. No production integration.
 * Evaluation labels are SINGLE-PASS EDITORIAL, not independently gold.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
const root = 'experiments/scene500-ai-training/';
const read = path => JSON.parse(readFileSync(path, 'utf8'));
const cases = readFileSync(root+'v0.6/unseen-evaluation-draft.jsonl','utf8')
  .trim().split(/\r?\n/).map(JSON.parse);
const catalog = read('scene500-recommendation/catalog-v0.2.json');
const catalogIds = Object.keys(catalog.scenes).sort();
if(catalogIds.length !== 500 || catalogIds[0] !== 'S001' || catalogIds[499] !== 'S500')
  throw new Error('CATALOG_MISMATCH');
const names = read(root+'v0.1/catalog.json');
const canonicalArray = Array.isArray(names) ? names : Array.isArray(names.scenes) ? names.scenes : null;
if (canonicalArray) {
  const norm = new Map(canonicalArray.map(s=>[s.id,s.name]));
  const mismatch=catalogIds.filter(id=>norm.has(id)&&norm.get(id)!==catalog.scenes[id].name);
  if (mismatch.length) throw Error('TAXONOMY_NAME_MISMATCH:'+mismatch.join(','));
}
const clamp = (items,n) => [...new Set(items.filter(Boolean))].slice(0,n);
function passage(id) {
  const s = catalog.scenes[id];
  const parts = clamp([
    s.name,
    s.description_enriched,
    ...(s.aliases||[]),
    ...(s.actions||[]),
    ...(s.objects||[]),
    ...(s.example_queries||[])
  ],12);
  // E5 requires passage/query role prefixes for retrieval.
  return 'passage: '+parts.join('；').slice(0,360);
}
const textUnits = s => (s.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*|[\u3400-\u9fff]|[0-9]|[^\s]/gu)||[]).length;
if(cases.some(x=>textUnits(x.query)<1||textUnits(x.query)>20))
  throw Error('BAD_QUERY_UNITS');
const {pipeline,env}=await import('@huggingface/transformers');
env.allowRemoteModels=true;
const started=performance.now();
const MODEL='Xenova/multilingual-e5-small';
const device=process.env.SCENE500_E5_DEVICE||'wasm';
const extractor=await pipeline('feature-extraction',MODEL,{device,dtype:'q8'});
const loadedMs=Math.round(performance.now()-started);
async function vector(text) {
 const out=await extractor(text,{pooling:'mean',normalize:true});
 return Float32Array.from(out.data);
}
const sceneEmbeds=[],passages=catalogIds.map(passage);
for(let i=0;i<passages.length;i++){
 sceneEmbeds.push(await vector(passages[i]));
 if((i+1)%100===0)process.stderr.write('encoded '+(i+1)+'/500 scenes\n');
}
const dim=sceneEmbeds[0].length;
if(!sceneEmbeds.every(x=>x.length===dim))throw Error('VECTOR_DIMENSION_MISMATCH');
function dot(a,b){let n=0;for(let i=0;i<a.length;i++)n+=a[i]*b[i];return n}
const evaluated=[];
for(const example of cases) {
 const t0=performance.now();
 const q=await vector('query: '+example.query);
 const matches=sceneEmbeds.map((v,i)=>({id:catalogIds[i],score:dot(v,q)}))
   .sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,10);
 evaluated.push({id:example.id,query:example.query,language:example.language,
   expected_scene_ids:example.expected_scene_ids,
   top10:matches.map(x=>({id:x.id,score:+x.score.toFixed(5)})),
   inferenceMs:Math.round(performance.now()-t0)});
}
const positive=evaluated.filter(x=>x.expected_scene_ids.length>0);
const empty=evaluated.filter(x=>x.expected_scene_ids.length===0);
const inTop=(e,k)=>e.top10.slice(0,k).some(x=>e.expected_scene_ids.includes(x.id));
function count(lang){const p=lang?positive.filter(x=>x.language===lang):positive;
 return {hitsAt1:p.filter(x=>inTop(x,1)).length,hitsAt5:p.filter(x=>inTop(x,5)).length,
  hitsAt10:p.filter(x=>inTop(x,10)).length,total:p.length};
}
const timings=evaluated.map(x=>x.inferenceMs).sort((a,b)=>a-b);
const result={schema:'scene500-e5-offline-evaluation-v1',model:MODEL,dtype:'q8',
  device,sceneCount:catalogIds.length,vectorDimension:dim,
  startupLoadMs:loadedMs,subjectToModelDownload:true,
  singleQueryInferenceMs:{p50:timings[Math.floor(timings.length*.5)],p95:timings[Math.floor(timings.length*.95)]},
  warning:'No independent gold labels; no calibrated no-match threshold; no deployment recommendation.',
  editorialRecall:{all:count(),zh:count('zh'),en:count('en')},
  abstention:'NOT_MEASURED: semantic similarity alone must not decide out-of-taxonomy queries',
  unknownCount:empty.length,results:evaluated};
const outPath=process.env.SCENE500_E5_REPORT||root+'v0.7/e5-results-local.json';
writeFileSync(outPath,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({report:outPath,model:MODEL,loadMs:loadedMs,
  evaluation:result.editorialRecall,timing:result.singleQueryInferenceMs,
  warning:result.warning},null,2));
