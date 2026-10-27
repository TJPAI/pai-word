// Historical V0.10.1 real-hybrid snapshots are provenance-pinned, NOT live engine execution.
// Compare exactly matching query strings only; never present as same-machine latency.
import fs from 'node:fs';
import {createMicroRec} from './microrec.mjs';
import {createIntentAware} from './intent-aware.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const catalog=read('../../scene500-recommendation/catalog-v0.2.json');
const snap=read('../../scene500-recommendation/qa/v0101-real-hybrid-top5-20261026.json');
const known=read('../../scene500-recommendation/qa/generalization-probe-20-v1.json').cases;
const pro=read('../../scene500-recommendation/qa/prospective-24-v1.json').cases;
const hold=read('../../scene500-recommendation/qa/holdout-20-editorial-v1.json').cases;
const labels=[...known,...pro,...hold];
const micro=createMicroRec(catalog),intent=createIntentAware(catalog);
const reports=[];
for(const row of snap.queries){
 const label=labels.find(x=>x.query===row.query);
 const expected=label?.expected||label?.relevant||[];
 const blocked=label?.excluded||[];
 const systems={
  'pinned-v0101-hybrid':row.top10||row.top5.map(x=>x.id),
  lexical:micro.search(row.query,{method:'lexical',limit:10}).map(x=>x.sceneId),
  hybrid:micro.search(row.query,{method:'hybrid',limit:10}).map(x=>x.sceneId),
  intent: intent.search(row.query,{limit:10}).map(x=>x.sceneId)
 };
 reports.push({query:row.query,expected:expected.length?expected:null,excluded:blocked.length?blocked:null,results:Object.fromEntries(Object.entries(systems).map(([name,ids])=>[name,{top5:ids.slice(0,5),top1_hit:expected.length?expected.includes(ids[0]):null,top5_hit:expected.length?ids.slice(0,5).some(id=>expected.includes(id)):null,excluded_leak:blocked.length?ids.slice(0,5).some(id=>blocked.includes(id)):null}]))});
}
const labeled=reports.filter(x=>x.expected);
const sum=names=>Object.fromEntries(names.map(name=>[name,{labeled:labeled.length,top1:labeled.length?labeled.filter(x=>x.results[name].top1_hit).length:null,top5:labeled.length?labeled.filter(x=>x.results[name].top5_hit).length:null}]));
const output={status:'HISTORICAL_SNAPSHOT_SIDE_BY_SIDE_NOT_LIVE',snapshotStatus:snap.status,inputSHA:snap.sha256,source_queries:snap.queries.length,labeled_matches:labeled.length,summary:sum(['pinned-v0101-hybrid','lexical','hybrid','intent']),rows:reports,warning:'Historical real-asset snapshot only; snapshot itself explicitly says structural-only, and input assets are not reproduced here. Not blind and not comparable CPU timings.'};
console.log(JSON.stringify(output,null,2));
if(process.argv.includes('--write'))fs.writeFileSync(new URL('./historical-hybrid-comparison.json',import.meta.url),JSON.stringify(output,null,2)+'\n');
