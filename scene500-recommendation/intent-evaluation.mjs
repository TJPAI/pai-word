/** Strict evaluation policy, isolated from lexicon, ranker and reference labels. */
export function evaluateIntentCase(testCase, predictedIds) {
  if (!testCase || !Array.isArray(predictedIds) ||
      predictedIds.some(id => typeof id !== 'string') ||
      new Set(predictedIds).size !== predictedIds.length) {
    throw new Error('SCENE500_INVALID_PREDICTION');
  }
  const {type, mustTop1, mustTop5} = testCase;
  if (type === 'single') {
    if (typeof mustTop1 !== 'string' || !/^S\d{3}$/.test(mustTop1))
      throw new Error('SCENE500_INVALID_SINGLE_LABEL');
    return {passed: predictedIds[0] === mustTop1, hitCount: Number(predictedIds[0] === mustTop1), targetCount: 1, criterion: 'top1'};
  }
  if (type === 'multi') {
    if (!Array.isArray(mustTop5) || mustTop5.length < 2 || mustTop5.length > 5 ||
        new Set(mustTop5).size !== mustTop5.length ||
        mustTop5.some(id => typeof id !== 'string' || !/^S\d{3}$/.test(id))) {
      throw new Error('SCENE500_INVALID_MULTI_LABEL');
    }
    const top5 = predictedIds.slice(0, 5);
    const count = mustTop5.filter(id => top5.includes(id)).length;
    return {passed: count === mustTop5.length, hitCount: count, targetCount: mustTop5.length, criterion: 'all-relevant-in-top5'};
  }
  throw new Error('SCENE500_INVALID_INTENT_TYPE');
}
