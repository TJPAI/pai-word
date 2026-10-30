# V106 real source artifact status and correction

Run: https://github.com/TJPAI/pai-word/actions/runs/40981545105
Artifact ID: 12945425804; run FAILED only because Kaikki English was deliberately blocked.

| Source | Bytes | SHA256 |
|---|---:|---|
| OEWN 2025 | 9,986,555 | 7d749f6e2c39e6970e4997839dcf6e42fd281f3c2fae0171d2192bae8cfa4b51 |
| ECDICT | 66,009,548 | d1ecbdf9ee2b920afb6f430ca6b6bb9f559588cf0dff86e04bd255f9390843cc |
| OMW-cmn | 2,547,674 | 810c6f955bc0fd0f6d75d7d0ea01988c943a5972b6320aae008ad43225dca741 |
| zh Wiktionary raw extract (gzip) | 234,450,611 | 8766e654e9db3879a785c3f7aa9ce6f5b22b5a3b5ce223a12f6afcaa84cc5b84 |
| English Kaikki | BLOCKED | not acquired |

The acquired zh Wiktionary gzip actually opens and parses JSONL; examples include Chinese-language lexical entries with Chinese definitions. It is NOT automatically a direct English Core20K-to-Chinese sense alignment source.

Official Kaikki rawdata page documents an English edition all-language extraction ~2.9 GB compressed (not 300 MB). Must use bounded stream processing and capture full compressed SHA for version freeze; postprocessed English dictionary may not be equivalent to raw English-edition extraction. The public Kaikki download may change weekly, so record dump and extraction revision and byte hash.

Status: 4/5 source files byte-verified; this is *not* complete 5-source version freeze, no L1 quality claims, no semantic certification. The full 234 MB data is in the current Actions artifact but not in this repo as permanent source.
