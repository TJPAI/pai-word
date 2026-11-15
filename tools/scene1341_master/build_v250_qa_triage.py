#!/usr/bin/env python3
"""Build V250 non-certified QA triage queues from the V249 SQLite candidate index."""
import csv,json,sqlite3,sys
from pathlib import Path
def main(dbpath,out):
 out=Path(out);out.mkdir(parents=True,exist_ok=True)
 db=sqlite3.connect(dbpath);db.row_factory=sqlite3.Row
 assert db.execute('SELECT COUNT(*) FROM source_links').fetchone()[0]==230289
 queues={
 'V250_POLYSEMY_PRIORITY.csv':("SELECT e.expression_norm,e.distinct_meanings,e.total_associations,(SELECT COUNT(DISTINCT s.scene_id) FROM source_links s JOIN candidate_groups g ON s.candidate_key=g.candidate_key WHERE g.expression_norm=e.expression_norm) AS scene_count,'待审' AS qa_stage,'SEMANTIC_SPLIT_REQUIRED' AS gate FROM expression_groups e WHERE e.distinct_meanings>1 ORDER BY e.total_associations DESC,e.distinct_meanings DESC,e.expression_norm",['expression_norm','distinct_meanings','total_associations','scene_count','qa_stage','gate']),
 'V250_CROSS_SCENE_REUSE.csv':("SELECT candidate_key,expression_norm,meaning_norm,occurrences,scene_count,first_source_row,'待审' AS qa_stage,'REUSE_CANDIDATE_NOT_CERTIFIED' AS gate FROM candidate_groups WHERE scene_count>1 ORDER BY scene_count DESC,occurrences DESC,candidate_key",['candidate_key','expression_norm','meaning_norm','occurrences','scene_count','first_source_row','qa_stage','gate']),
 'V250_MISSING_MEANING.csv':("SELECT source_final_row,scene_id,expression,source_filename,source_row_number,'待审' AS qa_stage,'MISSING_ZH_HOLD' AS gate FROM source_links WHERE trim(coalesce(meaning_zh,''))='' ORDER BY source_final_row",['source_final_row','scene_id','expression','source_filename','source_row_number','qa_stage','gate']),
 'V250_EXACT_PAIR_REPEAT.csv':("SELECT candidate_key,expression_norm,meaning_norm,occurrences,scene_count,first_source_row,'待审' AS qa_stage,'EXACT_TEXT_NOT_SEMANTIC_ID' AS gate FROM candidate_groups WHERE occurrences>1 ORDER BY occurrences DESC,candidate_key",['candidate_key','expression_norm','meaning_norm','occurrences','scene_count','first_source_row','qa_stage','gate'])
 }
 counts={}
 for filename,(sql,cols) in queues.items():
  with (out/filename).open('w',encoding='utf-8',newline='') as f:
   w=csv.writer(f);w.writerow(cols);n=0
   for row in db.execute(sql):w.writerow([row[c] for c in cols]);n+=1
  counts[filename]=n
 assert counts=={'V250_POLYSEMY_PRIORITY.csv':15582,'V250_CROSS_SCENE_REUSE.csv':17718,'V250_MISSING_MEANING.csv':222,'V250_EXACT_PAIR_REPEAT.csv':17719},counts
 report={'version':'V250_QA_TRIAGE','source':'V249 SQLite index built from frozen FINAL Master','source_sha256':'62dc58fa9e7d4c5a0c7731bd8b970e170002423c82577ab192c890fd82c2b986','queue_counts':counts,'canonical_sense_id_assigned':0,'qa_stage':'待审','release_allowed':False,'policy':'Queue prioritization is not CG-QA review; no semantic merging by normalized text alone.'}
 (out/'CGMASTER_V250_MANIFEST.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 db.close();print(json.dumps(report,ensure_ascii=False))
if __name__=='__main__':main(sys.argv[1],sys.argv[2])
