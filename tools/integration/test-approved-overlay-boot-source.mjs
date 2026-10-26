import assert from 'node:assert/strict';
globalThis.window={PAI_APPROVED_OVERLAY_CONFIG:{enabled:false}};
const {approvedOverlaySourceUrl,bootApprovedOverlay}=await import('../../scripts/core20k-approved-overlay-boot.mjs');
const base='https://tjpai.github.io/pai-word-preview/v22-integration/rebuild-preview/index.html';
for(const good of ['../data/approved.json','https://tjpai.github.io/pai-word-preview/v22-integration/data/approved.json']){
 assert.equal(approvedOverlaySourceUrl(good,base)?.startsWith('https://tjpai.github.io/'),true);
}
for(const bad of ['https://evil.example/pack.json','//evil.example/pack.json','javascript:alert(1)','data:text/plain,hello','https://user:pass@tjpai.github.io/x','/foo.json?version=1','/foo.json#fragment']){
 assert.equal(approvedOverlaySourceUrl(bad,base),null,bad);
}
assert.equal((await bootApprovedOverlay()).enabled,false);
assert.equal(window.PAI_APPROVED_TEACHING_OVERLAY.enabled,false);
import fs from 'node:fs';
const boot=fs.readFileSync('scripts/core20k-approved-overlay-boot.mjs','utf8');
for(const reason of ['release_gate','unsigned_distribution','distribution_hash_mismatch']){
 assert(boot.includes("return epoch===bootEpoch?fail('"+reason+"')"),'stale async failure must not clear newer overlay: '+reason);
}
assert(boot.includes('response.redirected===true'),'reject redirected responses');
assert(boot.includes("approvedOverlaySourceUrl(response.url,import.meta.url)!==url"),'verify final response URL matches pinned requested URL');
console.log('PASS approved overlay boot refuses cross-origin/unsafe URLs and stays default-off');
