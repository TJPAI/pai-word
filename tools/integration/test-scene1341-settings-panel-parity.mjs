import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const ui=readFileSync('rebuild-preview/scene1341-readonly/index.html','utf8');
const native=readFileSync('rebuild-preview/learning-runtime.js','utf8');
const block=ui.slice(ui.indexOf('<section id="settings-page"'),ui.indexOf('</section>',ui.indexOf('<section id="settings-page"')));
assert.ok(block.length>3000,'full settings panel extracted');
assert.match(native,/class="screen panel-screen"/,'Scene500 uses native panel-screen');
assert.match(native,/class="panel-top"/,'Scene500 uses native panel-top');
assert.match(native,/<h3>记忆算法<\/h3>/,'Scene500 has algorithm block');
assert.match(block,/class="screen panel-screen settings-screen"/,'Scene1341 must use same panel screen');
assert.match(block,/class="panel-top settings-page-header"/,'Scene1341 must inherit native panel header');
assert.match(block,/<h3>记忆算法<\/h3>/,'Scene1341 must retain source-equivalent section order');
assert.match(block,/<strong>Basic SRS（正式系统）<\/strong>/,'algorithm remains explicitly non-writable');
assert.match(block,/id="settings-panel" class="panel-block"/);
for(const key of ['autoBrowseInterval','speechSpeed','voiceAccent','hideWord',
 'showExamples','showCollocations','showCompare','showEnglishDefinition','showUsage',
 'showRelations','showExampleTranslations','autoPronounce.question','autoPronounce.swipe']){
 assert.ok(block.includes('data-setting="'+key+'"')||block.includes('data-toggle-setting="'+key+'"'),
  'setting control must be accessible '+key);
}
const diagnostics=block.indexOf('id="scene1341-master-diagnostics"');
const reset=block.indexOf('id="settings-reset"');
assert.ok(diagnostics>0&&reset>diagnostics,'source audit controls must be collapsed before reset');
assert.match(block,/<details id="scene1341-version-diagnostics"/);
assert.match(block,/id="master-ipa-coverage"/);
assert.match(block,/id="preview-build-version"/);
assert.doesNotMatch(block,/PAI_RESET_TEST_SYSTEM\(/,
 'Scene1341 cannot expose Scene500 destructive persistent-data reset action');
assert.doesNotMatch(ui,/Scene1341 Master V116\+V128\+V153\+V154/,
 'site version labels must not claim outdated static Master builds');
console.log('PASS: Scene1341 settings inherit Scene500 panel structure; extra Master diagnostics collapsed and SRS isolated');
