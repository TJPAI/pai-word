/**
 * V165 approved English learner-facing IPA notation ONLY.
 * Kaikki/Master source IPA and QA/certification state must not be rewritten.
 * v163 `ɹ` -> `r` ; v165 adds `ɡ` -> `g`, `t͡ʃ` -> `tʃ`, `d͡ʒ` -> `dʒ`.
 */
const COMPLETE_IPA = /^([\/\[])([^\/\]\r\n]+)([\/\]])$/u;
export function displayEnglishIPA(raw, {language='en'}={}) {
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
export function describeEnglishIPADisplay(original,{language='en'}={}) {
  const display=displayEnglishIPA(original,{language});
  return Object.freeze({
    source_ipa:original,display_ipa:display,changed:display!==original,
    source_preserved:true,qa_approved:false,release_allowed:false,
    policy:'EN_IPA_LEARNER_NOTATION_DISPLAY_ONLY_V165'
  });
}
