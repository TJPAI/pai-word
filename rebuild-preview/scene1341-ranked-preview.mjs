/* Scene1341 V51–V61 experimental browser data service.
 * Independent of English Core20K Sense/KU and existing SRS.
 * No production activation; reviewed editorial content, staged app QA only.
 */
const CACHE_NAME='pai-word-scene1341-ranked-v51-v61-20261109';
const BASE=new URL('../tools/integration/scene1341-ranked/',import.meta.url);
const normalize=s=>String(s??'').normalize('NFKC').toLocaleLowerCase().trim();
export function parseRankedCsv(input){
  const text=String(input).replace(/^\uFEFF/,'');
  const lines=[];let row=[],value='',quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quoted){
      if(c==='"'&&text[i+1]==='"'){value+='"';i++;}
      else if(c==='"')quoted=false;
      else value+=c;
    }else if(c==='"')quoted=true;
    else if(c===','){row.push(value);value='';}
    else if(c==='\n'){row.push(value.replace(/\r$/,''));if(row.some(x=>x!==''))lines.push(row);row=[];value='';}
    else value+=c;
  }
  if(quoted)throw Error('RANKED_CSV_UNCLOSED_QUOTE');
  if(row.length||value){row.push(value);lines.push(row);}
  const header=lines.shift();
  if(!header?.includes('scene_id')||!header.includes('sense_zh'))throw Error('RANKED_CSV_BAD_HEADERS');
  return lines.map((cells,index)=>{
    if(cells.length!==header.length)throw Error('RANKED_CSV_BAD_COLUMNS_'+index);
    return Object.fromEntries(header.map((key,i)=>[key,cells[i]]));
  });
}
function toHex(bytes){return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
async function verifyBlob(bytes,expected){
  if(!globalThis.crypto?.subtle)throw Error('RANKED_CRYPTO_UNAVAILABLE');
  const prefix=new TextEncoder().encode('blob '+bytes.byteLength+'\0');
  const input=new Uint8Array(prefix.length+bytes.byteLength);
  input.set(prefix);input.set(new Uint8Array(bytes),prefix.length);
  const digest=toHex(await crypto.subtle.digest('SHA-1',input));
  if(digest!==expected)throw Error('RANKED_SOURCE_BLOB_MISMATCH');
}
async function requestBytes(url,fetchImpl){
  const cached=typeof caches!=='undefined'?await caches.open(CACHE_NAME).catch(()=>null):null;
  const old=cached?await cached.match(url).catch(()=>null):null;
  if(old)return old.arrayBuffer();
  const res=await fetchImpl(url);
  if(!res.ok)throw Error('RANKED_FETCH_'+res.status);
  const copy=cached?res.clone():null;
  const data=await res.arrayBuffer();
  if(cached&&copy)await cached.put(url,copy).catch(()=>{});
  return data;
}
async function removeCachedBytes(url){
  if(typeof caches==='undefined')return;
  const cache=await caches.open(CACHE_NAME).catch(()=>null);
  if(cache)await cache.delete(url).catch(()=>{});
}
export function batchForScene(sceneId){
  const match=/^SC50-(\d{4})$/.exec(String(sceneId));
  const id=match?Number(match[1]):0;
  return id>=1&&id<=110?51+Math.floor((id-1)/10):null;
}
export function createRankedStore({fetchImpl=fetch,base=BASE}={}){
  let manifest,index;
  const pending=new Map(),loaded=new Map();
  const url=file=>new URL(file,base).href;
  async function initialize(){
    if(index)return index;
    const [manifestBytes,indexBytes]=await Promise.all([requestBytes(url('manifest.json'),fetchImpl),requestBytes(url('index.json'),fetchImpl)]);
    manifest=JSON.parse(new TextDecoder().decode(manifestBytes));
    index=JSON.parse(new TextDecoder().decode(indexBytes));
    if(manifest.schema!=='pai-scene1341-ranked-recommendations-v1'||manifest.production_eligible!==false||
       manifest.scene_count!==110||manifest.record_count!==19371||manifest.files.length!==11||
       index.scenes.length!==110||index.records!==19371)throw Error('RANKED_UNVERIFIED_INDEX');
    return index;
  }
  async function batch(version){
    await initialize();
    if(!Number.isInteger(version)||version<51||version>61)throw Error('RANKED_VERSION_OUT_OF_RANGE');
    if(loaded.has(version))return loaded.get(version);
    if(pending.has(version))return pending.get(version);
    const promise=(async()=>{
      const spec=manifest.files.find(f=>f.version===version);
      if(!spec)throw Error('RANKED_VERSION_NOT_PINNED');
      const batchUrl=url('v'+version+'-ranked.csv');
      let bytes=await requestBytes(batchUrl,fetchImpl);
      try{await verifyBlob(bytes,spec.git_blob_sha);}
      catch(error){
        // Safari CacheStorage may retain an earlier or interrupted asset; never expose it.
        if(error.message!=='RANKED_SOURCE_BLOB_MISMATCH')throw error;
        await removeCachedBytes(batchUrl);
        bytes=await requestBytes(batchUrl,fetchImpl);
        await verifyBlob(bytes,spec.git_blob_sha);
      }
      const rows=parseRankedCsv(new TextDecoder().decode(bytes));
      if(rows.length!==spec.records)throw Error('RANKED_BATCH_COUNT_MISMATCH');
      const ranks=new Set();
      for(const row of rows){
        const sceneNumber=Number(row.scene_id.slice(-4)),key=row.scene_id+'|'+row.rank;
        if(batchForScene(row.scene_id)!==version||!row.expression.trim()||!row.sense_zh.trim()||
           !/^[1-9]\d*$/.test(row.rank)||ranks.has(key))throw Error('RANKED_BATCH_ROW_INVALID');
        if(!Number.isInteger(sceneNumber)||sceneNumber<1)throw Error('RANKED_SCENE_ID_INVALID');
        ranks.add(key);
      }
      loaded.set(version,rows);return rows;
    })();
    pending.set(version,promise);
    try{return await promise;}finally{pending.delete(version);}
  }
  async function scene(sceneId){
    const version=batchForScene(sceneId);
    if(version===null) return {status:'NOT_DELIVERED',sceneId,rows:[]};
    const indexData=await initialize();
    const meta=indexData.scenes.find(x=>x.scene_id===sceneId);
    if(!meta)return {status:'NOT_DELIVERED',sceneId,rows:[]};
    const rows=(await batch(version)).filter(r=>r.scene_id===sceneId)
      .sort((a,b)=>Number(a.rank)-Number(b.rank));
    if(rows.length!==meta.count)throw Error('RANKED_SCENE_COUNT_MISMATCH');
    return {status:'EDITORIAL_DELIVERED_NOT_RUNTIME',sceneId,name:meta.name,rows};
  }
  async function warmAll(onProgress=()=>{}){
    for(let v=51;v<=61;v++){await batch(v);onProgress(v-50,11);}
    return {batches:11,records:19371,offlineCached:typeof caches!=='undefined'};
  }
  return Object.freeze({initialize,batch,scene,warmAll,batchForScene,
    findScenes(query){if(!index)throw Error('RANKED_INDEX_NOT_READY');
      const q=normalize(query);return index.scenes.filter(s=>!q||normalize(s.name).includes(q)||s.scene_id.toLowerCase().includes(q));},
    get loadedBatches(){return loaded.size;},productionEligible:false,canWriteSrs:false});
}
