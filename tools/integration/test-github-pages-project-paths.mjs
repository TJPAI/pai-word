/* GitHub-only PRE-DEPLOY check. Does not deploy or change Pages.
 * Validate actual static tags under GitHub Pages project-root semantics.
 * No external HTTP requests; no candidate KU inserted into learning.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const html=fs.readFileSync(path.join(root,'rebuild-preview/index.html'),'utf8');
const page=new URL('https://tjpai.github.io/pai-word/rebuild-preview/index.html');
const baseTag=html.match(/<base\s+href="([^"]+)"/i);
assert(baseTag,'Missing preview base tag');
const base=new URL(baseTag[1],page);
assert.equal(base.pathname,'/pai-word/','GitHub Pages project-root base must stay within repository');
let checked=0;
for(const match of html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)="([^"]+)"[^>]*>/gi)){
 const raw=match[1];
 if(raw.startsWith('data:')||raw.startsWith('#'))continue;
 const url=new URL(raw,base);
 if(url.origin!==page.origin)continue; // External library is handled separately as blocker below.
 assert(url.pathname.startsWith('/pai-word/'),'Static asset escaped GitHub Pages project path: '+raw);
 const local=decodeURIComponent(url.pathname.slice('/pai-word/'.length));
 assert(local&&!local.includes('..'),'Invalid project asset '+raw);
 assert(fs.existsSync(path.join(root,local)),'Missing GitHub project-root asset '+raw+' -> '+local);
 checked++;
}
assert(checked>=8,'Unexpectedly few native static assets inspected: '+checked);
assert(html.includes('src="scripts/core20k-approved-overlay-boot.mjs"'),
  'Approved overlay boot must use base-relative project path');
assert(!html.includes('src="../scripts/core20k-approved-overlay-boot.mjs"'),
  'Broken Pages subpath path reintroduced');
const home=fs.readFileSync(path.join(root,'rebuild-preview/home-dashboard.js'),'utf8');
assert(home.includes("get('scene1341')==='1'"));
assert(home.includes("get('scene1341_rec')==='1'"));
assert(home.includes('canCreateStudyQueue:false'));
assert(home.includes('canWriteSrs:false'));
const externalFallback=html.includes('https://cdn.jsdelivr.net/npm/pako@');
const result={
 status:'PASS_SOURCE_PATHS_ONLY',
 mode:'GITHUB_PAGES_PREDEPLOY_NO_PUBLISH',
 staticAssetsChecked:checked,
 projectPrefix:'/pai-word/',
 sourceIndex:'rebuild-preview/index.html',
 experimentalFlag:'scene1341=1',
 officialDeploymentPerformed:false,
 previewPublished:false,
 candidateKuLearningEnabled:false,
 productionSrsWritten:false,
 externalCdnFallbackPresent:externalFallback,
 externalFallbackNeedsReviewBeforeStrictGitHubOnlyExperience:externalFallback
};
console.log(JSON.stringify(result,null,2));
