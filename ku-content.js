// Optional V26.7I KU teaching-content enhancement. Core runtime remains usable if this layer fails.
(function(){
  const ROOT='data/core13000-v26.7i-kucontent/';
  const status={status:'loading',loaded:0,total:510,error:null};
  if(window.PAI_CORE)window.PAI_CORE.kuContent=status;
  async function sha256(data){
    if(!crypto?.subtle)throw new Error('SHA-256 unavailable');
    const bytes=typeof data==='string'?new TextEncoder().encode(data):data instanceof Uint8Array?data:new Uint8Array(data);
    return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
  }
  function b64bytes(text){const bin=atob(text),out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return out}
  async function fetchText(part){
    const r=await fetch(ROOT+part.file,{cache:'no-cache'});if(!r.ok)throw new Error(part.file+' HTTP '+r.status);
    const text=(await r.text()).trim();
    if(text.length!==part.chars||await sha256(text)!==part.sha256)throw new Error(part.file+' 校验失败');
    return text;
  }
  async function load(){
    try{
      if(!window.PAI_CORE?.byKU)throw new Error('core runtime not ready');
      const mr=await fetch(ROOT+'manifest.json',{cache:'no-cache'});if(!mr.ok)throw new Error('manifest HTTP '+mr.status);
      const m=await mr.json();
      if(m.schema!=='pai-word-kucontent-manifest-v1'||m.ku_content_count!==510||!Array.isArray(m.parts)||m.parts.length!==3)throw new Error('manifest 结构不符');
      let b64='';for(const part of m.parts)b64+=await fetchText(part);
      const gz=b64bytes(b64);if(gz.length!==m.gzip_bytes||await sha256(gz)!==m.gzip_sha256)throw new Error('gzip 校验失败');
      if(typeof DecompressionStream!=='function')throw new Error('gzip decompression unavailable');
      const raw=new Uint8Array(await new Response(new Blob([gz]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
      if(raw.length!==m.json_bytes||await sha256(raw)!==m.json_sha256)throw new Error('JSON 校验失败');
      const payload=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));
      if(payload.schema!=='pai-word-v267i-ku-content-v1'||payload.ku_count!==510||!Array.isArray(payload.ku_content)||payload.ku_content.length!==510)throw new Error('KU content 结构不符');
      const seen=new Set();let loaded=0;
      for(const row of payload.ku_content){
        if(!row?.ku_id||seen.has(row.ku_id))throw new Error('KU content ID 重复/缺失');seen.add(row.ku_id);
        const unit=window.PAI_CORE.byKU.get(row.ku_id);if(!unit)throw new Error('KU content 找不到运行时 ID：'+row.ku_id);
        unit.kuContent={content_zh:row.content_zh||'',pattern_or_example:row.pattern_or_example||'',exercise_type:row.exercise_type||'',priority:row.priority||''};loaded++;
      }
      status.status='ready';status.loaded=loaded;status.total=payload.ku_content.length;status.error=null;
      window.PAI_CORE_QA&&(window.PAI_CORE_QA.kuContent={...status});
      window.dispatchEvent(new CustomEvent('pai-ku-content',{detail:{...status}}));
      return status;
    }catch(error){
      status.status='fallback';status.loaded=0;status.error=String(error?.message||error);
      window.PAI_CORE_QA&&(window.PAI_CORE_QA.kuContent={...status});
      console.warn('[PAI Word KU content] optional enhancement unavailable:',error);
      window.dispatchEvent(new CustomEvent('pai-ku-content',{detail:{...status}}));
      return status;
    }
  }
  window.PAI_KU_CONTENT_READY=load();
})();
