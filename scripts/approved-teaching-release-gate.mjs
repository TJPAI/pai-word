// Release gate for teaching overlays. Data outside a signed-off release never becomes a UI Map.
export function createApprovedTeachingMap(release){
 if(release?.status!=='PRODUCTION_READY'||release?.production_ready!==true||
    release?.activation?.allowed!==true||release?.source_rights_cleared!==true||
    release?.official_membership_verified!==true||!Array.isArray(release.records))
  return Object.freeze({enabled:false,accepted:new Map()});
 const accepted=new Map();
 for(const card of release.records){
  if(typeof card?.ku_id!=='string'||!card.ku_id.trim()||
     typeof card?.official_sense_id!=='string'||!card.official_sense_id.trim()||
     card.activation_allowed!==true||accepted.has(card.ku_id))
   return Object.freeze({enabled:false,accepted:new Map()});
  accepted.set(card.ku_id,card);
 }
 if(!accepted.size)return Object.freeze({enabled:false,accepted:new Map()});
 return Object.freeze({enabled:true,accepted});
}
