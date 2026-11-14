/* Scene1341 CG-MASTER V165 user-approved learner IPA display-only profile.
 * Copied algorithm from authoritative Master Git blob 8afb22f124b5724dd9b4a52ed262ca6daba6aa9d.
 * Do not mutate Kaikki/Master or certify any Sense. This is typography only.
 */
(function(root){
 'use strict';
 const COMPLETE_IPA = /^([\/\[])([^\/\]\r\n]+)([\/\]])$/u;
function displayEnglishIPA(raw, {language='en'}={}) {
  if(typeof raw!=='string'||!/^en(?:-|$)/iu.test(String(language)))return raw;
  const ipa=raw.trim();
  const m=COMPLETE_IPA.exec(ipa);
  if(!m || (m[1]==='/'&&m[3]!=='/') || (m[1]==='['&&m[3]!==']'))return raw;
  const learner=m[2]
    .replace(/ɹ/gu,'r')
    .replace(/ɡ/gu,'g')
    .replace(/t\u0361ʃ/gu,'tʃ')
    .replace(/d\u0361ʒ/gu,'dʒ');
  return m[1]+learner+m[3];
}

 root.PAI_SCENE1341_V165_IPA_DISPLAY=Object.freeze({
  displayEnglishIPA,
  policy:'EN_IPA_LEARNER_NOTATION_DISPLAY_ONLY_V165',
  sourceBlob:'8afb22f124b5724dd9b4a52ed262ca6daba6aa9d'
 });
})(window);
