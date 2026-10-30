# V110 OMW Chinese lexical evidence QA

Input: V109's official CILI-to-OEWN-to-frozen-Core20K 21,852 sense-linked records, *not* semantically certified glosses.

Measured: 21,852 records / 21,852 unique Sense Keys / 10,975 lemmas.
- Same lemma's distinct Sense records sharing Chinese lexicalization: **5,795**
- Lemma spans multiple POS: **7,422**
- More than five Chinese lexemes per sense: **1,169**
- Latin letters in Chinese lexemes: **15**
- Long Chinese lexicalization (>12 chars): **9**
- No Han character: **3**

Counts overlap. All are **review signals, not proven errors**. Distinct synset lexicalizations can legitimately share translations.

Review input sampled: **2,000 senses, 2,000 unique lemmas**, quotas P0=800, P1=500, P2=450, P3=250; deterministic seed 20261030. This is headword-balanced, deliberately non-probabilistic and should NOT be used to estimate total error rates.

Local archive: `core20k_v110_omw_lexeme_quality_triage.zip` contains 21,852 line-by-line risk records, 2,000 review rows, script-independent manifest and SHA-256. Full payload has not been committed to GitHub.

Next: synset-level Chinese lexicalization *sense-fit* audit with independently evaluated quality criteria, support per-sense context, Simplified/Traditional conversion verification, and optional second independent dictionary anchor. No automated L1-A certification, no Runtime change.
