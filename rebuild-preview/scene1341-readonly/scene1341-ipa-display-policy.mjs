/* Scene1341 preview-only IPA provenance gate.
 * Word-by-word Core20K assemblies are NEVER verified complete phrase IPA.
 * Render as a missing whole-phrase reading, without fabricating certification.
 * No mutation of frozen Core20K or any SRS namespace.
 */
export function describeScene1341IPA(card, reference=null){
  const direct=String(card?.ipa||card?.ipa_us||'').trim();
  // A bare KU field has no authoritative Kaikki provenance in provisional V51.
  // It remains a visibly unverified source hint; never certify implicitly.
  if(direct)return Object.freeze({text:direct,status:'unverified',title:'KU自带音标：来源及完整表达对应关系尚未独立审核'});
  if(!reference)return Object.freeze({text:'音标待补',status:'missing',title:'完整表达音标待Kaikki来源核验'});
  if(reference.kind==='word_by_word')return Object.freeze({
    text:'词组音标待核验',status:'compositional-only',
    title:'仅有Core20K逐词拼接参考；不作为完整词组IPA显示或认证'
  });
  if(reference.kind==='word'&&typeof reference.ipa==='string'&&reference.ipa.trim())return Object.freeze({
    text:reference.ipa.trim(),status:'lexical-reference',
    title:'Core20K单词词头IPA参考；尚未完成Kaikki逐项复核'
  });
  return Object.freeze({text:'音标待补',status:'missing',title:'IPA来源或对应范围未通过预览门禁'});
}
