/* CG-MAIN independent full-page source audit.
 * Unlike a substring-only 'all parity' claim, this differentiates same-source
 * code from copied/adapted code. PASS means audit executed, not parity passed.
 */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const sha=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0'+s).digest('hex');
const original={
 index:read('../../rebuild-preview/index.html'),
 welcome:read('../../rebuild-preview/welcome.js'),
 home:read('../../rebuild-preview/home-dashboard.js'),
 learner:read('../../rebuild-preview/learning-runtime.js')
};
const originalExpected={
 index:'4f68df5f88b7baa64a30be643232d22374034055',
 welcome:'94ac15a3f52ab2a78e228b8a80ba3d7229c5cf44',
 home:'14570b9dec288f139be0fc9e843e3e8683f99a6f',
 learner:'c4efe24fd4705653073d9712995140ed016a3d1d'
};
for(const [key,source] of Object.entries(original))
 assert.equal(sha(source),originalExpected[key],'Source Scene500 has changed: '+key);
const standalone=read('../../rebuild-preview/scene1341-readonly/index.html');
const welcome=read('../../rebuild-preview/scene1341-readonly/scene1341-welcome.js');
const phase=read('../../rebuild-preview/scene1341-readonly/scene500-readonly-phase.js');
const prefs=read('../../rebuild-preview/scene1341-readonly/scene500-readonly-settings.js');
const handwriting=read('../../rebuild-preview/scene1341-readonly/scene500-native-scratch.js');
const enlex=JSON.parse(read('../../rebuild-preview/scene1341-readonly/scene1341-enlex-v2-exact-preview.json'));
const phon=JSON.parse(read('../../rebuild-preview/scene1341-readonly/scene1341-ipa-preview.json'));
const qaLoader=read('../../rebuild-preview/scene1341-readonly/scene1341-qa-preview-loader.mjs');
const rec=read('../../rebuild-preview/scene1341-readonly/scene1341-rec-bridge.mjs');
const inline=standalone.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(inline,'Scene1341 learning runtime missing');
new vm.Script(inline,{filename:'scene1341-readonly-inline'});
const audit=[
 {page:'welcome',module:'onboarding',sourceShared:sha(welcome)===sha(original.welcome),behaviorTested:true,exactParityCertified:false,
  evidence:'Separate welcome script, native welcome CSS, isolated seen-key'},
 {page:'home',module:'homepage',sourceShared:standalone.includes('src="../home-dashboard.js"'),behaviorTested:true,exactParityCertified:false,
  evidence:'Scene1341 bespoke renderHome() instead of original home-dashboard.js renderHome()'},
 {page:'home',module:'recommendations',sourceShared:false,behaviorTested:true,exactParityCertified:false,
  evidence:'CG-REC source-pinned search adapter; native scene lists and page structures separately rendered'},
 {page:'home',module:'recent_learning',sourceShared:false,behaviorTested:true,exactParityCertified:false,
  evidence:'Independent Scene1341 bookmark; cannot import legacy Scene500 study history'},
 {page:'question',module:'study_template',sourceShared:standalone.includes('src="../learning-runtime.js"'),behaviorTested:true,exactParityCertified:false,
  evidence:'Scene1341 custom renderCard, native Scene500 uses learning-runtime.js learning()'},
 {page:'question',module:'ipa',sourceShared:false,behaviorTested:true,exactParityCertified:false,
  evidence:'Separate 1,073/1,778 IPA reference, 705 unverified, never claim phrase-level certification'},
 {page:'answer',module:'answer_renderer',sourceShared:standalone.includes('window.answerHtml('),behaviorTested:true,exactParityCertified:false,
  evidence:'Separate Answer-only renderCard vs native answerHtml(u), difference in optional content'},
 {page:'answer',module:'grade_controller',sourceShared:standalone.includes('PAI_TAP_FLOW.choose('),behaviorTested:true,exactParityCertified:false,
  evidence:'Scene1341 read-only phaseController and transientRatings; native uses actual grade/SRS state machine'},
 {page:'learning',module:'manual_batch_navigation',sourceShared:standalone.includes('PAI_NAVIGATE_LEARNING'),behaviorTested:true,exactParityCertified:false,
  evidence:'Independent move and moveBatch; batch circle tests exist but source not shared'},
 {page:'learning',module:'auto_navigation',sourceShared:standalone.includes('window.setAutoBrowse('),behaviorTested:true,exactParityCertified:false,
  evidence:'Separate createReadOnlyAutoBrowse; native has different timer and phase owners'},
 {page:'learning',module:'handwriting',sourceShared:sha(handwriting)===sha(original.learner),behaviorTested:true,exactParityCertified:false,
  evidence:'Separate copied Scene500 handwrite adapter; source synchronization and Safari touch remain'},
 {page:'learning',module:'speech',sourceShared:standalone.includes('PAI_AUDIO.play('),behaviorTested:true,exactParityCertified:false,
  evidence:'Separate playWord() with Web Speech, native uses window.PAI_AUDIO'},
 {page:'settings',module:'preferences',sourceShared:sha(prefs)===sha(original.learner),behaviorTested:true,exactParityCertified:false,
  evidence:'Same 10/25/50 and 0.9/1.5/3/6 options, separate namespace and implementation'},
 {page:'statistics',module:'statistics',sourceShared:false,behaviorTested:false,exactParityCertified:false,
  evidence:'Scene1341 preview-only transient grade counts vs native learning stats'},
 {page:'navigation',module:'lifecycle_and_resume',sourceShared:false,behaviorTested:true,exactParityCertified:false,
  evidence:'Different resume state, background/visibility handling, manual Safari end-to-end necessary'}
];
assert.equal(audit.length,15);
assert(welcome.includes('pai-word-scene1341-welcome-seen-v1'));
assert(standalone.includes('1,341')&&standalone.includes('为你推荐'));
assert(standalone.includes('sorted.slice(start,start+5)'),'Native five-result pagination regression');
assert(standalone.includes('scene1341-rec-bridge.mjs'));
assert(standalone.includes('scene1341-qa-preview-loader.mjs'));
assert(standalone.includes('scene500-readonly-phase.js'));
assert(standalone.includes('scene500-native-scratch.js'));
assert(standalone.includes('scene500-readonly-settings.js'));
assert(standalone.includes('scene1341-ipa-preview.mjs'));
assert(standalone.includes('scene1341-enlex-preview.mjs'));
assert(standalone.includes('#learning.demo-learning[hidden],#home.demo-home[hidden]{display:none!important}'));
assert(phase.includes('createReadOnlyPhaseController'));
assert(phase.includes('createReadOnlyAutoBrowse'));
assert(prefs.includes('pai-word-scene1341-readonly-preferences-v1'));
assert(enlex.source_sense_count===27471);
assert(phon.sourceCore20kWords===20000&&phon.sourceQAprovisionalKU===1778);
assert(phon.coveredWords+phon.coveredCompositionalPhrases+phon.missing===1778);
assert(phon.entries['SC1341-KU-00001'].ipa==='/weɪk ʌp/');
assert(qaLoader.includes('canWriteSrs:false'));
assert(rec.includes('canWriteSrs:false'));
assert(standalone.includes('data-srs-write="disabled"'));
const independent=audit.filter(x=>!x.sourceShared);
const exact=audit.filter(x=>x.exactParityCertified);
assert(independent.length>=10,'Do not misrepresent copied adapters as the same source');
assert.equal(exact.length,0,'Do not claim source-exact UI parity before native-controller consolidation');
const report={
 auditStatus:'PASS_WITH_OPEN_PARITY_GAPS',
 warning:'Audit tests pass, not proof of iPhone pixel/behavior equivalence',
 baseline:'original Scene500 source, four Git Blob SHA locked',
 surfaceCount:audit.length,
 sameSourceModules:audit.filter(x=>x.sourceShared).length,
 independentlyImplementedModules:independent.length,
 exactParityCertifiedModules:exact.length,
 quarantinedKUs:1778,
 ipaReferenceCovered:1073,
 ipaMissing:705,
 originalScene500Unchanged:true,
 approvedForAutomaticDeploy:false,
 productionSrsWrites:0,
 modules:audit
};
console.log('SCENE1341_FULL_PARITY_AUDIT '+JSON.stringify(report));
