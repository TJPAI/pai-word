// Scene1341 isolated bilingual lexical candidate ranker. Never a semantic certification or Runtime asset.
import {hypotheses,matchIntentHypotheses} from './scene1341-experimental-intent-aliases.mjs';
const normalize=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").trim();
const english=s=>normalize(s).match(/[a-z]+(?:'[a-z]+)?|[0-9]+/g)||[];
const han=s=>normalize(s).match(/[\p{Script=Han}]+/gu)||[];
function grams(s){const out=[];for(const run of han(s)){if(run.length===1)out.push(run);else for(let i=0;i<run.length-1;i++)out.push(run.slice(i,i+2));}return out;}
export function csv(data){const rows=[];let row=[],f='',quoted=false;data=String(data).replace(/^\uFEFF/,'');for(let i=0;i<data.length;i++){const c=data[i];if(c==='"'){if(quoted&&data[i+1]==='"'){f+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(f);f='';}else if((c==='\r'||c==='\n')&&!quoted){if(c==='\r'&&data[i+1]==='\n')i++;row.push(f);if(row.some(Boolean))rows.push(row);row=[];f='';}else f+=c;}if(quoted)throw Error('UNTERMINATED_CSV_QUOTE');if(row.length||f){row.push(f);rows.push(row);}const header=rows.shift();if(!header)throw Error('EMPTY_CSV');const unique=new Set(header);if(unique.size!==header.length)throw Error('DUPLICATE_CSV_COLUMNS');return rows.map((v,i)=>{if(v.length!==header.length)throw Error('BAD_CSV_WIDTH row '+(i+2));return Object.fromEntries(header.map((k,j)=>[k,v[j]]));});}
const tokens=s=>[...new Set([...english(s).filter(x=>x.length>1),...grams(s)])];
// Delimit contrasted positive clauses before scanning negative spans; do not swallow 只是/而是 intentions.
export function negatedSpans(query){
 const q=normalize(query).replace(/(只是|而是|但是|不过|\\bbut\\b|\\brather\\b)/giu,'，$1');
 const re=/(?:不是|不要|不想|而非|并非|\\bnot\\b|instead of)\\s*([\\p{Script=Han}a-z\\s]{1,18})/giu;
 return [...q.matchAll(re)].map(m=>m[1].trim()).filter(Boolean);
}

export function buildCatalog(catalogCsv,rankedCsvFiles,{sourceCommit,manifestSha}={}){
 if(!/^[0-9a-f]{40}$/.test(sourceCommit||''))throw Error('PINNED_SOURCE_COMMIT_REQUIRED');
 if(!/^[0-9a-f]{40}$/.test(manifestSha||''))throw Error('PINNED_MANIFEST_BLOB_REQUIRED');
 const catalog=csv(catalogCsv),scenes=new Map(),exprs=new Map();if(catalog.length!==1341)throw Error('EXPECTED_1341_SCENES');
 for(const r of catalog){if(!/^SC50-\d{4}$/.test(r.id)||scenes.has(r.id))throw Error('INVALID_SCENE_ID '+r.id);scenes.set(r.id,{scene_id:r.id,name:r.revised_name||r.name,category:r.category,has_ranked_data:false,record_count:0});}
 if(rankedCsvFiles.length!==11)throw Error('EXPECTED_11_RANKED_FILES');let total=0;const sourceSenseIds=new Set(),sceneRankIds=new Set();
 for(const blob of rankedCsvFiles){for(const r of csv(blob)){if(!scenes.has(r.scene_id))throw Error('UNKNOWN_SCENE '+r.scene_id);if(!r.expression?.trim()||!r.sense_zh?.trim()||!/^(?:SC-SENSE-\d+|SC50-\d{4}-\d{4})$/.test(r.sense_id))throw Error('BAD_RANKED_SOURCE');if(sourceSenseIds.has(r.sense_id))throw Error('DUPLICATE_SOURCE_SENSE');sourceSenseIds.add(r.sense_id);const rank=Number(r.rank),rk=r.scene_id+':'+r.rank;if(!Number.isInteger(rank)||rank<1||sceneRankIds.has(rk))throw Error('DUPLICATE_OR_BAD_RANK '+rk);sceneRankIds.add(rk);const scene=scenes.get(r.scene_id);if(normalize(scene.name)!==normalize(r.scene_name))throw Error('SCENE_NAME_MISMATCH '+r.scene_id);scene.record_count++;scene.has_ranked_data=true;if(!exprs.has(r.scene_id))exprs.set(r.scene_id,[]);exprs.get(r.scene_id).push({source_sense_id:r.sense_id,expression:r.expression,meaning:r.sense_zh,rank,tier:r.tier,terms:tokens(r.expression+' '+r.sense_zh)});total++;}}
 if(total!==19371||[...scenes.values()].filter(s=>s.has_ranked_data).length!==110)throw Error('RANKED_COUNTS_MISMATCH');
 for(const h of hypotheses){const entry=exprs.get(h.scene_id)?.find(x=>x.source_sense_id===h.source_sense_id);if(!entry||entry.expression!==h.source_expression||entry.meaning!==h.source_meaning)throw Error('EXPERIMENTAL_ALIAS_ANCHOR_MISMATCH '+h.id);}
 const documentFrequency=new Map();for(const [sid,rows] of exprs){const ts=new Set();for(const row of rows)for(const t of row.terms)ts.add(t);for(const t of ts)documentFrequency.set(t,(documentFrequency.get(t)||0)+1);}
 const titleTerms=new Map([...scenes].map(([id,s])=>[id,tokens(s.name+' '+s.category)]));
 function search(query,{limit=10,experimentalIntentAliases=false}={}){
   const q=normalize(query);if(!q)return [];const qt=tokens(q);if(!qt.length)return [];
   const negSpans=negatedSpans(q),negative=new Set();for(const span of negSpans)for(const t of tokens(span))negative.add(t);
   const positive=qt.filter(t=>!negative.has(t));if(!positive.length)return [];
   const activeHints=experimentalIntentAliases?matchIntentHypotheses(query):[];
   const ranked=[];
   for(const [id,scene] of scenes){
     let score=0;const reasons=[];const title=titleTerms.get(id),name=normalize(scene.name);
     if(q===normalize(id)||q===name){score+=100;reasons.push('exact_scene');}
     if(q.includes(name)&&name.length>1&&!negSpans.some(span=>span.includes(name))){score+=38;reasons.push('scene_title_phrase');}
     for(const t of positive){if(title.includes(t)){score+=Math.min(8,2.5+2/(documentFrequency.get(t)||1));reasons.push('title_token');}}
     if(scene.has_ranked_data){
       let best=0,bestId=null;for(const row of exprs.get(id)){
         let hit=0;const e=normalize(row.expression),zh=normalize(row.meaning);
         if(q===e||q===zh)hit=16;else if(e.length>2&&q.includes(e)&&!negSpans.some(span=>span.includes(e)))hit=12;else if(zh.length>1&&q.includes(zh)&&!negSpans.some(span=>span.includes(zh)))hit=10;
         for(const t of positive){if(row.terms.includes(t)){const df=documentFrequency.get(t)||1;hit+=Math.min(3.2,1.8/Math.sqrt(df))+0.1;}}
         if(hit>best){best=hit;bestId=row.source_sense_id;}
       }
       if(best>0){score+=Math.min(24,best);reasons.push('unverified_ranked_expression_match');}
       if(bestId&&score>0)reasons.push('matched_source_sense:'+bestId);
     }
     // Avoid lexical evidence leakage from explicit negation into ranking.
     if(negative.size){for(const t of negative)if(title.includes(t))score=Math.max(0,score-12);}
     for(const h of activeHints){if(h.scene_id===id){score+=h.weight;reasons.push('EXPERIMENTAL_UNCERTIFIED_INTENT:'+h.id+':'+h.source_sense_id);}}
     if(score>0)ranked.push({scene_id:id,name:scene.name,score:Math.round(score*1000)/1000,has_ranked_data:scene.has_ranked_data,ranked_records:scene.record_count,cg_qa:'NOT_REVIEWED_FOR_THIS_INDEX',muse_qa:'DEFERRED_QUOTA_20261113',release_status:'BLOCKED_PENDING_CG_QA_AND_MUSE',muse_recheck_required:true,explanations:[...new Set(reasons)],provenance:{source_commit:sourceCommit,ranked_manifest_blob:manifestSha}});
   }
   return ranked.sort((a,b)=>b.score-a.score||a.scene_id.localeCompare(b.scene_id)).slice(0,Math.max(1,Math.min(10,Math.floor(limit)||10)));
 }
 return {schema:'pai-scene1341-rec-isolated-v0.1',sourceCommit,manifestSha,sceneCount:scenes.size,rankedSceneCount:110,expressionCount:total,certifiedCount:0,production_eligible:false,release_allowed:false,search};
}
