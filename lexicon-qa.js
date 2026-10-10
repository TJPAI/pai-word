// Lightweight production lexicon QA. Runs in-browser and reports structural issues to console.
(function(){
  const validScenes=new Set(Object.keys(SCENES));
  const issues=[];
  const seenWords=new Map();
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
    });
  });
  for(const [word,count] of seenWords){if(count>1)issues.push(`${word}: duplicate headword x${count}`)}
  window.PAI_WORD_LEXICON_QA={words:WORDS.length,senses:WORDS.reduce((n,w)=>n+Object.keys(w.s||{}).length,0),issues};
  if(issues.length)console.warn('[PAI Word lexicon QA]',issues);
  else console.info(`[PAI Word lexicon QA] ${WORDS.length} words, ${window.PAI_WORD_LEXICON_QA.senses} senses, OK`);
})();
