/**
 * CG-MASTER V163 — ENGLISH IPA DISPLAY-ONLY orthographic convention.
 *
 * Master, Kaikki source provenance and QA decision NEVER change.
 * A UI may show "r" for English IPA "ɹ" as learner-dictionary notation.
 * This does not certify any IPA candidate or synthesize any pronunciation.
 */
const IPA_ENVELOPE = /^([\/\[])([^\/\]\r\n]+)([\/\]])$/u;
export function displayEnglishIPA(raw, {language='en'}={}) {
  if(typeof raw!=='string') return raw;
  if(!/^en(?:-|$)/iu.test(language)) return raw;
  const original=raw.trim();
  const match=IPA_ENVELOPE.exec(original);
  if(!match) return raw; // strict whole-string envelope: do not edit notes or markup
  if((match[1]==='/'&&match[3]!=='/') ||
     (match[1]==='['&&match[3]!==']')) return raw;
  // Lowercase IPA U+0279 only; never replace Latin r, rhotic vowel ɚ/ɝ,
  // trill ʀ, or source lexical data. Return transformed presentation string.
  return match[1]+match[2].replace(/ɹ/gu,'r')+match[3];
}
export function describeEnglishIPADisplay(original,{language='en'}={}) {
  const display=displayEnglishIPA(original,{language});
  return Object.freeze({
    source_ipa:original,
    display_ipa:display,
    changed:display!==original,
    source_preserved:true,
    qa_approved:false, // presentation code never asserts source certification
    policy:'EN_IPA_APPROXIMANT_R_TO_LEARNER_R_DISPLAY_ONLY_V163'
  });
}
