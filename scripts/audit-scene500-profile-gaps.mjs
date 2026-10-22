import fs from 'node:fs';
import crypto from 'node:crypto';
const [catalogPath,linksPath,outPath]=process.argv.slice(2);
if(!catalogPath||!linksPath||!outPath)throw Error('Usage: node audit-scene500-profile-gaps.mjs catalog.json associations.json output.json');
const catalogBytes=fs.readFileSync(catalogPath);
const catalog=JSON.parse(catalogBytes), associations=JSON.parse(fs.readFileSync(linksPath));
const sha=crypto.createHash('sha256').update(catalogBytes).digest('hex');
if(catalog.scene_count!==500||Object.keys(catalog.scenes||{}).length!==500||associations.scene_count!==500||associations.source?.catalog_sha256!==sha)
 throw Error('SCENE500_PROFILE_AUDIT_SOURCE_MISMATCH');
const counts=new Map(),types=new Map();
for(const link of associations.links){
 if(!catalog.scenes[link.scene_id])throw Error('Unknown scene '+link.scene_id);
 counts.set(link.scene_id,(counts.get(link.scene_id)||0)+1);
 if(!types.has(link.scene_id))types.set(link.scene_id,new Set());
 types.get(link.scene_id).add(link.evidence_type);
}
const rows=Object.entries(catalog.scenes).map(([scene_id,s])=>({
 scene_id,name:s.name,edge_count:counts.get(scene_id)||0,
 alias_count:(s.aliases||[]).length,action_count:(s.actions||[]).length,
 object_count:(s.objects||[]).length,
 evidence_types:[...(types.get(scene_id)||[])].sort(),
 quality:s.quality
}));
const gap=rows.filter(r=>!r.alias_count&&!r.action_count).sort((a,b)=>a.edge_count-b.edge_count||a.scene_id.localeCompare(b.scene_id));
const other=rows.filter(r=>r.alias_count||r.action_count);
const sum=a=>a.reduce((v,x)=>v+x.edge_count,0);
const round=x=>Math.round(x*1000)/1000;
const result={
 schema:'scene500-profile-gap-audit-v0.1',status:'lexical_evidence_only_not_semantic_verified',
 catalog_sha256:sha,association_version:associations.association_version,
 summary:{scenes:rows.length,association_edges:associations.links.length,
 missing_both_aliases_and_actions:gap.length,weak_edge_total:sum(gap),
 other_edge_total:sum(other),weak_mean_edges:round(sum(gap)/gap.length),
 other_mean_edges:round(sum(other)/other.length),
 weak_scenes_with_at_most_3_edges:gap.filter(x=>x.edge_count<=3).length},
 priority_first_50:gap.slice(0,50),all_gap_scenes:gap
};
fs.writeFileSync(outPath,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result.summary));
