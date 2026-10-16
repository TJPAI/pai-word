// Desktop Chromium speech compatibility. Keeps iOS/Safari behavior untouched.
(function(){
 const ua=navigator.userAgent||'';
 if(!/Chrome\//.test(ua)||/CriOS|Android/.test(ua)||!('speechSynthesis' in window)||!window.PAI_AUDIO)return;
 const synth=window.speechSynthesis;let voices=[],seq=0,current=null;
 function refresh(){voices=synth.getVoices()||[]}
 refresh();if(synth.addEventListener)synth.addEventListener('voiceschanged',refresh);
 function pick(lang){refresh();const low=lang.toLowerCase();return voices.find(v=>String(v.lang||'').toLowerCase()===low)||voices.find(v=>String(v.lang||'').toLowerCase().startsWith(low.slice(0,2)))||null}
 window.PAI_AUDIO.stop=function(){seq++;current=null;if(synth.speaking||synth.pending||synth.paused)synth.cancel()};
 window.PAI_AUDIO.play=function(text,rate=.84,onDone){
  if(!text){onDone?.();return}
  const id=++seq,lang=state.voiceAccent==='gb'?'en-GB':'en-US';
  const speakNow=()=>{
   if(id!==seq)return;
   const u=new SpeechSynthesisUtterance(String(text));current=u;window.__paiUtterance=u;u.lang=lang;u.rate=rate;u.voice=pick(lang);
   let ended=false;const done=()=>{if(ended||id!==seq)return;ended=true;current=null;onDone?.()};u.onend=done;u.onerror=done;
   if(synth.paused)synth.resume();
   try{synth.speak(u)}catch(_){done()}
  };
  // Chrome can drop an utterance when cancel() and speak() happen in the same task.
  if(synth.speaking||synth.pending||synth.paused){synth.cancel();setTimeout(speakNow,0)}else speakNow();
 };
})();
