// Reproducible packaging only: preserves canonical KU IDs and records content filtering.
const fs=require('fs'),z=require('zlib'),vm=require('vm'),crypto=require('crypto');
const root='data/learning-v3';fs.mkdirSync(root,{recursive:true});
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const unpack=dir=>{const m=read(dir+'/manifest.json');return JSON.parse(z.gunzipSync(Buffer.from(m.parts.map(p=>fs.readFileSync(dir+'/'+p.file,'utf8').trim()).join(''),'base64')))};
const base=read('data/core13000-v25.5/manifest.json');
const rows=base.packs.flatMap(p=>{const b=fs.readFileSync('data/core13000-v25.5/'+p.file);if(crypto.createHash('sha256').update(b).digest('hex')!==p.sha256)throw Error('source checksum');return JSON.parse(z.brotliDecompressSync(b)).words});
const overlay=unpack('data/core13000-v26.7i-lite'),rich=unpack('data/core13000-v26.7i-kucontent');
const ctx={window:{},SCENES:{daily:'日常生活',work:'职场商务',academic:'学术学习',travel:'旅行出行',social:'社交关系',tech:'科技互联网',health:'健康医疗',finance:'金融消费',public:'公共社会',culture:'文化娱乐'},console};
vm.createContext(ctx);let src=fs.readFileSync('core-loader.js','utf8');src=src.slice(0,src.indexOf('  window.loadCore13000='))+'window.build={adapt,applyWordOverlay};})();';vm.runInContext(src,ctx);
ctx.window.build.applyWordOverlay(rows,overlay);const core=ctx.window.build.adapt(rows,overlay);
for(const r of rich.ku_content)core.byKU.get(r.ku_id).kuContent=r;
const functional=new Set('the be am is are was were been being and of to a an in that it for on with as at by from or but if than because although while nor whether I you he she we they me him her us them my your his its our their this these those each every some any no all both either neither such whose which who whom what about when where why how so there here more most less least other up out very just not have has had do does did can could may might shall should will would must ought'.toLowerCase().split(' '));
const audit={source:'Core-13000 V26.7I',policy:'suppress-placeholder-content-v1',examplesRemoved:0,collocationsRemoved:0,usageRemoved:0,affectedWords:[],dictionaryValidation:'PENDING',note:'Pattern screening is not dictionary or corpus validation.'};
const bad=/in a clear practical context|the report discusses|in context|common usage of|typical use of|this (word|term) (is used|refers)|常见用法示例|具体语境中理解/i;
for(const w of core.words){let affected=false;for(const s of Object.values(w.s)){
 let scene=s.scene;const d=s.domain;
 if(d==='time_space_abstract')scene='general';else if(d==null)scene=w.w==='model'?'tech':'daily';else if(d==='media_communication')scene='public';else if(d==='general')scene='daily';else if(d==='animals_plants')scene=s.ku_id==='w_1823_stable_ku_s02'?'daily':'public';
 if(functional.has(w.w.toLowerCase())&&w.rank<=500||/^(det\.|pron\.|prep\.|conj\.|aux\.)$/.test(w.pos))scene='function';
 if(scene==='general'||scene==='unclassified')scene=w.rank<=1000?'core1':w.rank<=3000?'core3':w.rank<=6000?'core6':'core13';s.scene=scene;
 const good=[];const audio=[];s.e.forEach((e,i)=>{if(bad.test(e)){audit.examplesRemoved++;affected=true}else{good.push(e);audio.push(s.exampleAudio[i])}});s.e=good;s.exampleAudio=audio;
 const cs=s.c.split(' · ').filter(c=>{if(bad.test(c)){audit.collocationsRemoved++;affected=true;return false}return true});s.c=cs.join(' · ');
 if(bad.test(s.x)){audit.usageRemoved++;s.x='';affected=true}
 }if(affected)audit.affectedWords.push(w.rank);
}
// Small authored repair for the concrete regression reported in review; not marked externally verified.
const apple=core.words.find(w=>w.w==='apple');if(apple)for(const s of Object.values(apple.s)){s.scene='daily';s.c='an apple tree — 苹果树 · apple juice — 苹果汁 · a slice of apple — 一片苹果';s.e=['She ate an apple after lunch.\n她午饭后吃了一个苹果。','Would you like some apple juice?\n你想喝点苹果汁吗？','There are three apples in the bowl.\n碗里有三个苹果。'];s.exampleAudio=s.e.map(e=>e.split('\n')[0]);s.x='apple 是可数名词：an apple；复数为 apples。'}
const scenes={...ctx.SCENES,function:'功能词专项',core1:'词频 1–1,000',core3:'词频 1,001–3,000',core6:'词频 3,001–6,000',core13:'词频 6,001–13,000'};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function asset(name,data){const b=z.gzipSync(Buffer.from(JSON.stringify(data)),{level:9});const txt=b.toString('base64');fs.writeFileSync(root+'/'+name+'.b64',txt);return {file:name+'.b64',sha256:hash(Buffer.from(txt)),bytes:txt.length,rawBytes:Buffer.byteLength(JSON.stringify(data))}}
const chunks=[];for(let i=0;i<core.words.length;i+=250){const words=core.words.slice(i,i+250).map(w=>({...w,rich:Object.fromEntries(Object.keys(w.s).filter(k=>core.byKU.get(k).kuContent).map(k=>[k,core.byKU.get(k).kuContent]))}));chunks.push(asset('words-'+String(i/250).padStart(2,'0'),words))}
const catalog=core.words.map(w=>[w.rank,w.w,w.pos,Object.values(w.s).map(s=>[s.ku_id,s.scene,s.kuType,s.kuTitle,s.pos,s.m])]);
const manifest={release:'learning-v3.1',source:base.release+' + V26.7I overlay',wordCount:core.words.length,kuCount:core.byKU.size,chunkSize:250,scenes,catalog:asset('catalog',catalog),chunks};
fs.writeFileSync(root+'/manifest.json',JSON.stringify(manifest));fs.writeFileSync(root+'/content-audit.json',JSON.stringify(audit,null,2));
console.log({catalog:manifest.catalog.bytes,chunks:chunks.length,exampleRemovals:audit.examplesRemoved,collocationRemovals:audit.collocationsRemoved,affected:audit.affectedWords.length});
