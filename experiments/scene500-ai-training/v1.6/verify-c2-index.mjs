// Scene500 C2 index validation and metadata hashing, browser + Node compatible.
// Index schema: {schema,engineVersion,taxonomyVersion,taxonomyFingerprint,
// catalogFileSha256,model:{id,quantization,sha256,license},scenes:[{sceneId,vector}]}
import {TAXONOMY_VERSION,fingerprintIdentity,validateIdentity} from './scene500-ai-adapter.mjs';
export const INDEX_SCHEMA='scene500-c2-v1';
export async function sha256Bytes(bytes){
 if(!globalThis.crypto?.subtle)throw Error('WebCrypto SHA-256 unavailable');
 const b=await globalThis.crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export async function sha256Text(text){return sha256Bytes(new TextEncoder().encode(text))}
export async function verifyC2Index({catalogText,index,expectedCatalogSha256,expectedIndexSha256,indexText}){
 if(typeof catalogText!=='string')throw TypeError('Raw catalog text required');
 const catalog=JSON.parse(catalogText);
 const catalogSha=await sha256Text(catalogText);
 if(expectedCatalogSha256&&catalogSha!==expectedCatalogSha256)throw Error('Catalog file SHA-256 mismatch');
 const fp=await fingerprintIdentity(catalog);
 if(index?.schema!==INDEX_SCHEMA)throw Error('Index schema mismatch');
 if(index.taxonomyVersion!==TAXONOMY_VERSION||index.taxonomyFingerprint!==fp)throw Error('Taxonomy identity mismatch');
 if(index.catalogFileSha256!==catalogSha)throw Error('Catalog bytes mismatch');
 if(!index.model?.id||!index.model?.quantization||!index.model?.sha256||!index.model?.license)throw Error('Model provenance incomplete');
 if(!/^[a-f0-9]{64}$/.test(index.model.sha256))throw Error('Model SHA-256 invalid');
 validateIdentity({...catalog,taxonomyFingerprint:fp},index);
 if(expectedIndexSha256){
  if(typeof indexText!=='string')throw Error('Raw index text required for byte hash');
  if(await sha256Text(indexText)!==expectedIndexSha256)throw Error('Index file SHA-256 mismatch');
 }
 return {sceneCount:500,taxonomyFingerprint:fp,catalogFileSha256:catalogSha,indexFileSha256:typeof indexText==='string'?await sha256Text(indexText):null,vectorDimensions:index.scenes[0].vector.length,model:index.model};
}
