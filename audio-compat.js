// Desktop speech compatibility for Safari/Chrome/Edge.
// iPhone/iPad keep the native gesture-sensitive path in learning-runtime.js.
(function(){
 const ua=navigator.userAgent||'';
 const isiOS=/iPhone|iPad|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 if(isiOS||!('speechSynthesis' in window)||!window.PAI_AUDIO||typeof SpeechSynthesisUtterance==='undefined')return;
 const synth=window.speechSynthesis;
 let voices=[],seq=0,current=null,primed=false;
 function refresh(){try{voices=synth.getVoices()||[]}catch(_){voices=[]}}
 function pick(lang){refresh();const low=lang.toLowerCase(),base=low.slice(0,2);return voices.find(v=>String(v.lang||'').toLowerCase()===low)||voices.find(v=>String(v.lang||'').toLowerCase().startsWith(base))||null}
 refresh();
 if(synth.addEventListener)synth.addEventListener('voiceschanged',refresh);
 // Prime desktop speech on the first genuine user gesture. The empty utterance is
 // intentionally inaudible; it only wakes engines that stay dormant until input.
 function prime(){
  if(primed)return;primed=true;refresh();
  try{if(synth.paused)synth.resume();const u=new SpeechSynthesisUtterance('');u.volume=0;synth.speak(u)}catch(_){}
 }
 document.addEventListener('pointerdown',prime,{capture:true,once:true});
 document.addEventListener('keydown',prime,{capture:true,once:true});
 window.PAI_AUDIO.stop=function(){seq++;current=null;try{if(synth.speaking||synth.pending||synth.paused)synth.cancel()}catch(_){}};
 window.PAI_AUDIO.play=function(text,rate=.84,onDone){
  text=String(text||'').trim();if(!text){onDone?.();return}
  prime();const id=++seq,lang=state.voiceAccent==='gb'?'en-GB':'en-US';let attempt=0,finished=false,watchdog=null;
  const done=()=>{if(finished||id!==seq)return;finished=true;if(watchdog)clearTimeout(watchdog);current=null;onDone?.()};
  const speakAttempt=()=>{
   if(id!==seq||finished)return;attempt++;
   refresh();
   const u=new SpeechSynthesisUtterance(text);current=u;window.__paiUtterance=u;u.lang=lang;u.rate=rate;u.pitch=1;u.volume=1;u.voice=pick(lang);
   let started=false;
   u.onstart=()=>{started=true;if(watchdog){clearTimeout(watchdog);watchdog=null}};
   u.onend=done;
   u.onerror=()=>{if(attempt<2){try{synth.cancel()}catch(_){};setTimeout(speakAttempt,80)}else done()};
   try{if(synth.paused)synth.resume();synth.speak(u)}catch(_){if(attempt<2)setTimeout(speakAttempt,80);else done();return}
   // Some desktop engines accept speak() but silently drop the first utterance.
   // Retry once if neither onstart nor the engine's speaking state appears.
   watchdog=setTimeout(()=>{
    if(id!==seq||finished||started)return;
    if(synth.speaking){started=true;return}
    if(attempt<2){try{synth.cancel()}catch(_){};setTimeout(speakAttempt,80)}else done();
   },350);
  };
  // Avoid cancel()+speak() in one task on Chromium/Safari.
  try{
   if(synth.speaking||synth.pending||synth.paused){synth.cancel();setTimeout(speakAttempt,80)}else speakAttempt();
  }catch(_){speakAttempt()}
 };
 window.PAI_AUDIO_DIAG=()=>({supported:true,desktop:true,voices:(synth.getVoices()||[]).map(v=>({name:v.name,lang:v.lang,default:v.default})),speaking:synth.speaking,pending:synth.pending,paused:synth.paused,primed});
})();
