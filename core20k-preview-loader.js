// Optional Core20K preview runtime. Load after lazy-loader.js and before core-bootstrap.js.
// Activated only with ?lexicon=20k (or localStorage pai-lexicon-mode=20k).
(function(){
  const params=new URLSearchParams(location.search);
  const requested=params.get('lexicon')||localStorage.getItem('pai-lexicon-mode');
  if(requested!=='20k')return;
  const ROOT='data/core20k-preview-v1/';
  const RELEASE='core20k-preview-v1';
  const sha256=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),n=>n.toString(16).padStart(2,'0')).join('');
  async function ungzip(bytes){
    if(typeof DecompressionStream!=='undefined')return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
    if(window.pako?.ungzip)return window.pako.ungzip(bytes);
    throw Error('当前浏览器缺少 gzip 解压能力');
  }
  async function loadPack(manifest){
    const r=await fetch(ROOT+manifest.pack.file,{cache:'no-store'});if(!r.ok)throw Error('Core20K Preview 词包未发布');
    const text=await r.text();
    if(text.length!==manifest.pack.bytes||await sha256(text)!==manifest.pack.sha256)throw Error('Core20K Preview 词包校验失败');
    const bytes=Uint8Array.from(atob(text),c=>c.charCodeAt(0));
    const raw=await ungzip(bytes);if(raw.byteLength!==manifest.pack.rawBytes)throw Error('Core20K Preview 词包结构错误');
    return JSON.parse(new TextDecoder().decode(raw));
  }
  window.loadLearningCatalog=async()=>{
    const mr=await fetch(ROOT+'manifest.json',{cache:'no-store'});if(!mr.ok)throw Error('Core20K Preview manifest 未发布');
    const manifest=await mr.json();if(manifest.release!==RELEASE||manifest.wordCount!==20000)throw Error('Core20K Preview manifest 不一致');
    const pack=await loadPack(manifest);if(pack?.words?.length!==20000)throw Error('Core20K Preview 词数不符');
    for(const k of Object.keys(SCENES))delete SCENES[k];
    Object.assign(SCENES,{daily:'日常生活',work:'职场商务',academic:'学术学习',travel:'旅行出行',social:'社交关系',tech:'科技互联网',health:'健康医疗',finance:'金融消费',public:'公共社会',culture:'文化娱乐',function:'功能词专项',core1:'词频 1–1,000',core3:'词频 1,001–3,000',core6:'词频 3,001–6,000',core13:'词频 6,001–13,000',core20:'Core20K 扩展'});
    const core={words:[],byKU:new Map(),byScene:new Map(Object.keys(SCENES).map(k=>[k,[]])),byLemma:new Map(),byWordId:new Map()};
    for(const row of pack.words){
      const w={rank:row.rank,w:row.w,pos:row.pos||'',s:{},ipa:row.ipaUS||'',ipaUS:row.ipaUS||'',ipaUK:row.ipaUK||'',root:row.root||'',allSenses:row.allSenses||[],loaded:true,role:row.role,structuralTarget:row.structuralTarget||null,sourceCore13Rank:row.sourceCore13Rank||null};
      for(const [k,s0] of Object.entries(row.s||{})){
        if(core.byKU.has(k))throw Error('Core20K Preview 重复 KU: '+k);
        const s={ku_id:k,scene:s0.scene||'core20',kuType:String(s0.kuType||'sense').toLowerCase(),kuTitle:s0.kuTitle||'',pos:s0.pos||w.pos,m:s0.m||'',e:Array.isArray(s0.e)?s0.e:[],c:s0.c||'',x:s0.x||''};
        w.s[k]=s;const u={w,sid:k,k,s,kuContent:(row.rich||{})[k]||null};core.byKU.set(k,u);
        if(!core.byScene.has(s.scene))core.byScene.set(s.scene,[]);core.byScene.get(s.scene).push(u);
      }
      core.words.push(w);core.byLemma.set(w.w,[...(core.byLemma.get(w.w)||[]),w]);core.byLemma.set(String(w.w).toLowerCase(),[...(core.byLemma.get(String(w.w).toLowerCase())||[]),w]);core.byWordId.set(String(row.rank),w);
    }
    if(core.words.length!==20000||core.byKU.size!==manifest.kuCount)throw Error('Core20K Preview QA 失败');
    window.PAI_CORE=core;WORDS.splice(0,WORDS.length,...core.words);
    window.ensureUnits=async()=>{};window.downloadOfflineLexicon=async()=>{};
    window.PAI_LOCAL_LEXICON={supported:true,offlineReady:true,shellReady:false,loadedChunks:1,totalChunks:1,preview:true};
    window.PAI_CORE_QA={release:RELEASE,baselineVersion:manifest.baselineVersion,words:core.words.length,units:core.byKU.size,playableWords:manifest.playableWordCount,structural:manifest.structural,preview:true};
    window.PAI_LEXICON_MODE='20k-preview';state.voiceAccent='us';save();return core;
  };
})();
