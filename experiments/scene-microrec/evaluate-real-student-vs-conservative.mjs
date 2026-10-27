import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {createHash} from 'node:crypto';
import {createTrainedStudent} from './student-package.mjs';
import {createConservativeMicro} from './conservative.mjs';

const [studentPath, outputPath] = process.argv.slice(2);
if (!studentPath || !outputPath) {
  throw new Error('USAGE: node evaluate-real-student-vs-conservative.mjs STUDENT.json OUTPUT.json');
}
const read = path => JSON.parse(fs.readFileSync(new URL(path, import.meta.url), 'utf8'));
const catalog = read('../../scene500-recommendation/catalog-v0.2.json');
const datasetPaths = [
  '../../scene500-recommendation/qa/holdout-20-editorial-v1.json',
  '../../scene500-recommendation/qa/prospective-24-v1.json',
  '../../scene500-recommendation/qa/generalization-probe-20-v1.json',
];
const studentBytes = fs.readFileSync(studentPath);
const studentPackage = JSON.parse(studentBytes);
const engines = {
  'real-e5-int8-student': createTrainedStudent(studentPackage),
  conservative: createConservativeMicro(catalog),
};

function percentiles(values) {
  values.sort((a, b) => a - b);
  const at = q => +values[Math.min(values.length - 1, Math.floor(values.length * q))].toFixed(4);
  return {p50_ms: at(0.5), p95_ms: at(0.95), samples: values.length};
}

function evaluate(engine, cases) {
  let positive = 0, top1 = 0, recall5 = 0, recall10 = 0, mrr10 = 0;
  let excludedCases = 0, excludedViolations = 0, empty = 0;
  const rows = [];
  for (const item of cases) {
    const results = engine.search(item.query, {limit: 10});
    const ids = results.map(x => x.sceneId);
    if (!ids.length) empty++;
    const expected = item.relevant || item.expected || [];
    let rank = -1;
    if (expected.length) {
      positive++;
      rank = ids.findIndex(id => expected.includes(id));
      if (rank === 0) top1++;
      if (rank >= 0 && rank < 5) recall5++;
      if (rank >= 0 && rank < 10) recall10++;
      if (rank >= 0 && rank < 10) mrr10 += 1 / (rank + 1);
    }
    let excludedViolation = false;
    if (item.excluded?.length) {
      excludedCases++;
      excludedViolation = item.excluded.some(id => ids.slice(0, 5).includes(id));
      if (excludedViolation) excludedViolations++;
    }
    rows.push({query: item.query, expected, excluded: item.excluded || [], top10: ids, rank, excluded_top5_violation: excludedViolation});
  }
  return {
    cases: cases.length,
    positive_cases: positive,
    top1: positive ? top1 / positive : null,
    recall5: positive ? recall5 / positive : null,
    recall10: positive ? recall10 / positive : null,
    mrr10: positive ? mrr10 / positive : null,
    excluded_cases: excludedCases,
    excluded_top5_violations: excludedViolations,
    empty_results: empty,
    rows,
  };
}

function latency(engine, cases) {
  for (let i = 0; i < 10; i++) for (const item of cases) engine.search(item.query, {limit: 10});
  const values = [];
  for (let round = 0; round < 50; round++) {
    for (const item of cases) {
      const start = performance.now();
      engine.search(item.query, {limit: 10});
      values.push(performance.now() - start);
    }
  }
  return percentiles(values);
}

const datasets = {};
const aggregateCases = [];
for (const path of datasetPaths) {
  const dataset = read(path);
  const name = path.split('/').at(-1);
  aggregateCases.push(...dataset.cases);
  datasets[name] = {
    status: dataset.status,
    engines: Object.fromEntries(Object.entries(engines).map(([name, engine]) => {
      const quality = evaluate(engine, dataset.cases);
      return [name, {quality, latency: latency(engine, dataset.cases)}];
    })),
  };
}
const aggregate = Object.fromEntries(Object.entries(engines).map(([name, engine]) => {
  const quality = evaluate(engine, aggregateCases);
  return [name, {quality, latency: latency(engine, aggregateCases)}];
}));
const report = {
  schema: 'scene-microrec-real-student-conservative-ab-v1',
  status: 'NONBLIND_EDITORIAL_AB_NOT_SEMANTIC_CERTIFICATION',
  source_run_id: 40477803071,
  student: {
    model_id: studentPackage.teacher?.model_id,
    revision: studentPackage.teacher?.revision,
    package_bytes: studentBytes.length,
    package_sha256: createHash('sha256').update(studentBytes).digest('hex'),
    int8: studentPackage.schema === 'scene-microrec-int8-student-v1',
    quality_certified: studentPackage.diagnostics?.quality_certified === true,
  },
  datasets,
  aggregate,
  caveats: [
    'All three datasets are editorial and non-blind; results are comparative evidence, not semantic quality certification.',
    'The real E5 teacher encoded catalog names, aliases, and examples; the student itself is a hashed lexical encoder trained to match projected teacher vectors.',
    'Node.js runner latency is not browser or Safari latency.',
  ],
};
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n');
const compact = Object.fromEntries(Object.entries(aggregate).map(([name, x]) => [name, {
  top1: x.quality.top1,
  recall5: x.quality.recall5,
  recall10: x.quality.recall10,
  mrr10: x.quality.mrr10,
  excluded_top5_violations: x.quality.excluded_top5_violations,
  empty_results: x.quality.empty_results,
  p50_ms: x.latency.p50_ms,
  p95_ms: x.latency.p95_ms,
}]));
console.log(JSON.stringify({status: report.status, student: report.student, aggregate: compact}));
