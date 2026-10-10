// Lightweight production lexicon QA. Runs in-browser and reports structural issues to console.
(function(){
  const validScenes=new Set(Object.keys(SCENES));
  const issues=[];
  const warnings=[];
  const seenWords=new Map();

  function normalizeText(value){return String(value||'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9' -]/g,' ')}
  const irregularForms={
    'win':['won'],'build':['built'],'lead':['led'],'run':['ran'],'fall':['fell','fallen'],'grow':['grew','grown'],
    'send':['sent'],'spend':['spent'],'find':['found'],'take':['took','taken'],'make':['made'],'come':['came'],
    'become':['became'],'write':['wrote','written'],'choose':['chose','chosen'],'rise':['rose','risen'],'hold':['held'],
    'sell':['sold'],'buy':['bought'],'teach':['taught'],'catch':['caught'],'think':['thought'],'bring':['brought'],
    'leave':['left'],'meet':['met'],'pay':['paid'],'say':['said'],'tell':['told'],'keep':['kept'],'feel':['felt'],
    'mean':['meant'],'lose':['lost'],'stand':['stood'],'understand':['understood'],'begin':['began','begun'],
    'break':['broke','broken'],'drive':['drove','driven']
  };
  function forms(token){
    const t=token.toLowerCase(),out=new Set([t]);
    (irregularForms[t]||[]).forEach(x=>out.add(x));
    if(t.length>=3){
      out.add(t+'s');out.add(t+'ed');out.add(t+'ing');
      if(t.endsWith('e')){out.add(t.slice(0,-1)+'ed');out.add(t.slice(0,-1)+'ing')}
      if(t.endsWith('y')){out.add(t.slice(0,-1)+'ies');out.add(t.slice(0,-1)+'ied')}
    }
    return [...out];
  }
  function matches(word,sentence){
    const parts=normalizeText(word).trim().split(/\s+/).filter(Boolean);
    const s=' '+normalizeText(sentence)+' ';
    if(!parts.length)return false;
    return parts.every(p=>forms(p).some(f=>s.includes(' '+f+' ')));
  }

  WORDS.forEach((w,wi)=>{
    if(!w||!w.w){issues.push(`word[${wi}] missing headword`);return;}
    const key=w.w.toLowerCase();
    seenWords.set(key,(seenWords.get(key)||0)+1);
    if(!w.ipa)issues.push(`${w.w}: missing IPA`);
    if(!w.root)issues.push(`${w.w}: missing root/etymology`);
    if(!w.s||!Object.keys(w.s).length)issues.push(`${w.w}: no scene senses`);
    Object.entries(w.s||{}).forEach(([scene,s])=>{
      const p=`${w.w}/${scene}`;
      if(!validScenes.has(scene))issues.push(`${p}: invalid scene`);
      if(!s.m)issues.push(`${p}: missing meaning`);
      if(!s.c)issues.push(`${p}: missing collocations`);
      if(!Array.isArray(s.e)||s.e.length!==3)issues.push(`${p}: examples must be exactly 3`);
      if(!s.x)issues.push(`${p}: missing usage warning`);
      if(!s.bad||!s.good)issues.push(`${p}: missing wrong/correct example pair`);
      if(s.compare){
        const cw=Array.isArray(s.compare.words)?s.compare.words:[];
        const ce=Array.isArray(s.compare.examples)?s.compare.examples:[];
        if(!s.compare.note)issues.push(`${p}: synonym comparison missing note`);
        if(cw.length<2)issues.push(`${p}: synonym comparison needs at least 2 words`);
        if(ce.length!==cw.length)warnings.push(`${p}: synonym comparison has ${cw.length} words but ${ce.length} dedicated examples`);
        const mapped=[];
        ce.forEach((text,i)=>{
          const hit=cw.filter(word=>matches(word,text));
          if(hit.length!==1)warnings.push(`${p}: comparison example ${i+1} maps to ${hit.length} words (${hit.join(', ')||'none'})`);
          else mapped.push(hit[0]);
        });
        const duplicateMapped=[...new Set(mapped.filter((x,i)=>mapped.indexOf(x)!==i))];
        if(duplicateMapped.length)warnings.push(`${p}: repeated comparison example target(s): ${duplicateMapped.join(', ')}`);
        const missing=cw.filter(word=>!mapped.includes(word));
        if(missing.length)warnings.push(`${p}: no dedicated comparison example for: ${missing.join(', ')}`);
      }
    });
  });
  for(const [word,count] of seenWords){if(count>1)issues.push(`${word}: duplicate headword x${count}`)}
  window.PAI_WORD_LEXICON_QA={
    words:WORDS.length,
    senses:WORDS.reduce((n,w)=>n+Object.keys(w.s||{}).length,0),
    issues,warnings
  };
  if(issues.length)console.warn('[PAI Word lexicon QA issues]',issues);
  if(warnings.length)console.warn('[PAI Word lexicon QA warnings]',warnings);
  if(!issues.length&&!warnings.length)console.info(`[PAI Word lexicon QA] ${WORDS.length} words, ${window.PAI_WORD_LEXICON_QA.senses} senses, OK`);
})();
