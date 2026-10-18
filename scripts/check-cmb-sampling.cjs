'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const P = require('../dist/assets/cmb-sampling-physics.js');
let checks = 0;
function ok(condition, message) { assert.ok(condition, message); checks++; }
function near(actual, expected, tolerance, message) {
  ok(Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance,
    message + ': ' + actual + ' versus ' + expected);
}
function simpson(f, lo, hi, n = 65536) {
  let sum = f(lo) + f(hi);
  const step = (hi - lo) / n;
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * f(lo + step * i);
  return sum * step / 3;
}
near(P.logGamma(0.5), Math.log(Math.sqrt(Math.PI)), 2e-15, 'Gamma(1/2)');
near(P.logGamma(5), Math.log(24), 2e-14, 'Gamma(5)');
const records = [];
for (const ell of [2, 3, 10, 50, 100]) {
  const d = P.distribution(ell);
  near(d.pdf(0), 0, 0, 'PDF at zero');
  near(d.cdf(0), 0, 0, 'CDF at zero');
  near(d.cdf(Infinity), 1, 0, 'CDF infinity');
  near(d.variance, 2 / (2 * ell + 1), 0, 'analytic variance');
  const end = d.quantile(1 - 1e-12);
  const area = simpson(d.pdf, 0, end);
  const mean = simpson(x => x * d.pdf(x), 0, end);
  const variance = simpson(x => (x - 1) ** 2 * d.pdf(x), 0, end);
  near(area, 1, 3e-10, 'PDF integral');
  near(mean, 1, 3e-10, 'PDF first moment');
  near(variance, d.variance, 6e-10, 'PDF second central moment');
  near(d.cdf(d.central68Interval.lo), 0.16, 2e-13, '16% quantile');
  near(d.cdf(d.central68Interval.hi), 0.84, 2e-13, '84% quantile');
  const sigmaIntegral = simpson(d.pdf, d.sigmaBand.lo, d.sigmaBand.hi, 8192);
  near(d.sigmaBand.coverage, sigmaIntegral, 3e-12, 'sigma-band numerical integral');
  records.push({ ell, nu: d.nu, area, mean, variance, sigmaBand: d.sigmaBand, central68Interval: d.central68Interval });
}
ok(Math.abs(P.distribution(2).sigmaBand.coverage - 0.68) > 0.02,
  'low-ell sigma band must not be mislabeled as a 68% interval');
const sameA = P.simulate({ ell: 2, count: 1000, seed: 17, bins: 60 });
const sameB = P.simulate({ ell: 2, count: 1000, seed: 17, bins: 60 });
assert.deepEqual(sameA, sameB); checks++;
ok(sameA.samples[0] !== P.simulate({ ell: 2, count: 1000, seed: 18 }).samples[0], 'different seeds');
const sampling = [];
for (const ell of [2, 100]) for (const count of [100, 4000]) for (const bins of [48, 60]) {
  const r = P.simulate({ ell, count, bins, seed: 20261017 });
  near(r.histogramArea, 1, 2e-14, 'normalized histogram area');
  ok(r.histogram.reduce((sum, b) => sum + b.count, 0) === count, 'all samples counted');
  ok(r.samples.length === count && r.samples.every(x => Number.isFinite(x) && x > 0), 'finite positive ratios');
  ok(Math.max(...r.samples) < r.xDomain[1], 'all samples inside domain');
  ok(r.theory.every(p => p.y >= 0 && Number.isFinite(p.y)), 'finite theory');
  const mean = r.samples.reduce((sum, x) => sum + x, 0) / count;
  const unbiased = r.samples.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (count - 1);
  near(r.sampleMean, mean, 2e-14, 'independent two-pass mean');
  near(r.sampleVariance, unbiased, 5e-15, 'independent two-pass unbiased variance');
  const varianceSE = r.theoreticalVariance * Math.sqrt((2 + 12 / r.nu) / count);
  ok(Math.abs(r.sampleMean - 1) < 7 * r.meanStandardError, 'sample mean statistically plausible');
  ok(Math.abs(r.sampleVariance - r.theoreticalVariance) < 7 * varianceSE, 'sample variance statistically plausible');
  for (const visible of [0, 1, 100, count]) {
    const prefix = P.prefixSummary(r, visible);
    near(prefix.histogramArea, visible ? 1 : 0, 2e-14, 'prefix normalization');
    ok(prefix.histogram.reduce((sum, b) => sum + b.count, 0) === visible, 'prefix counts');
    if (visible === 0) ok(prefix.sampleMean === null && prefix.sampleVariance === null, 'empty stats are null');
    if (visible === 1) ok(prefix.sampleVariance === null, 'one-sample unbiased variance undefined');
    if (visible === count) {
      assert.deepEqual(prefix.histogram, r.histogram); checks++;
      near(prefix.sampleMean, r.sampleMean, 0, 'animation finishes at full result');
      near(prefix.sampleVariance, r.sampleVariance, 0, 'animation final variance');
    }
  }
  sampling.push({ ell, count, bins, sampleMean: r.sampleMean, sampleVariance: r.sampleVariance,
    theoryVariance: r.theoreticalVariance, histogramArea: r.histogramArea, xDomain: r.xDomain,
    domainTailProbability: r.domainTailProbability });
}
for (const options of [{ ell: 1 }, { ell: 101 }, { count: 99 }, { count: 4001 }, { bins: 50 }, { seed: -1 }, { seed: 1.2 }]) {
  assert.throws(() => P.simulate(options)); checks++;
}
const browser = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../dist/assets/cmb-sampling-physics.js'), 'utf8'), browser);
ok(typeof browser.CmbSamplingPhysics.simulate === 'function', 'browser UMD global');
const browserResult = browser.CmbSamplingPhysics.simulate({ ell: 2, count: 100, seed: 1 });
ok(JSON.stringify(browserResult.samples) === JSON.stringify(P.simulate({ ell: 2, count: 100, seed: 1 }).samples), 'Node/browser reproducibility');
const referencePath = path.join(__dirname, 'fixtures/cmb-python-reference.json');
let independentReferences = 0;
if (fs.existsSync(referencePath)) {
  const reference = JSON.parse(fs.readFileSync(referencePath, 'utf8'));
  for (const item of reference.cases) {
    const d = P.distribution(item.ell);
    near(d.pdf(item.r), item.pdf, Math.max(1e-300, Math.abs(item.pdf) * 5e-12), 'Python math.lgamma PDF');
    near(d.cdf(item.r), item.cdf, 4e-12, 'Python independent half-integer CDF');
    independentReferences += 2;
  }
}
const report = { checks, independentReferences, distributions: records, sampling,
  note: 'Finite-sample deviations are checked against statistical sampling scales, not against exact equality with theoretical moments.' };
fs.writeFileSync(path.join(__dirname, '../docs/cmb-sampling-validation-v28.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ checks, independentReferences, status: 'passed', maxEll2SigmaCoverage: records[0].sigmaBand.coverage }, null, 2));
