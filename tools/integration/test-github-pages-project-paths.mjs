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
const page=new URL('https://tjpai.github.io/pai-word-preview/v22-integration/rebuild-preview/index.html');
const baseTag=html.match(/<base\s+href="([^"]+)"/i);
assert(baseTag,'Missing preview base tag');
const base=new URL(baseTag[1],page);
assert.equal(base.pathname,'/pai-word-preview/v22-integration/','GitHub Pages original fixed v22-integration root');
let checked=0;
for(const match of html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)="([^"]+)"[^>]*>/gi)){
 const raw=match[1];
 if(raw.startsWith('data:')||raw.startsWith('#'))continue;
 const url=new URL(raw,base);
 if(url.origin!==page.origin)continue; // External library is handled separately as blocker below.
 assert(url.pathname.startsWith('/pai-word-preview/v22-integration/'),'Static asset escaped approved preview path: '+raw);
 const local=decodeURIComponent(url.pathname.slice('/pai-word-preview/v22-integration/'.length));
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
assert(home.includes('const scene1341Mode=true;'));
assert(home.includes('const scene1341RecExperiment=true;'));
assert(home.includes('canCreateStudyQueue:false'));
assert(home.includes('canWriteSrs:false'));
assert(!html.includes('https://cdn.jsdelivr.net'),'Third-party CDN must not load in GitHub-only preview');
assert(!html.includes('raw.githack'),'Third-party preview host must not appear in preview HTML');
assert(html.includes('CORE20K_GZIP_NATIVE_REQUIRED_GITHUB_ONLY'),'Unsupported native gzip must fail closed without third-party downloads');
const externalFallback=false;
const result={
 status:'PASS_SOURCE_PATHS_ONLY',
 mode:'GITHUB_PAGES_PREDEPLOY_NO_PUBLISH',
 staticAssetsChecked:checked,
 projectPrefix:'/pai-word-preview/v22-integration/',
 sourceIndex:'rebuild-preview/index.html',
 experimentalFlag:'none; Scene1341 default',
 officialDeploymentPerformed:false,
 previewPublished:false,
 candidateKuLearningEnabled:false,
 productionSrsWritten:false,
 externalCdnFallbackPresent:externalFallback,
 externalFallbackNeedsReviewBeforeStrictGitHubOnlyExperience:externalFallback
};
console.log(JSON.stringify(result,null,2));
