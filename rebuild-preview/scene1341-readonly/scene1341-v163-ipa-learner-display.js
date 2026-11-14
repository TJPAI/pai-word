/* Scene1341 V163 learner-facing IPA notation; source fields stay byte-identical.
 * Source policy: CG-MASTER tools/scene1341_master/v163_english_ipa_display.mjs
 * Only a complete English /.../ or [...] may display lowercase IPA ɹ as r.
 */
(function(root){
 'use strict';
 const IPA_ENVELOPE=/^([\/\[])([^\/\]\r\n]+)([\/\]])$/u;
 function displayEnglishIPA(raw,{language='en'}={}){
  if(typeof raw!=='string')return raw;
  if(!/^en(?:-|$)/iu.test(language))return raw;
  const original=raw.trim(),match=IPA_ENVELOPE.exec(original);
  if(!match)return raw;
  if((match[1]==='/'&&match[3]!=='/')||(match[1]==='['&&match[3]!==']'))return raw;
  return match[1]+match[2].replace(/ɹ/gu,'r')+match[3];
 }
 root.PAI_SCENE1341_V163_IPA_DISPLAY=Object.freeze({displayEnglishIPA,policy:'EN_IPA_APPROXIMANT_R_TO_LEARNER_R_DISPLAY_ONLY_V163'});
})(window);
