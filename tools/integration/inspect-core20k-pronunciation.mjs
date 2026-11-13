import fs from 'node:fs';import zlib from 'node:zlib';
const raw=JSON.parse(zlib.gunzipSync(fs.readFileSync('data/core20k-runtime.json.gz')).toString('utf8'));
const entries=Array.isArray(raw)?raw:Array.isArray(raw.words)?raw.words:Array.isArray(raw.entries)?raw.entries:Object.values(raw).find(Array.isArray)||[];
console.log('CORE20K_IPA_INSPECT '+JSON.stringify({type:typeof raw,keys:Array.isArray(raw)?[]:Object.keys(raw).slice(0,25),count:entries.length,sample:entries.slice(0,3),wake:entries.filter(x=>JSON.stringify(x).includes('"wake"')).slice(0,2)}).slice(0,7000));
