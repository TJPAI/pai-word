#!/usr/bin/env node
import fs from 'node:fs';

const path='data/scene500-taxonomy-20x25-v1.txt';
const text=fs.readFileSync(path,'utf8');
const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
const categories=[];
const scenes=[];
let current=null;
for(const line of lines){
  let m=line.match(/^(\d{2})\s+(.+)$/);
  if(m && !line.startsWith('S')){
    current={index:Number(m[1]),nameZh:m[2],sceneIds:[]};
    categories.push(current);
    continue;
  }
  m=line.match(/^(S\d{3})\s+(.+)$/);
  if(m){
    if(!current)throw new Error(`Scene before category: ${line}`);
    const index=Number(m[1].slice(1));
    const row={id:m[1],index,nameZh:m[2],categoryIndex:current.index};
    scenes.push(row);current.sceneIds.push(row.id);
  }
}
if(categories.length!==20)throw new Error(`Expected 20 categories, got ${categories.length}`);
if(scenes.length!==500)throw new Error(`Expected 500 scenes, got ${scenes.length}`);
for(let i=0;i<500;i++){
  const expected=`S${String(i+1).padStart(3,'0')}`;
  if(scenes[i]?.id!==expected)throw new Error(`Scene sequence mismatch at ${i+1}: expected ${expected}, got ${scenes[i]?.id}`);
}
for(const c of categories){
  if(c.sceneIds.length!==25)throw new Error(`Category ${c.index} has ${c.sceneIds.length} scenes, expected 25`);
}
const names=new Set();
for(const s of scenes){
  if(!s.nameZh)throw new Error(`Blank name: ${s.id}`);
  const key=s.nameZh.trim();
  if(names.has(key))throw new Error(`Duplicate scene name: ${key}`);
  names.add(key);
}
console.log(JSON.stringify({status:'PASS',taxonomy:'pai-word-scene500-20x25-v1',categories:20,scenes:500,first:scenes[0],last:scenes.at(-1)},null,2));
