# PAI Word Scene500 E5 local-model acceptance

The Muse-provided Google Drive ZIP `multilingual-e5-small-q8.zip` was downloaded and inspected in the chat sandbox. It contained exactly five requested files. The ZIP can be checked using this stdlib script. The large binary model MUST NOT be committed to GitHub.

## Preparation and evaluation

From the repository root (with Python 3 and Node >=18):

```bash
python experiments/scene500-ai-training/v1.0/verify-extract.py multilingual-e5-small-q8.zip --dest /tmp/scene500-e5-local
npm install --no-save @huggingface/transformers@^3
SCENE500_E5_LOCAL_ROOT=/tmp/scene500-e5-local node experiments/scene500-ai-training/v0.7/eval-e5.mjs
node experiments/scene500-ai-training/v0.8/analyze-results.mjs experiments/scene500-ai-training/v0.7/e5-results-local.json
```

The offline loader explicitly uses `env.allowRemoteModels=false`, `env.allowLocalModels=true`, and `env.localModelPath` when `SCENE500_E5_LOCAL_ROOT` is set, with the local model id `multilingual-e5-small`. The folder immediately under the root must have that exact basename. Transformers.js must already be installed, but no model-weight download is required.

## Observed input evidence

- Muse ZIP size: **85,063,290 bytes**
- Zip SHA-256: `fa1db774784487728752e6d5d4cffd1bdde3466367f4f0ff712735b1e303dd7d`
- ONNX weight size: **118,308,185 bytes**; tokenizer JSON size: **17,082,730 bytes**
- The ZIP CRC test succeeded and all 4 JSON config files parsed.
- This environment cannot install missing npm/Python inference dependencies via DNS; **E5 inference has NOT been executed**. File validation is not inference validation.
- The 72-label evaluation set is editorial single-pass, not independently verified gold.

## Must validate before deployment

Check correct ONNX model load and shape, compare positive top-k recall with existing 18/59 draft baseline, validate out-of-taxonomy rejection on new annotations, measure real mobile Safari cold-start, and keep the current recommender as fallback. The package is too large for unconditional homepage loading.
