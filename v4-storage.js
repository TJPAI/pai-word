// Release-scoped persistence bridge for lexicon swaps.
(function(){
  const legacyState=state;
  const preserved={
    newPerDay:legacyState.newPerDay,
    showCollocations:legacyState.showCollocations,
    showExamples:legacyState.showExamples,
    showCompare:legacyState.showCompare,
    hideWord:legacyState.hideWord,
    autoPronounce:legacyState.autoPronounce
  };
  let activeKey=null;
  window.activateLexiconStorage=function(release){
    if(!release)throw Error('词库 release 缺失');
    const key='pai-word-mobile-v1::'+release;
    let stored={};
    try{stored=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch(_){stored={}}
    const defaults={view:'scenes',scene:null,index:0,revealed:false,newPerDay:20,records:{},stats:{known:0,unknown:0}};
    state={...defaults,...preserved,...stored,lexiconRelease:release};
    state.records=stored.records&&typeof stored.records==='object'?stored.records:{};
    state.stats={known:0,unknown:0,...(stored.stats||{})};
    state.daily=stored.daily||null;
    state.learningSession=stored.learningSession||null;
    state.voiceAccent='us';
    activeKey=key;
    save=function(){localStorage.setItem(activeKey,JSON.stringify(state))};
    window.PAI_STORAGE_KEY=key;
    return key;
  };
})();
