import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code=fs.readFileSync('rebuild-preview/scene1341-readonly/scene500-readonly-settings.js','utf8');
const memory=new Map();
const window={localStorage:{
 getItem:k=>memory.get(k)??null,
 setItem:(k,v)=>memory.set(k,v)
}};
vm.runInNewContext(code,{window});
const settings=window.PAI_SCENE500_READONLY_SETTINGS.createReadOnlySettings();
const prefs=settings.snapshot();
for(const k of ['showEnglishDefinition','showUsage','showRelations','showExampleTranslations',
                'showCollocations','showExamples','showCompare']){
 assert.equal(prefs[k],true,'default visible '+k);
 assert.equal(settings.set(k,false),true);
 assert.equal(settings.get(k),false);
}
settings.set('showEnglishDefinition',true);
const restored=window.PAI_SCENE500_READONLY_SETTINGS.createReadOnlySettings();
assert.equal(restored.get('showEnglishDefinition'),true);
assert.equal(restored.get('showUsage'),false);
assert.equal(restored.get('showExamples'),false);
restored.reset();
assert.equal(restored.get('showUsage'),true);
assert.equal(restored.get('showExamples'),true);
assert.equal(restored.set('srsEnabled',true),false);
console.log('PASS Scene1341 answer settings: defaults, toggles, isolated persistence, reset, no SRS');
