// Accent-aware IPA layer for the current production lexicon.
// Every loaded headword receives explicit ipaUS / ipaUK values. UK keeps the
// lexicon's original standard-British IPA unless a future entry overrides it;
// US uses the General American forms below. The selected speech accent and IPA
// therefore stay aligned without changing any learning-progress keys.
(function(){
  const us={
    issue:'/ˈɪʃuː/',interest:'/ˈɪntrəst/',approach:'/əˈproʊtʃ/',deploy:'/dɪˈplɔɪ/',plot:'/plɑːt/',symptom:'/ˈsɪmptəm/',estimate:'/ˈestɪmeɪt/',
    ability:'/əˈbɪləti/',account:'/əˈkaʊnt/',charge:'/tʃɑːrdʒ/',claim:'/kleɪm/',conduct:'/kənˈdʌkt/',context:'/ˈkɑːntekst/',contract:'/ˈkɑːntrækt/',decline:'/dɪˈklaɪn/',deliver:'/dɪˈlɪvər/',demand:'/dɪˈmænd/',evidence:'/ˈevɪdəns/',feature:'/ˈfiːtʃər/',impact:'/ˈɪmpækt/',maintain:'/meɪnˈteɪn/',measure:'/ˈmeʒər/',policy:'/ˈpɑːləsi/',reserve:'/rɪˈzɜːrv/',secure:'/sɪˈkjʊr/',shift:'/ʃɪft/',source:'/sɔːrs/',access:'/ˈækses/',apply:'/əˈplaɪ/',assume:'/əˈsuːm/',available:'/əˈveɪləbəl/',benefit:'/ˈbenəfɪt/',capacity:'/kəˈpæsəti/',compare:'/kəmˈper/',condition:'/kənˈdɪʃən/',
    adopt:'/əˈdɑːpt/',affect:'/əˈfekt/',assess:'/əˈses/',achieve:'/əˈtʃiːv/',acquire:'/əˈkwaɪər/',adapt:'/əˈdæpt/',analyze:'/ˈænəlaɪz/',announce:'/əˈnaʊns/',approve:'/əˈpruːv/',arrange:'/əˈreɪndʒ/',attend:'/əˈtend/',avoid:'/əˈvɔɪd/',balance:'/ˈbæləns/',challenge:'/ˈtʃælɪndʒ/',concern:'/kənˈsɜːrn/',confirm:'/kənˈfɜːrm/',consume:'/kənˈsuːm/',contribute:'/kənˈtrɪbjuːt/',determine:'/dɪˈtɜːrmɪn/',establish:'/ɪˈstæblɪʃ/',evaluate:'/ɪˈvæljueɪt/',expand:'/ɪkˈspænd/',focus:'/ˈfoʊkəs/',identify:'/aɪˈdentəfaɪ/',indicate:'/ˈɪndəkeɪt/',involve:'/ɪnˈvɑːlv/',occur:'/əˈkɜːr/',obtain:'/əbˈteɪn/',require:'/rɪˈkwaɪər/',respond:'/rɪˈspɑːnd/',
    allow:'/əˈlaʊ/',appear:'/əˈpɪr/',build:'/bɪld/',cause:'/kɔːz/',communicate:'/kəˈmjuːnəkeɪt/',control:'/kənˈtroʊl/',create:'/kriˈeɪt/',develop:'/dɪˈveləp/',discover:'/dɪˈskʌvər/',enable:'/ɪˈneɪbəl/',ensure:'/ɪnˈʃʊr/',explain:'/ɪkˈspleɪn/',increase:'/ɪnˈkriːs/',manage:'/ˈmænɪdʒ/',provide:'/prəˈvaɪd/',reduce:'/rɪˈduːs/',relate:'/rɪˈleɪt/',remain:'/rɪˈmeɪn/',represent:'/ˌreprɪˈzent/',support:'/səˈpɔːrt/',transfer:'/trænsˈfɜːr/',verify:'/ˈverəfaɪ/',improve:'/ɪmˈpruːv/',monitor:'/ˈmɑːnətər/',recognize:'/ˈrekəɡnaɪz/',release:'/rɪˈliːs/',select:'/səˈlekt/',solve:'/sɑːlv/'
  };

  const missing=[];
  WORDS.forEach(w=>{
    w.ipaUK=w.ipaUK||w.ipa;
    w.ipaUS=w.ipaUS||us[w.w]||'';
    if(!w.ipaUS||!w.ipaUK)missing.push(w.w);
  });

  window.PAI_WORD_IPA_QA={
    words:WORDS.length,
    complete:WORDS.length-missing.length,
    missing
  };
  if(missing.length)console.warn('[PAI Word IPA QA] missing accent IPA',missing);
  else console.info(`[PAI Word IPA QA] ${WORDS.length} words have US/UK IPA`);

  window.getAccentIPA=function(word){
    if(!word)return'';
    return state.voiceAccent==='gb'?(word.ipaUK||word.ipa):(word.ipaUS||word.ipa);
  };

  function syncIPA(){
    const el=document.querySelector('.ipa');
    const wordText=document.querySelector('.word')?.textContent?.trim();
    if(!el||!wordText)return;
    const word=WORDS.find(w=>w.w===wordText);
    if(word)el.textContent=getAccentIPA(word);
  }

  const baseRender=render;
  render=function(){baseRender();syncIPA()};
  syncIPA();
})();
