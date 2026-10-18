// Desktop speech compatibility for Safari/Chrome/Edge.
// iPhone/iPad keep the native gesture-sensitive path in learning-runtime.js.
(function(){
 const ua=navigator.userAgent||'';
 const isiOS=/iPhone|iPad|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 if(isiOS||!('speechSynthesis' in window)||!window.PAI_AUDIO||typeof SpeechSynthesisUtterance==='undefined')return;
 const synth=window.speechSynthesis;
 let voices=[],seq=0,current=null,lastEvent='idle';
 function refresh(){try{voices=synth.getVoices()||[]}catch(_){voices=[]}}
 function pick(lang){refresh();const low=lang.toLowerCase(),base=low.slice(0,2);return voices.find(v=>String(v.lang||'').toLowerCase()===low)||voices.find(v=>String(v.lang||'').toLowerCase().startsWith(base))||null}
 refresh();
 if(synth.addEventListener)synth.addEventListener('voiceschanged',refresh);
 window.PAI_AUDIO.stop=function(){seq++;current=null;lastEvent='stop';try{if(synth.speaking||synth.pending||synth.paused)synth.cancel()}catch(_){}};
 window.PAI_AUDIO.play=function(text,rate=.84,onDone){
  text=String(text||'').trim();if(!text){onDone?.();return}
  const id=++seq,lang=state.voiceAccent==='gb'?'en-GB':'en-US';let finished=false,watchdog=null;
  const done=()=>{if(finished||id!==seq)return;finished=true;if(watchdog)clearTimeout(watchdog);current=null;lastEvent='end';onDone?.()};
  const speakNow=()=>{
   if(id!==seq||finished)return;
   refresh();
   const u=new SpeechSynthesisUtterance(text);current=u;window.__paiUtterance=u;u.lang=lang;u.rate=rate;u.pitch=1;u.volume=1;u.voice=pick(lang);
   u.onstart=()=>{lastEvent='start';if(watchdog){clearTimeout(watchdog);watchdog=null}};
   u.onend=done;
   u.onerror=e=>{lastEvent='error:'+(e?.error||'unknown');done()};
   try{if(synth.paused)synth.resume();lastEvent='speak-called';synth.speak(u)}catch(e){lastEvent='throw:'+String(e);done();return}
   watchdog=setTimeout(()=>{if(id!==seq||finished)return;if(!synth.speaking&&lastEvent==='speak-called')lastEvent='silent-timeout'},500);
  };
  // Critical desktop rule: first real utterance must stay synchronous in the
  // user's click gesture. Do not prime with an empty utterance and do not insert
  // cancel()+setTimeout before the first word.
  if(!synth.speaking&&!synth.pending&&!synth.paused){speakNow();return}
  // For an already-active engine, append the new utterance instead of cancelling
  // the queue. This avoids Chrome/Safari dropping speech after cancel().
  speakNow();
 };
 window.PAI_AUDIO_DIAG=()=>({supported:true,desktop:true,voices:(synth.getVoices()||[]).map(v=>({name:v.name,lang:v.lang,default:v.default})),speaking:synth.speaking,pending:synth.pending,paused:synth.paused,lastEvent,currentText:current?.text||null});
 window.PAI_AUDIO_TEST=()=>window.PAI_AUDIO.play('hello');
})();
