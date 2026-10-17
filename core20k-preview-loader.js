// Optional Core20K preview runtime. Load after lazy-loader.js and before core-bootstrap.js.
// Activated only with ?lexicon=20k (or localStorage pai-lexicon-mode=20k).
// Reuses the stable Core13K catalog, then overlays the frozen Core20K membership/rank and 6,013 new lexical entries.
(function(){
  const params=new URLSearchParams(location.search);
  const requested=params.get('lexicon')||localStorage.getItem('pai-lexicon-mode');
  if(requested!=='20k')return;
  const stableLoad=window.loadLearningCatalog;
  const ROOT='data/core20k-preview-v1/';
  const RELEASE='core20k-preview-overlay-v1';
  const sha256=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),n=>n.toString(16).padStart(2,'0')).join('');
  async function ungzip(bytes){
    if(typeof DecompressionStream!=='undefined')return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
    if(window.pako?.ungzip)return window.pako.ungzip(bytes);
    throw Error('当前浏览器缺少 gzip 解压能力');
  }
  async function loadOverlay(manifest){
    const r=await fetch(ROOT+manifest.pack.file,{cache:'no-store'});if(!r.ok)throw Error('Core20K Preview overlay 未发布');
    const text=await r.text();
    if(text.length!==manifest.pack.bytes||await sha256(text)!==manifest.pack.sha256)throw Error('Core20K Preview overlay 校验失败');
    const bytes=Uint8Array.from(atob(text),c=>c.charCodeAt(0));
    const raw=await ungzip(bytes);if(raw.byteLength!==manifest.pack.rawBytes)throw Error('Core20K Preview overlay 结构错误');
    return JSON.parse(new TextDecoder().decode(raw));
  }
  window.loadLearningCatalog=async()=>{
    if(typeof stableLoad!=='function')throw Error('Stable Core13K loader 不可用');
    const base=await stableLoad();
    const mr=await fetch(ROOT+'manifest.json',{cache:'no-store'});if(!mr.ok)throw Error('Core20K Preview manifest 未发布');
    const manifest=await mr.json();if(manifest.release!==RELEASE||manifest.wordCount!==20000)throw Error('Core20K Preview manifest 不一致');
    const overlay=await loadOverlay(manifest);if(overlay?.rows?.length!==20000||overlay?.meta?.missing?.length)throw Error('Core20K Preview overlay QA 失败');
    for(const k of Object.keys(SCENES))delete SCENES[k];
    Object.assign(SCENES,{daily:'日常生活',work:'职场商务',academic:'学术学习',travel:'旅行出行',social:'社交关系',tech:'科技互联网',health:'健康医疗',finance:'金融消费',public:'公共社会',culture:'文化娱乐',function:'功能词专项',core1:'词频 1–1,000',core3:'词频 1,001–3,000',core6:'词频 3,001–6,000',core13:'词频 6,001–13,000',core20:'Core20K 扩展'});
    const core={words:[],byKU:new Map(),byScene:new Map(Object.keys(SCENES).map(k=>[k,[]])),byLemma:new Map(),byWordId:new Map()};
    const baseByLemma=new Map();for(const w of base.words)baseByLemma.set(String(w.w).toLowerCase(),w);
    const addUnit=(w,k,s0,kuContent=null)=>{
      if(core.byKU.has(k))throw Error('Core20K Preview 重复 KU: '+k);
      const s={ku_id:k,scene:s0.scene||'core20',kuType:String(s0.kuType||'sense').toLowerCase(),kuTitle:s0.kuTitle||'',pos:s0.pos||w.pos,m:s0.m||'',e:Array.isArray(s0.e)?s0.e:[],c:s0.c||'',x:s0.x||''};
      w.s[k]=s;const u={w,sid:k,k,s,kuContent};core.byKU.set(k,u);if(!core.byScene.has(s.scene))core.byScene.set(s.scene,[]);core.byScene.get(s.scene).push(u);
    };
    for(const row of overlay.rows){
      const [rank,lemma,role,payload]=row;let w;
      if(role==='I'){
        const src=baseByLemma.get(String(lemma).toLowerCase());if(!src)throw Error('Core20K Preview 继承词未找到: '+lemma);
        w={rank,w:lemma,pos:src.pos||'',s:{},ipa:src.ipa||'',ipaUS:src.ipaUS||src.ipa||'',ipaUK:src.ipaUK||'',root:'',allSenses:src.allSenses||[],loaded:true,role:'INHERITED_CORE13K_LEXICAL',sourceCore13Rank:Number(payload)||src.rank};
        for(const [k,s] of Object.entries(src.s||{}))addUnit(w,k,s,null);
      }else if(role==='L'){
        if(!Array.isArray(payload))throw Error('Core20K Preview lexical payload 缺失: '+lemma);
        const [kid,pos,ipa,zh,en,evidence,source]=payload;w={rank,w:lemma,pos:pos||'',s:{},ipa:ipa||'',ipaUS:ipa||'',ipaUK:'',root:'',allSenses:[[`${kid}_sense`,pos||'',zh||'',en||'',false]],loaded:true,role:'LEXICAL_SEMANTIC'};
        addUnit(w,kid,{scene:'core20',kuType:'sense',pos:pos||'',m:zh||'',e:[],c:'',x:''},{content_zh:zh||'',content_en:en||'',evidence_status:evidence||'pending_external_verification',source:source||''});
      }else{
        w={rank,w:lemma,pos:'',s:{},ipa:'',ipaUS:'',ipaUK:'',root:'',allSenses:[],loaded:true,role:'STRUCTURAL',structuralTarget:String(payload||'')};
      }
      core.words.push(w);const low=String(lemma).toLowerCase();core.byLemma.set(low,[...(core.byLemma.get(low)||[]),w]);core.byWordId.set(String(rank),w);
    }
    if(core.words.length!==20000||core.byKU.size!==manifest.kuCount)throw Error(`Core20K Preview QA 失败: words=${core.words.length}, KU=${core.byKU.size}`);
    window.PAI_CORE=core;WORDS.splice(0,WORDS.length,...core.words);
    // Preview deliberately uses catalog-level content only. Rich Core13K chunk hydration is disabled because Core20K rank order differs.
    window.ensureUnits=async()=>{};window.downloadOfflineLexicon=async()=>{};
    window.PAI_LOCAL_LEXICON={supported:true,offlineReady:false,shellReady:false,loadedChunks:0,totalChunks:0,preview:true};
    window.PAI_CORE_QA={release:RELEASE,baselineVersion:manifest.baselineVersion,words:core.words.length,units:core.byKU.size,playableWords:manifest.playableWordCount,structural:manifest.structural,preview:true};
    window.PAI_LEXICON_MODE='20k-preview';state.voiceAccent='us';save();return core;
  };
})();
