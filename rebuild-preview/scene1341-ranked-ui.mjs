import {createRankedStore} from './scene1341-ranked-preview.mjs';
const store=createRankedStore();
const byId=id=>document.getElementById(id);
const elements=Object.fromEntries(['sceneSearch','scenes','sceneStatus','offline','offlineStatus','sceneTitle','expressionSearch','tier','resultStatus','results','more'].map(x=>[x,byId(x)]));
let active=null,allRows=[],filtered=[],shown=0,requestNumber=0,loadedIndex;
const norm=value=>String(value||'').normalize('NFKC').toLocaleLowerCase();
function setText(node,value){node.textContent=value;}
function renderScenes(){
  const query=elements.sceneSearch.value;
  const matches=store.findScenes(query);
  const frag=document.createDocumentFragment();
  for(const scene of matches){
    const button=document.createElement('button');
    button.type='button';button.className='scene'+(active===scene.scene_id?' selected':'');
    const title=document.createElement('span');title.textContent=scene.name;
    const meta=document.createElement('small');meta.textContent=scene.scene_id+' · '+scene.count+' 条 · V'+scene.version;
    button.append(title,meta);
    button.addEventListener('click',()=>selectScene(scene.scene_id));
    frag.append(button);
  }
  elements.scenes.replaceChildren(frag);
  setText(elements.sceneStatus,'已交付 '+loadedIndex.scenes.length+' 场景；匹配 '+matches.length+' 个');
}
function displayPage(){
  const page=filtered.slice(shown,shown+50),frag=document.createDocumentFragment();
  for(const row of page){
    const article=document.createElement('article');
    const top=document.createElement('div');top.className='top';
    const rank=document.createElement('span');rank.className='rank';rank.textContent='#'+row.rank;
    const word=document.createElement('strong');word.textContent=row.expression;
    top.append(rank,word);
    const gloss=document.createElement('p');gloss.className='translation';gloss.textContent=row.sense_zh;
    const meta=document.createElement('div');meta.className='meta';
    meta.textContent=[row.tier,row.dimension||'',row.sense_id].filter(Boolean).join(' · ');
    article.append(top,gloss,meta);frag.append(article);
  }
  elements.results.append(frag);
  shown+=page.length;
  elements.more.style.display=shown<filtered.length?'block':'none';
  setText(elements.resultStatus,filtered.length+' 条匹配；已显示 '+shown+' 条（按原始rank排序）');
}
function filterRows(){
  const query=norm(elements.expressionSearch.value),tier=elements.tier.value;
  filtered=allRows.filter(r=>(!tier||r.tier===tier)&&(!query||norm(r.expression).includes(query)||norm(r.sense_zh).includes(query)));
  shown=0;elements.results.replaceChildren();
  displayPage();
}
async function selectScene(id){
  const current=++requestNumber;
  active=id;renderScenes();
  const meta=loadedIndex.scenes.find(x=>x.scene_id===id);
  setText(elements.sceneTitle,meta.name+' · '+id);
  setText(elements.resultStatus,'加载对应10场景批次…');
  elements.results.replaceChildren();elements.more.style.display='none';
  try{
    const result=await store.scene(id);
    if(current!==requestNumber)return;
    if(result.status!=='EDITORIAL_DELIVERED_NOT_RUNTIME')throw Error('尚未交付');
    allRows=result.rows;
    elements.tier.replaceChildren(new Option('全部分级',''));
    for(const tier of [...new Set(allRows.map(x=>x.tier))])elements.tier.add(new Option(tier,tier));
    filterRows();
  }catch(error){if(current===requestNumber)setText(elements.resultStatus,'加载失败：'+error.message+'。离线访问需先成功缓存该批次。');}
}
async function init(){
  try{
    loadedIndex=await store.initialize();
    renderScenes();
    elements.sceneSearch.addEventListener('input',renderScenes);
    elements.expressionSearch.addEventListener('input',filterRows);
    elements.tier.addEventListener('change',filterRows);
    elements.more.addEventListener('click',displayPage);
    elements.offline.addEventListener('click',async()=>{
      elements.offline.disabled=true;
      try{
        await store.warmAll((done,total)=>setText(elements.offlineStatus,'已读取/尝试缓存 '+done+'/'+total+' 批'));
        setText(elements.offlineStatus,'11批数据已读取。离线可用性取决Safari的缓存空间和清理策略。');
      }catch(e){setText(elements.offlineStatus,'批次缓存未完成：'+e.message);}
      finally{elements.offline.disabled=false;}
    });
    await selectScene('SC50-0001');
  }catch(error){setText(elements.sceneStatus,'目录加载失败：'+error.message);}
}
init();
