// Optional semantic overlay loader. Does not alter the default Hybrid engine.
// Browser ESM: caller supplies fetch and valid scene IDs. Never throws into the homepage.
import {validateSemanticOverlay} from './semantic-overlay-validator.mjs';
export async function loadOptionalSemanticOverlay({enabled=false,url,sceneIds,fetcher=globalThis.fetch}={}) {
  if(!enabled)return {enabled:false,overlay:null,reason:'disabled'};
  if(typeof url!=='string'||!url.trim()||typeof fetcher!=='function')return {enabled:false,overlay:null,reason:'configuration'};
  try{
    const response=await fetcher(url);
    if(!response?.ok)return {enabled:false,overlay:null,reason:'http_error'};
    const payload=await response.json();
    const checked=validateSemanticOverlay(payload,sceneIds);
    if(!checked.ok)return {enabled:false,overlay:null,reason:'invalid_schema',errors:checked.errors};
    return {enabled:true,overlay:payload,reason:'ready'};
  }catch{
    return {enabled:false,overlay:null,reason:'load_error'};
  }
}
