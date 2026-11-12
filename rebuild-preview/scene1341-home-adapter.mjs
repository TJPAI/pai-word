/* Scene1341 catalog adapter for the existing PAI Word homepage.
 * Reuses the current home search UX; does not create study queues or write SRS.
 * Editorial expressions are distinct from frozen Core20K teaching KU.
 */
import {createRankedStore} from './scene1341-ranked-preview.mjs';

const BASE=new URL('../tools/integration/scene1341-source/',import.meta.url);
const normalize=s=>String(s??'').normalize('NFKC').toLowerCase().trim().replace(/[，。！？、,.;:!?]/g,' ').replace(/\s+/g,' ');
export function parseSceneCatalogCsv(text){
  const rows=[];let row=[],cell='',quoted=false;
  const content=String(text).replace(/^\uFEFF/,'');
  for(let i=0;i<content.length;i++){
    const ch=content[i];
    if(quoted){if(ch==='"'&&content[i+1]==='"'){cell+='"';i++;}else if(ch==='"'){quoted=false;}else cell+=ch;}
    else if(ch==='"')quoted=true;
    else if(ch===','){row.push(cell);cell='';}
    else if(ch==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}
    else cell+=ch;
  }
  if(quoted)throw Error('SCENE1341_CATALOG_QUOTE_INVALID');
  if(row.length||cell){row.push(cell);rows.push(row);}
  const columns=rows.shift();
  if(!columns||!['id','revised_name','category','gate'].every(k=>columns.includes(k)))
    throw Error('SCENE1341_CATALOG_SCHEMA_INVALID');
  return rows.filter(r=>r.some(Boolean)).map(r=>{
    if(r.length!==columns.length)throw Error('SCENE1341_CATALOG_COLUMNS_INVALID');
    return Object.fromEntries(columns.map((c,i)=>[c,r[i]]));
  });
}
export function createScene1341HomeCatalog({fetchImpl=fetch,ranked=createRankedStore()}={}){
  let pending=null,catalog=null;
  async function initialize(){
    if(catalog)return catalog;
    if(pending)return pending;
    pending=(async()=>{
      const [raw,index]=await Promise.all([
        fetchImpl(new URL('PAI_Word_Scene50_V1.5_Structural_Catalog.csv',BASE)),
        ranked.initialize()
      ]);
      if(!raw.ok)throw Error('SCENE1341_CATALOG_HTTP_'+raw.status);
      const rows=parseSceneCatalogCsv(await raw.text());
      if(rows.length!==1341||index.scenes.length!==110)throw Error('SCENE1341_CATALOG_COUNT_INVALID');
      const delivered=new Map(index.scenes.map(x=>[x.scene_id,x]));
      const scenes=rows.map(r=>{
        if(!/^SC50-\d{4}$/.test(r.id))throw Error('SCENE1341_CATALOG_ID_INVALID');
        const linked=delivered.get(r.id);
        return Object.freeze({id:r.id,name:r.revised_name,category:r.category,
          sourceCount:linked?.count??0,
          recommendationStatus:linked?'EDITORIAL_DELIVERED':'NOT_DELIVERED',
          studyStatus:'KU_NOT_CONNECTED',
          searchText:normalize([r.id,r.revised_name,r.category].join(' '))});
      });
      if(new Set(scenes.map(x=>x.id)).size!==1341)throw Error('SCENE1341_CATALOG_DUPLICATE');
      catalog=Object.freeze({version:'SCENE1341-V51-V61-STAGING',scenes:Object.freeze(scenes)});
      return catalog;
    })();
    try{return await pending;}finally{pending=null;}
  }
  // On-demand, source-verified lexical search over the 110 delivered scenes.
  // Never equate lexical hits with CG-QA approved Sense/KU or SRS permission.
  let lexical=null,lexicalPending=null;
  async function lexicalIndex(){
    if(lexical)return lexical;
    if(lexicalPending)return lexicalPending;
    lexicalPending=(async()=>{
      const rows=[];
      // Browser loader verifies each CSV against its Git blob before exposing rows.
      for(let v=51;v<=61;v++)rows.push(...await ranked.batch(v));
      if(rows.length!==19371)throw Error('SCENE1341_LEXICAL_COUNT_INVALID');
      const byScene=new Map();
      for(const row of rows){
        if(!/^SC50-\d{4}$/.test(row.scene_id)||!row.expression?.trim()||!row.sense_zh?.trim())
          throw Error('SCENE1341_LEXICAL_SOURCE_INVALID');
        const entry=byScene.get(row.scene_id)||[];
        entry.push(Object.freeze({expression:normalize(row.expression),gloss:normalize(row.sense_zh),
          sourceSenseId:row.sense_id}));
        byScene.set(row.scene_id,entry);
      }
      lexical=byScene;return lexical;
    })();
    try{return await lexicalPending}finally{lexicalPending=null}
  }
  async function search(text,{limit=10}={}){
    const {scenes}=await initialize();
    const q=normalize(text);
    if(!q)return [];
    if(!Number.isInteger(limit)||limit<1||limit>100)throw Error('SCENE1341_SEARCH_LIMIT_INVALID');
    const tokens=q.match(/[a-z]+(?:'[a-z]+)?|[\p{Script=Han}]+/gu)||[];
    // Source is available on demand, never silently fail over to an unverified index.
    const byScene=await lexicalIndex();
    return scenes.map(scene=>{
      const title=normalize(scene.name);
      let score=title===q||scene.id.toLowerCase()===q?240:
        title.includes(q)?165:scene.searchText.includes(q)?115:
        tokens.length&&tokens.every(t=>scene.searchText.includes(t))?75:0;
      let evidence=score?'SCENE_CATALOG':'NONE',matchingSenseId=null;
      for(const row of byScene.get(scene.id)||[]){
        const en=row.expression,zh=row.gloss;
        const field=en+' '+zh;
        const matched=en===q?205:zh===q?185:
          en.includes(q)?145:zh.includes(q)?130:
          tokens.length&&tokens.every(t=>field.includes(t))?95:0;
        if(matched>score){
          score=matched;evidence='RANKED_LEXICAL_UNREVIEWED';
          matchingSenseId=row.sourceSenseId;
        }
      }
      return {scene,score,evidence,matchingSenseId};
    }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||
      a.scene.id.localeCompare(b.scene.id))
      .slice(0,limit).map(({scene,evidence,matchingSenseId})=>Object.freeze({...scene,
        searchEvidence:evidence,matchingSenseId,
        cg_qa:evidence==='RANKED_LEXICAL_UNREVIEWED'?'NOT_REVIEWED_FOR_THIS_INDEX':null,
        muse_qa:'DEFERRED_QUOTA_20261113',
        release_status:'BLOCKED_PENDING_CG_QA_AND_MUSE',
        production_release_allowed:false}));
  }
  async function getScene(id){
    const {scenes}=await initialize();
    return scenes.find(s=>s.id===id)||null;
  }
  async function expressions(id){
    const scene=await getScene(id);
    if(!scene)return {status:'UNKNOWN_SCENE',rows:[]};
    if(scene.recommendationStatus==='NOT_DELIVERED')return {status:'NOT_DELIVERED',rows:[],scene};
    const result=await ranked.scene(id);
    return {...result,scene};
  }
  return Object.freeze({initialize,search,getScene,expressions,
    releaseEligible:false,canCreateStudyQueue:false,canWriteSrs:false,
    get ready(){return !!catalog;}});
}
