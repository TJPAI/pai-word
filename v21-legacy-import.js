// Preserve legacy records as historical self-report evidence without inventing mastery.
(function(){
  const E=window.PAI_EVIDENCE;
  function safeId(value){return String(value).replace(/[^a-zA-Z0-9_.:-]/g,'_')}
  async function run(){
    if(!E||!window.PAI_CORE)return {imported:0,skipped:true};
    const marker=await E.getMeta('legacy_self_report_import_v1');
    if(marker?.complete)return marker;
    let imported=0,seen=0;
    for(const [kuId,record] of Object.entries(state.records||{})){
      if(!window.PAI_CORE.byKU.has(kuId))continue;
      seen++;
      const target={target_id:`${kuId}::meaning`,ku_id:kuId,type:'meaning',content_version:state.lexiconRelease||'Core-13000 V25.5'};
      const stamp=Number(record?.last)||0;
      const event=E.makeEvent({
        event_id:`legacy_srs_${safeId(kuId)}_${stamp}`,
        session_id:'legacy-import',ku_id:kuId,target_id:target.target_id,
        event_type:'legacy_srs_snapshot',
        result:record?.lastKnown===true?'self_report_known':record?.lastKnown===false?'self_report_unknown':'historical_record',
        evidence_type:'legacy_self_report',hint_used:false,active_duration:0,
        occurred_at:stamp?new Date(stamp).toISOString():new Date().toISOString(),
        content_version:state.lexiconRelease||'Core-13000 V25.5',
        legacy_record:{due:record?.due??null,interval:record?.interval??null,reps:record?.reps??null,lastKnown:record?.lastKnown??null}
      });
      const result=await E.commit({event,target});if(!result.duplicate)imported++;
    }
    const done={complete:true,seen,imported,finished_at:new Date().toISOString()};await E.putMeta('legacy_self_report_import_v1',done);return done;
  }
  window.PAI_V21_LEGACY_IMPORT={run};
})();
