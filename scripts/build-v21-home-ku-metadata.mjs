// Use the production adapter and Top100 validator, not a second eligibility rule.
import fs from 'node:fs';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {buildCore20KRuntime} from './core20k-unified-runtime-adapter.mjs';
import {installScene500Top100} from './scene500-top100-loader.mjs';
export async function loadHomeSources(){
 const hash=crypto.createHash('sha256');
 const read=p=>{const b=fs.readFileSync(p);hash.update(p).update(b);return b};
 const core=buildCore20KRuntime(JSON.parse(zlib.gunzipSync(read('data/core20k-runtime.json.gz'))));
 globalThis.window={PAI_CORE:core,PAI_CORE_QA:{release:'Core20K-dev'}};
 globalThis.SCENES={daily:'每日学习'};
 await installScene500Top100({fetcher:async p=>{const b=read(p);return {ok:true,text:async()=>b.toString(),json:async()=>JSON.parse(b)}}});
 await window.PAI_SCENE500_TOP100_READY;
 return {core,specs:window.PAI_SCENE500.specs,sourceHash:hash.digest('hex')};
}
export async function buildHomeMetadata(){
 const {core,specs,sourceHash}=await loadHomeSources();
 const occurrences=new Map();
 for(const [scene,units] of core.byScene)if(scene!=='daily')for(const u of units)occurrences.set(u.k,(occurrences.get(u.k)||0)+1);
 // entries: all active KU IDs (including existing non-playable SRS records).
 // words: playable IDs in original primary order, needed for exact reinforcement.
 const payload={schema:'pai-word-v21-home-ku-metadata-v1',coreRelease:'Core20K-dev',sceneRelease:'SceneRank500-V4',sourceHash,headwords:core.words.length,sceneCount:specs.length,top100Candidates:50000,top100Entries:22227,playableKU:core.qa.playableSense,
 entries:[...core.byKU.keys()],words:core.words.filter(w=>Object.values(w.s).some(s=>s.playable)).map(w=>[w.rank,Object.keys(w.s).filter(k=>w.s[k].playable)]),sceneOccurrences:[...occurrences].sort((a,b)=>a[0].localeCompare(b[0]))};
 fs.writeFileSync('rebuild-preview/data/home-ku-metadata-v1.json',JSON.stringify(payload)+'\n');
 console.log('HOME_KU_METADATA_OK',{...core.qa,scenes:specs.length,candidates:50000,eligible:22227,sourceHash});
 return payload;
}
if(process.argv[1]===fileURLToPath(import.meta.url))await buildHomeMetadata();
