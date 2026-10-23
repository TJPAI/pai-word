# Scene500 AI V1.6 browser adapter — experimental contract

Entry: `experiments/scene500-ai-training/v1.6/scene500-ai-adapter.mjs`

The adapter implements the agreed `initialize()` and `recommend({query,topK,locale,signal})` shape. It is **not** an E5 inference bundle: the host must provide `embedQuery` and a matching 500-vector index; alternatively supply the existing rule-based `fallback`. It has no DOM, storage, or SRS writes.

```js
import {createScene500AI} from './scene500-ai-adapter.mjs';
const engine=createScene500AI({
  loadCatalog: async()=>await (await fetch('/scene500-recommendation/catalog-v0.2.json')).json(),
  loadIndex: async()=>await (await fetch('/assets/scene500-c2-index.json')).json(),
  embedQuery: async(text,{signal})=>e5Encoder.encode(text,{signal}),
  fallback: async(query,{topK,signal})=>legacyRecommend(query,{limit:topK,signal}),
  eligibleSceneIds: async()=>getEligibleSceneIds()
});
const result=await engine.recommend({query:'我想练习英语面试',topK:5,signal:controller.signal});
```

**Example paths and e5Encoder/legacyRecommend/getEligibleSceneIds are integration placeholders, not shipped resources.** The index must contain `{taxonomyVersion,taxonomyFingerprint,scenes:[{sceneId,vector}]}` and 500 canonical IDs. The fingerprint is SHA-256 of UTF-8 JSON of ordered `[[sceneId,name],...]`, ordered S001 through S500. It is a *scene identity* fingerprint, **not** a byte-for-byte SHA-256 of catalog-v0.2.json. Catalog file SHA-256 is a separate requested deliverable.

The caller must retain its searchSerial guard to prevent stale results. An AbortSignal is checked before/after async operations; an encoder may need additional internal cancellation handling. The adapter does not implement semantic no-match calibration or a reranker: E5 cosine score is never treated as probability. Missing E5 resources return rule fallback when provided, otherwise `unavailable`.

QA status: source committed, browser E2E NOT_RUN, iPhone Safari NOT_RUN, ONNX/WASM NOT_RUN, model weight license/size verification NOT_RUN, actual C2 index generation NOT_RUN, 500-vector SHA256 NOT_RUN, cold/hot latency and memory NOT_RUN. Do not enable production flag. Prior Muse CPU model tests do not prove browser runtime performance.

Integration boundary: AI outputs valid scene IDs; main app owns difficulty, inventory/eligible filtering, `PAI_SCENE_SEARCH.open(scene,difficulty)`, KU and SRS.
