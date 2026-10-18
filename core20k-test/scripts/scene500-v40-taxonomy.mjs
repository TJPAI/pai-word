// Canonical Scene500 IDs are S001–S500. Old cs IDs are a separate taxonomy.
export function parseScene500Taxonomy(text) {
 const lines=String(text).split(/\r?\n/);
 const scenes=[];
 for(const line of lines){
  const match=/^(S\d{3})\s+(.+?)\s*$/.exec(line);
  if(match)scenes.push({id:match[1],name:match[2]});
 }
 if(scenes.length!==500)throw Error('SCENE500_TAXONOMY_COUNT:'+scenes.length);
 scenes.forEach((s,i)=>{if(s.id!=='S'+String(i+1).padStart(3,'0'))throw Error('SCENE500_TAXONOMY_ORDER')});
 return scenes;
}
export function validateScene500Inventory(inventory,specs) {
 if(inventory?.schema!=='pai-scene500-core20k-v40-inventory-v1')throw Error('SCENE500_INVENTORY_SCHEMA');
 const keys=Object.keys(inventory.scenes||{});
 if(keys.length!==500||specs.length!==500)throw Error('SCENE500_INVENTORY_COVERAGE');
 const expected=new Set(specs.map(s=>s.id));
 for(const id of keys)if(!expected.has(id))throw Error('SCENE500_UNKNOWN_ID:'+id);
 return true;
}
