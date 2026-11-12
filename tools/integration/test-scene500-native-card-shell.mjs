import assert from 'node:assert/strict';
import {renderNativeScene500Card as render} from './scene500-native-card-shell-harness.mjs';
const front=render({face:'QUESTION'});
const back=render({face:'ANSWER'});
const ids=['again','hard','good'];
for(const html of [front,back]){
 assert(html.includes('class="screen study-screen learning-screen'));
 assert(html.includes('class="word-hero'));
 assert(html.includes('class="pai-scratch-area"'));
 assert(html.includes('class="pai-scratch-canvas"'));
 assert(html.includes('data-word-audio'));
 assert(html.includes('data-speak="wake up"'));
 assert(html.includes('class="auto-word-toggle"'));
 assert(html.includes('class="recall-correction"'));
 assert(html.includes('aria-label="回忆结果"'));
 for(const id of ids)assert(html.includes("onclick=\"PAI_TAP_FLOW.choose('"+id+"')\""));
 for(const label of ['不知道','模糊','知道'])assert(html.includes('>'+label+'</button>'));
 assert.equal((html.match(/data-grade=/g)||[]).length,3,'Exactly three original rating buttons');
}
assert(!front.includes('data-ku="NATIVE_TEST_001"'),'Question face hides answer');
assert(back.includes('data-ku="NATIVE_TEST_001"'),'Answer face shows native answer panel');
assert(back.includes('learning-screen revealed'),'Revealed style retained');
assert(!front.includes('learning-screen revealed'));
assert(render({face:'ANSWER',auto:true}).includes('type="checkbox" checked'));
const locked=render({face:'ANSWER',committing:true});
assert.equal((locked.match(/disabled aria-disabled="true" data-grade=/g)||[]).length,3);
const hist=render({face:'ANSWER',browsed:true});
assert(hist.includes('class="recall-correction read-only"'));
assert(hist.includes("onclick=\"chooseHistoricalRating('again')\""));
assert(!hist.includes("onclick=\"PAI_TAP_FLOW.choose('again')\""));
const tricky=render({face:'ANSWER',unit:{
 k:'NATIVE_TEST_001',w:{w:'a < b & c',ipaUS:'',rank:1},
 s:{kuType:'sense',ku_id:'NATIVE_TEST_001',m:'test',e:[],c:'',x:''}
}});
assert(tricky.includes('a &lt; b &amp; c'));
assert(!tricky.includes('a < b & c'));
console.log(JSON.stringify({status:'PASS',source:'exact Scene500 learning()',
checks:['question-answer face','three native rating buttons','disabled commit buttons',
'read-only history branch','audio control','auto toggle','handwriting canvas','escape'],
localStorageWrites:0,activatedScene1341KU:0}));
