# Scene500 Recommendation Engine — integration contract (V1 alpha)

**Owner:** Scene500 recommendation workstream. **Integrator:** PAI Word home/runtime workstream.

## Isolation rules
- Browser ESM at `scene500-recommendation/engine.mjs`; standalone catalog at `data/scene500-recommendation-catalog-v0.1.json`.
- Host imports this module **after Home Shell paints** or on first search. Never static-import it from the home entrypoint if that delays first paint.
- No changes to `scene-search.js`, home entrypoint, Core20K, Top100, `ku_id`, SRS, `state`, or `save()` in this workstream.
- Host owns difficulty/availability filtering by passing `eligibleSceneIds`, UI, pagination controls, analytics, and learning navigation.
- Engine never initializes audio, speech, learning sessions, or user persistence. No network access except the opt-in catalog fetch.
- Catalog has **25 unreviewed draft profiles and 475 name-only fallbacks**. This is NOT an endorsed production semantic-quality claim.

## Lazy usage example (for host integration only)
```js
let enginePromise;
function loadRecommendationEngine(){
  return enginePromise ??= import('./scene500-recommendation/engine.mjs')
    .then(({loadScene500Recommender})=>loadScene500Recommender({
      catalogUrl:'./data/scene500-recommendation-catalog-v0.1.json'
    })).catch(err=>{enginePromise=null;throw err});
}
async function recommend(query,eligibleSceneIds,limit=20){
  const engine=await loadRecommendationEngine();
  const snapshot=engine.search(query,{limit,eligibleSceneIds});
  return {snapshot,firstFive:engine.getPage(snapshot,0,5)};
}
```
Use paths relative to the **hosting page**, not necessarily relative to this markdown example. GitHub Pages deployment must copy both the module and catalog into the published root; never assume the repository root is identical to the Pages root.

## API
- `createScene500Recommender({catalog,minimumScore?})`: sync, validates 500-scene catalog.
- `loadScene500Recommender({catalogUrl,fetchImpl?,signal?})`: lazy network load; error leaves host free to fall back.
- `engine.search(query,{limit=20,eligibleSceneIds?})`: deterministic snapshot `{query,total,results:[{sceneId,name,score,quality}]}`.
- `engine.getPage(snapshot,pageIndex=0,pageSize=5)`: immutable ordering; zero-based pages. Calls never rerank when switching pages.
- Host should save `snapshot` only in ephemeral UI state and reset pagination for a new query. Do not persist learning state in the engine.

## Contract limitations
- Scores are heuristic and **not calibrated probabilities**. The first 25 profiles are drafts. No embedding is used.
- No suggestions beyond minimum score; returns fewer than requested when appropriate.
- All raw user text is treated as data. Returns only canonical IDs from the catalog.
- `eligibleSceneIds` is host-supplied based on selected difficulty and learning availability; this is a hard filter.
- Search runs synchronously over 500 entries after lazy loading; benchmark real iPhone Safari before release.

## QA gate
Run module tests and existing Scene500 tests; independently verify browser lazy-loading, fallback when fetch fails, stable pages 0..k, nonempty eligibility, Chinese IME composition behavior, and zero regressions in existing SRS/navigation. Do not release as fully reviewed until all 500 semantic profiles and relevance eval set are audited.
