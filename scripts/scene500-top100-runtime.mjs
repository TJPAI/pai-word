// Canonical Scene500 Top100: V4 original order, no top-up beyond rank 100.
// Provisional KU identity can only use existing playable Core20K units.
export function applySceneTop100(core,sceneId,rows) {
 if(!/^S(?:00[1-9]|0[1-9]\d|[1-4]\d\d|500)$/.test(sceneId))throw Error('SCENE_ID');
 if(!Array.isArray(rows)||rows.length!==100)throw Error('TOP100_SIZE');
 const eligible=[],seen=new Set();let previous=0;
 for(const row of rows){
  const [sceneRank,lemma,coreRank,kuId]=row;
  if(sceneRank!==++previous||typeof lemma!=='string'||seen.has(lemma.toLowerCase()))throw Error('TOP100_ORDER');
  seen.add(lemma.toLowerCase());
  const w=core.byRank.get(coreRank);
  if(!w||w.w.toLowerCase()!==lemma.toLowerCase())throw Error('TOP100_CORE_IDENTITY:'+lemma);
  if(!kuId)continue;
  const u=core.byKU.get(kuId);
  if(!u||u.w!==w||!core.canStudy(kuId))continue;
  // Only first core Sense available: must not pretend to be scene-specific verified.
  eligible.push(u);
 }
 core.byScene.set(sceneId,eligible);
 return {scene:sceneId,candidates:100,playable:eligible.length,blocked:100-eligible.length,verifiedSceneSense:0};
}
export async function loadSceneTop100(core,sceneId,fetcher=fetch){
 const match=/^S(\d{3})$/.exec(sceneId);
 if(!match)throw Error('SCENE_ID');
 const num=Number(match[1]);if(num<1||num>500)throw Error('SCENE_ID');
 const shard=String(Math.ceil(num/25)).padStart(2,'0');
 const res=await fetcher('data/scene500-top100/top100-'+shard+'.json');
 if(!res.ok)throw Error('TOP100_HTTP_'+res.status);
 const data=await res.json();
 if(data.schema!=='pai-scene500-top100-v1'||data.reviewLevel!=='coarse_candidates_not_sense_verified')throw Error('TOP100_SCHEMA');
 return applySceneTop100(core,sceneId,data.scenes?.[sceneId]);
}
