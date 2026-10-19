const el=id=>document.getElementById(id);
const state={data:null,list:[],i:0,score:{known:0,again:0}};
const status=t=>el('status').textContent=t;
const invalid=t=>el('err').textContent=t;
const decode=async b=>new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).json();
const cache=new Map();
async function boot(){
 try{
  if(!('DecompressionStream'in window))throw Error('浏览器不支持原生GZIP解压');
  const r=await fetch('../data/core20k-runtime.json.gz');if(!r.ok)throw Error('词库请求失败 '+r.status);
  const compressed=await r.arrayBuffer();
  const actualHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',compressed)),b=>b.toString(16).padStart(2,'0')).join('');
  if(actualHash!=='e91e2ab357d6f09f8747c4396a2d88bde67150a9112d7bfe63730117a6ddfb1b')throw Error('Core20K SHA-256 校验失败：拒绝使用不匹配的学习数据');
  const data=await decode(compressed);
  if(data.schema!=='pai-core20k-runtime-v1'||data.headwords?.length!==20000)throw Error('20K词库身份异常');
  state.data=data;el('go').disabled=el('random').disabled=false;status('20,000词目录已加载。选择场景开始。');
 }catch(e){status('加载失败');invalid(e.message)}
}
async function scene(code){
 if(!/^S(?:00[1-9]|0[1-9][0-9]|[1-4][0-9]{2}|500)$/.test(code))throw Error('请输入 S001 到 S500');
 const n=+code.slice(1),group=String(Math.ceil(n/25)).padStart(2,'0');
 if(!cache.has(group)){
  const r=await fetch('../data/scene500-top100-v40/group-'+group+'.json');if(!r.ok)throw Error('场景请求失败 '+r.status);
  const data=await r.json();
  if(data.schema!=='pai-scene500-top100-v40-v1'||data.policy!=='ranks_1_100; only single_playable_general_sense; no scene_sense_verified_claim')throw Error('场景质量门禁失败');
  cache.set(group,data);
 }
 const rows=cache.get(group).scenes?.[code];if(!rows||rows.length!==100)throw Error('场景不完整');
 const list=[];for(let i=0;i<100;i++){
  const [ordinal,lemma,rank,kuId]=rows[i],w=state.data.headwords[rank-1];
  if(ordinal!==i+1||w?.[0]!==rank||w?.[1]?.toLowerCase()!==lemma.toLowerCase())throw Error('场景排名与词条不一致');
  if(kuId==null)continue;
  const eligible=w[4].filter(k=>k[1]==='sense'&&k[4]===true&&String(k[2]||'').trim());
  if(eligible.length!==1||eligible[0][0]!==kuId)continue;
  list.push({lemma,zh:eligible[0][2],rank,sceneRank:ordinal});
 }
 return list;
}
function render(){
 const item=state.list[state.i];el('sceneName').textContent=state.scene+' · 原始Top100';el('step').textContent=(state.i+1)+' / '+state.list.length;
 el('word').textContent=item.lemma;el('meaning').textContent=item.zh;
 el('meaning').classList.add('hidden');el('showRow').classList.remove('hidden');el('nextRow').classList.add('hidden');
}
async function go(){
 invalid('');let code=el('search').value.trim().toUpperCase();el('go').disabled=true;status('正在检查场景排名和 KU…');
 try{state.list=await scene(code);state.i=0;state.scene=code;state.score={known:0,again:0};if(!state.list.length)throw Error('当前场景暂无通过保守审核门禁的 Sense');el('lesson').classList.remove('hidden');render();status('可学习 '+state.list.length+' 个；其余Top100位置不自动补齐。');el('lesson').scrollIntoView({behavior:'smooth'});}
 catch(e){invalid(e.message)}finally{el('go').disabled=false}
}
el('go').onclick=go;el('random').onclick=()=>{el('search').value='S'+String(1+Math.floor(Math.random()*500)).padStart(3,'0');go()};
el('reveal').onclick=()=>{el('meaning').classList.remove('hidden');el('showRow').classList.add('hidden');el('nextRow').classList.remove('hidden')};
for(const kind of ['known','again'])el(kind).onclick=()=>{state.score[kind]++;state.i++;if(state.i>=state.list.length){status('本轮结束：想起 '+state.score.known+'，没想起 '+state.score.again+'（不保存）');state.i=0;el('lesson').classList.add('hidden')}else render()};
boot();
