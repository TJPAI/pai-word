// Node-only I/O adapter. Browser clients import scene1341-search-core.mjs directly.
import fs from 'node:fs';
import path from 'node:path';
export {csv,buildCatalog} from './scene1341-search-core.mjs';
import {buildCatalog} from './scene1341-search-core.mjs';
export function loadInputs(catalogPath,rankedDir,meta){const files=Array.from({length:11},(_,i)=>path.join(rankedDir,'v'+(i+51)+'-ranked.csv'));return buildCatalog(fs.readFileSync(catalogPath,'utf8'),files.map(p=>fs.readFileSync(p,'utf8')),meta);}
