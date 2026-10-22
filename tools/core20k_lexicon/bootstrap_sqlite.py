#!/usr/bin/env python3
"""Build a staging-only SQLite database from the immutable Core20K V2.0.6 CSV."""
import argparse,csv,hashlib,json,sqlite3,pathlib
EXPECTED='e3f846948363820187707580c0a0189176b121dc08e2b96a1fe9a7126c1399ca'
def main():
    p=argparse.ArgumentParser()
    p.add_argument('--frozen',required=True);p.add_argument('--out',required=True)
    a=p.parse_args();src=pathlib.Path(a.frozen);out=pathlib.Path(a.out);out.mkdir(parents=True,exist_ok=True)
    digest=hashlib.sha256(src.read_bytes()).hexdigest()
    if digest!=EXPECTED:raise ValueError('Frozen source SHA256 mismatch')
    with src.open(encoding='utf-8-sig',newline='') as f:
        rd=csv.DictReader(f)
        if not {'lemma','core20k_rank_final'}<=set(rd.fieldnames or []):raise ValueError('Missing columns')
        rows=[(int(r['core20k_rank_final']),r['lemma'].strip()) for r in rd]
    if len(rows)!=20000 or sorted(r for r,_ in rows)!=list(range(1,20001)) or len({s.casefold() for _,s in rows})!=20000:
        raise ValueError('Frozen membership invariant failed')
    db=out/'core20k_staging.sqlite'
    db.unlink(missing_ok=True)
    con=sqlite3.connect(db)
    con.executescript("""PRAGMA foreign_keys=ON;
CREATE TABLE word(word_id TEXT PRIMARY KEY,core20k_rank INTEGER UNIQUE NOT NULL CHECK(core20k_rank BETWEEN 1 AND 20000),lemma TEXT NOT NULL,lemma_casefold TEXT UNIQUE NOT NULL,frozen_sha256 TEXT NOT NULL);
CREATE TABLE sense_candidate(candidate_id TEXT PRIMARY KEY,word_id TEXT NOT NULL REFERENCES word(word_id),part_of_speech TEXT,english_definition TEXT,chinese_definition TEXT,source_type TEXT NOT NULL DEFAULT 'UNAVAILABLE',evidence_status TEXT NOT NULL DEFAULT 'NOT_AUDITED',review_status TEXT NOT NULL DEFAULT 'NOT_STARTED',content_revision INTEGER NOT NULL DEFAULT 0);
CREATE TABLE verified_ku(ku_id TEXT PRIMARY KEY,candidate_id TEXT UNIQUE NOT NULL REFERENCES sense_candidate(candidate_id),source_ku_id TEXT,identity_review_status TEXT NOT NULL CHECK(identity_review_status='CONFIRMED'),content_review_status TEXT NOT NULL CHECK(content_review_status='INDEPENDENTLY_VERIFIED'));
CREATE TABLE risk_queue(word_id TEXT PRIMARY KEY REFERENCES word(word_id),priority INTEGER NOT NULL DEFAULT 1,risk_reason TEXT NOT NULL,queue_status TEXT NOT NULL DEFAULT 'NOT_STARTED');""")
    for rank,lemma in rows:
        wid=f'c20k-w-{rank:05d}'
        con.execute('INSERT INTO word VALUES(?,?,?,?,?)',(wid,rank,lemma,lemma.casefold(),digest))
        con.execute('INSERT INTO risk_queue VALUES(?,?,?,?)',(wid,1,'UNASSESSED_SENSE_COVERAGE','NOT_STARTED'))
    con.commit()
    counts=con.execute('SELECT (SELECT COUNT(*) FROM word),(SELECT COUNT(*) FROM sense_candidate),(SELECT COUNT(*) FROM verified_ku),(SELECT COUNT(*) FROM risk_queue)').fetchone()
    integrity=con.execute('PRAGMA integrity_check').fetchone()[0]
    con.close()
    if integrity!='ok' or counts!=(20000,0,0,20000):raise RuntimeError('SQLite QA failed')
    report={'baseline_sha256':digest,'membership':counts[0],'sense_candidates':counts[1],'verified_ku':counts[2],'unassessed_words':counts[3],'sqlite_integrity_check':integrity,'status':'STAGING_ONLY_NOT_PRODUCTION_READY'}
    (out/'staging_manifest.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report))
if __name__=='__main__':main()
