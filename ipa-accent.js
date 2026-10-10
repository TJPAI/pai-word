// Accent-aware IPA data layer. It owns pronunciation data only; rendering stays in app-runtime.js.
// UK currently preserves each lexicon entry's original IPA unless an explicit ipaUK exists.
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

  let accent=state.voiceAccent==='gb'?'gb':'us';
  function applyAccentIPA(){
    WORDS.forEach(w=>{w.ipa=accent==='gb'?(w.ipaUK||w.ipa):(w.ipaUS||w.ipa)});
  }

  Object.defineProperty(state,'voiceAccent',{
    configurable:true,
    enumerable:true,
    get(){return accent},
    set(value){accent=value==='gb'?'gb':'us';applyAccentIPA()}
  });

  window.getAccentIPA=function(word){
    if(!word)return'';
    return accent==='gb'?(word.ipaUK||word.ipa):(word.ipaUS||word.ipa);
  };
  window.PAI_WORD_IPA_QA={words:WORDS.length,complete:WORDS.length-missing.length,missing};
  applyAccentIPA();

  if(missing.length)console.warn('[PAI Word IPA QA] missing accent IPA',missing);
  else console.info(`[PAI Word IPA QA] ${WORDS.length} words have US/UK IPA fields`);
})();