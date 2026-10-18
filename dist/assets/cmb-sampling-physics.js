/* Original statistical teaching experiment following MBW (2010), Section 6.7.
   For an ideal, full-sky, isotropic Gaussian field with no instrumental noise,
   R = C_hat_ell / C_ell = chi_square(2 ell + 1) / (2 ell + 1).
   No observed sky data, mask corrections, or cosmological spectrum fit is used. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CmbSamplingPhysics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const TAU = 2 * Math.PI;
  const LOG_SQRT_TAU = 0.91893853320467274178;
  // Lanczos, g=7. The arguments used by this experiment are >= 2.5.
  const LANCZOS = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
  ];
  function integer(value, lo, hi, name) {
    if (!Number.isInteger(value) || value < lo || value > hi)
      throw new RangeError(name + ' must be an integer in [' + lo + ', ' + hi + ']');
  }
  function logGamma(z) {
    if (!Number.isFinite(z) || z <= 0) throw new RangeError('logGamma requires z > 0');
    if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
    z -= 1;
    let sum = LANCZOS[0];
    for (let i = 1; i < LANCZOS.length; i++) sum += LANCZOS[i] / (z + i);
    const t = z + 7.5;
    return LOG_SQRT_TAU + (z + 0.5) * Math.log(t) - t + Math.log(sum);
  }
  // Regularized lower incomplete gamma. Series below a+1, continued fraction
  // for the complementary tail above it. No numerical integration of a narrow
  // PDF is needed for the sigma-band coverage or equal-tail quantiles.
  function gammaP(a, x) {
    if (!Number.isFinite(a) || a <= 0 || typeof x !== 'number' || Number.isNaN(x)) throw new RangeError('Invalid gamma CDF');
    if (x <= 0) return 0;
    if (x === Infinity) return 1;
    const exponent = a * Math.log(x) - x - logGamma(a);
    const epsilon = 2e-14;
    if (x < a + 1) {
      let term = 1 / a, sum = term;
      for (let j = 1; j <= 2000; j++) {
        term *= x / (a + j);
        sum += term;
        if (Math.abs(term) <= Math.abs(sum) * epsilon)
          return Math.max(0, Math.min(1, Math.exp(exponent) * sum));
      }
    } else {
      const tiny = 1e-300;
      let b = x + 1 - a, c = 1 / tiny, d = 1 / b, h = d;
      for (let j = 1; j <= 2000; j++) {
        const an = -j * (j - a);
        b += 2;
        d = an * d + b;
        if (Math.abs(d) < tiny) d = tiny;
        c = b + an / c;
        if (Math.abs(c) < tiny) c = tiny;
        d = 1 / d;
        const delta = d * c;
        h *= delta;
        if (Math.abs(delta - 1) <= epsilon)
          return Math.max(0, Math.min(1, 1 - Math.exp(exponent) * h));
      }
    }
    throw new Error('Gamma CDF did not converge');
  }
  function distribution(ell) {
    integer(ell, 2, 100, 'ell');
    const nu = 2 * ell + 1, shape = nu / 2, variance = 2 / nu, sd = Math.sqrt(variance);
    const logNormalization = shape * Math.log(shape) - logGamma(shape);
    const pdf = r => {
      if (typeof r !== 'number' || Number.isNaN(r)) throw new RangeError('PDF coordinate must be a number');
      if (r <= 0 || r === Infinity) return 0;
      return Math.exp(logNormalization + (shape - 1) * Math.log(r) - shape * r);
    };
    const cdf = r => gammaP(shape, shape * r);
    function quantile(probability) {
      if (!Number.isFinite(probability) || probability < 0 || probability > 1)
        throw new RangeError('Probability must be in [0, 1]');
      if (probability === 0) return 0;
      if (probability === 1) return Infinity;
      let lo = 0, hi = Math.max(2, 1 + 8 * sd);
      while (cdf(hi) < probability) hi *= 2;
      for (let i = 0; i < 85; i++) {
        const mid = (lo + hi) / 2;
        if (cdf(mid) < probability) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    }
    const sigmaLo = Math.max(0, 1 - sd), sigmaHi = 1 + sd;
    return {
      ell, nu, shape, mean: 1, variance, sd, pdf, cdf, quantile,
      sigmaBand: { lo: sigmaLo, hi: sigmaHi, coverage: cdf(sigmaHi) - cdf(sigmaLo) },
      central68Interval: { lo: quantile(0.16), hi: quantile(0.84), coverage: 0.68 }
    };
  }
  function rng(seed) {
    integer(seed, 0, 0xffffffff, 'seed');
    let state = seed >>> 0, spare = null;
    function uniform() {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      // Midpoints exclude exactly 0 and 1 in Box-Muller.
      return (((t ^ (t >>> 14)) >>> 0) + 0.5) / 4294967296;
    }
    function normal() {
      if (spare !== null) { const result = spare; spare = null; return result; }
      const radius = Math.sqrt(-2 * Math.log(uniform())), angle = TAU * uniform();
      spare = radius * Math.sin(angle);
      return radius * Math.cos(angle);
    }
    return { uniform, normal };
  }
  function summarize(samples, visibleCount, edges, sigmaBand) {
    const bins = edges.length - 1, width = edges[1] - edges[0], counts = Array(bins).fill(0);
    let mean = 0, m2 = 0, inBand = 0;
    for (let i = 0; i < visibleCount; i++) {
      const value = samples[i], delta = value - mean;
      mean += delta / (i + 1);
      m2 += delta * (value - mean);
      const index = Math.min(bins - 1, Math.max(0, Math.floor((value - edges[0]) / width)));
      counts[index]++;
      if (value >= sigmaBand.lo && value <= sigmaBand.hi) inBand++;
    }
    const histogram = counts.map((count, i) => ({
      lo: edges[i], hi: edges[i + 1], center: (edges[i] + edges[i + 1]) / 2,
      count, density: visibleCount ? count / (visibleCount * width) : 0
    }));
    return {
      visibleCount,
      histogram,
      // This sum is 1 up to floating-point roundoff for any nonempty prefix.
      histogramArea: histogram.reduce((sum, b) => sum + b.density * (b.hi - b.lo), 0),
      sampleMean: visibleCount ? mean : null,
      sampleVariance: visibleCount > 1 ? m2 / (visibleCount - 1) : null,
      populationSecondCentralMoment: visibleCount ? m2 / visibleCount : null,
      empiricalSigmaBandCoverage: visibleCount ? inBand / visibleCount : null
    };
  }
  function simulate(options = {}) {
    const ell = options.ell === undefined ? 2 : options.ell;
    const count = options.count === undefined ? (options.N === undefined ? 1000 : options.N) : options.count;
    const seed = options.seed === undefined ? 1 : options.seed;
    const bins = options.bins === undefined ? 60 : options.bins;
    const theoryPoints = options.theoryPoints === undefined ? 401 : options.theoryPoints;
    integer(count, 100, 4000, 'count');
    if (bins !== 48 && bins !== 60) throw new RangeError('bins must be 48 or 60');
    integer(theoryPoints, 101, 2001, 'theoryPoints');
    const d = distribution(ell), random = rng(seed), samples = [];
    let maximum = 0;
    for (let i = 0; i < count; i++) {
      let sum = 0;
      for (let j = 0; j < d.nu; j++) { const z = random.normal(); sum += z * z; }
      const value = sum / d.nu;
      samples.push(value);
      maximum = Math.max(maximum, value);
    }
    // Freeze this full-sample domain during a batch animation. Every simulated
    // sky is included; no tail count can silently disappear beyond a fixed axis.
    const upper = Math.max(1 + 4 * d.sd, maximum * 1.025);
    const xDomain = [0, upper], binWidth = upper / bins;
    const edges = Array.from({ length: bins + 1 }, (_, i) => i * binWidth);
    edges[bins] = upper;
    const theory = Array.from({ length: theoryPoints }, (_, i) => {
      const x = upper * i / (theoryPoints - 1);
      return { x, y: d.pdf(x) };
    });
    const summary = summarize(samples, count, edges, d.sigmaBand);
    return Object.assign({
      ell, nu: d.nu, count, N: count, seed, bins, samples, edges, binWidth, xDomain, theory,
      theoreticalMean: 1, theoreticalVariance: d.variance, theoreticalSD: d.sd,
      meanStandardError: d.sd / Math.sqrt(count),
      sigmaBand: d.sigmaBand, sigmaBandCoverage: d.sigmaBand.coverage,
      central68Interval: d.central68Interval,
      sampleVarianceEstimator: 'unbiased: sum((R_i - sampleMean)^2) / (N - 1)',
      domainTailProbability: Math.max(0, 1 - d.cdf(upper)),
      varianceMeaning: 'Variance across independent hypothetical skies at fixed ell; not uncertainty of their arithmetic mean.'
    }, summary);
  }
  function prefixSummary(result, visibleCount) {
    if (!result || !Array.isArray(result.samples) || !Array.isArray(result.edges) || !result.sigmaBand)
      throw new TypeError('A simulate() result is required');
    integer(visibleCount, 0, result.samples.length, 'visibleCount');
    return summarize(result.samples, visibleCount, result.edges, result.sigmaBand);
  }
  return { logGamma, gammaP, distribution, rng, simulate, prefixSummary };
});
