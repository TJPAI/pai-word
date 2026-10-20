import fs from 'node:fs';
import {loadHomeSources} from './build-v21-home-ku-metadata.mjs';
const {core,specs,sourceHash}=await loadHomeSources();
const scenes={};
for(const s of specs){
 const ranks=core.byScene.get(s.id).map(u=>u.w.rank);
 scenes[s.id]={name:s.name,desc:s.desc,tags:s.tags,counts:{all:ranks.length,basic:ranks.filter(x=>x<=4000).length,common:ranks.filter(x=>x>4000&&x<=8000).length,advanced:ranks.filter(x=>x>8000&&x<=11000).length,high:ranks.filter(x=>x>11000).length}};
}
fs.writeFileSync('rebuild-preview/data/home-scene-index-v1.json',JSON.stringify({schema:'pai-word-v21-home-index-v1',sourceHash,scenes})+'\n');
console.log('HOME_INDEX_OK',Object.keys(scenes).length,sourceHash);
