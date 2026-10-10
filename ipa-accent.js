// Accent-aware IPA layer. UK falls back to the original lexicon IPA; US overrides
// words whose standard pronunciation is materially different. The UI always
// asks this layer for the IPA that matches the selected speech accent.
(function(){
  const us={
    approach:'/əˈproʊtʃ/',
    plot:'/plɑːt/',
    charge:'/tʃɑːrdʒ/',
    context:'/ˈkɑːntekst/',
    contract:'/ˈkɑːntrækt/',
    deliver:'/dɪˈlɪvər/',
    demand:'/dɪˈmænd/',
    feature:'/ˈfiːtʃər/',
    measure:'/ˈmeʒər/',
    policy:'/ˈpɑːləsi/',
    reserve:'/rɪˈzɜːrv/',
    secure:'/sɪˈkjʊr/',
    source:'/sɔːrs/',
    assume:'/əˈsuːm/',
    compare:'/kəmˈper/',
    adopt:'/əˈdɑːpt/',
    acquire:'/əˈkwaɪər/',
    concern:'/kənˈsɜːrn/',
    confirm:'/kənˈfɜːrm/',
    determine:'/dɪˈtɜːrmɪn/',
    focus:'/ˈfoʊkəs/',
    involve:'/ɪnˈvɑːlv/',
    occur:'/əˈkɜːr/',
    require:'/rɪˈkwaɪər/',
    respond:'/rɪˈspɑːnd/',
    appear:'/əˈpɪr/',
    control:'/kənˈtroʊl/',
    discover:'/dɪˈskʌvər/',
    ensure:'/ɪnˈʃʊr/',
    reduce:'/rɪˈduːs/',
    support:'/səˈpɔːrt/',
    transfer:'/trænsˈfɜːr/',
    monitor:'/ˈmɑːnɪtər/',
    solve:'/sɑːlv/'
  };

  WORDS.forEach(w=>{
    w.ipaUK=w.ipaUK||w.ipa;
    w.ipaUS=w.ipaUS||us[w.w]||w.ipa;
  });

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
