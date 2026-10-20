// Home-only data access: no Core20K words, KUs, SRS or learning-runtime dependency.
const DIFFICULTIES=['all','basic','common','advanced','high'];
export function validateHomeIndex(doc){
 if(doc?.schema!=='pai-word-v21-home-index-v1'||!doc.scenes||Object.keys(doc.scenes).length!==500)throw Error('HOME_INDEX_SCHEMA');
 let total=0;
 for(let i=1;i<=500;i++){
  const id='S'+String(i).padStart(3,'0'),s=doc.scenes[id];
  if(!s||typeof s.name!=='string'||!s.name.trim()||!Array.isArray(s.tags)||!s.counts)throw Error('HOME_SCENE:'+id);
  for(const d of DIFFICULTIES)if(!Number.isInteger(s.counts[d])||s.counts[d]<0||s.counts[d]>100)throw Error('HOME_COUNT:'+id+':'+d);
  if(s.counts.all!==s.counts.basic+s.counts.common+s.counts.advanced+s.counts.high)throw Error('HOME_PARTITION:'+id);
  total+=s.counts.all;
 }
 if(total!==22227)throw Error('HOME_TOTAL:'+total);
 return doc;
}
export async function loadHomeIndex({fetcher=fetch,url='rebuild-preview/data/home-scene-index-v1.json'}={}){
 const response=await fetcher(url,{cache:'default'});
 if(!response.ok)throw Error('HOME_INDEX_HTTP:'+response.status);
 return validateHomeIndex(await response.json());
}
export function homeSceneSpecs(doc){
 return Object.entries(validateHomeIndex(doc).scenes).map(([id,s])=>({id,name:s.name,desc:s.desc,tags:s.tags}));
}
export function homeSceneCount(doc,id,difficulty='all'){
 if(!DIFFICULTIES.includes(difficulty))difficulty='all';
 return doc.scenes[id]?.counts[difficulty]??0;
}
