// Regression for this round's experiment-figure changes:
// 5:jeans-lab (stellar Jeans second moments, directions, single vs combined tangential dispersion)
// and 13:anisotropy-lab (fixed projected sigma_los, gamma=3 projection cancellation).
// Browser layout/interaction checks live in check-experiment-figures-browser.cjs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const katex = require('../dist/assets/katex/katex.min.js');
const A = require('../dist/assets/advanced-physics.js');
const C = require('../dist/assets/collapse-physics.js');
const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
let checks = 0;
function ok(condition, message) { assert.ok(condition, message); checks++; }
function near(actual, expected, tolerance, message) {
  assert.ok(Number.isFinite(actual) && Number.isFinite(expected), message + ': non-finite');
  assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${message}: ${actual} vs ${expected}`);
  checks++;
}
function simpson(f, a, b, n) {
  assert.equal(n % 2, 0, 'Simpson needs an even number of intervals');
  const h = (b - a) / n;
  let sum = f(a) + f(b);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * f(a + i * h);
  return sum * h / 3;
}

// --- Independent projection path for 13:anisotropy-lab -------------------
// For nu ~ r^-gamma and constant beta/sigma_r, the line-of-sight integral at
// projected radius R=1 becomes, with r=R cosh u,
//   sigma_los^2 = sigma_r^2 * Int[cosh^(1-gamma)(1-beta/cosh^2 u) du]
//                            / Int[cosh^(1-gamma) du].
// This is an independent numerical quadrature, not the model's algebra.
function projectedSigmaRatio(gamma, beta) {
  const exponent = 1 - gamma;
  const upper = 48, intervals = 16000;
  const numerator = simpson(u => Math.cosh(u) ** exponent * (1 - beta / Math.cosh(u) ** 2), 0, upper, intervals);
  const denominator = simpson(u => Math.cosh(u) ** exponent, 0, upper, intervals);
  return { ratio: numerator / denominator, numerator, denominator };
}
const gammaValues = [1.5, 2.5, 3, 3.5];
const betaValues = [-0.5, 0, 0.5];
const sigmaValues = [100, 200, 300];
let projectionCases = 0;
for (const gamma of gammaValues) for (const beta of betaValues) for (const sigma of sigmaValues) {
  const state = { gamma, beta, sigma };
  const result = A.models.anisotropy(state);
  const { ratio } = projectedSigmaRatio(gamma, beta);
  // sigma_los^2 = sigma_r^2 * ratio; solve for sigma_r, then Vc^2=(gamma-2 beta) sigma_r^2.
  const expectedSigmaR = sigma / Math.sqrt(ratio);
  const expectedVc = Math.sqrt((gamma - 2 * beta) * expectedSigmaR * expectedSigmaR);
  near(result.values[1], expectedSigmaR, 2e-10, `sigma_r projection gamma=${gamma} beta=${beta} sigma=${sigma}`);
  near(result.values[0], expectedVc, 2e-10, `Vc projection gamma=${gamma} beta=${beta} sigma=${sigma}`);
  near(result.values[2], expectedVc * expectedVc * 10 / 4.30091e-6, 2e-10, `M(<10kpc) gamma=${gamma} beta=${beta}`);
  projectionCases++;
}
ok(projectionCases === 36, 'projection matrix should cover 4 gamma x 3 beta x 3 sigma');

// --- Analytic structure that the figure claims --------------------------
const nearGamma3 = A.models.anisotropy({ gamma: 3, beta: 0, sigma: 200 });
ok(nearGamma3.curves.length === 2, 'anisotropy must plot current-gamma and gamma=3 reference curves');
ok(nearGamma3.curves[0].label.includes('当前') && nearGamma3.curves[1].label.includes('γ=3'), 'curve labels must distinguish current gamma and the gamma=3 reference');
for (const point of nearGamma3.curves[1].data) near(point.y, Math.sqrt(3) * 200, 1e-12, 'gamma=3 reference Vc must be sqrt(3) sigma_los');
const flatVc = betaValues.map(beta => {
  near(A.models.anisotropy({ gamma: 3, beta, sigma: 200 }).values[0], Math.sqrt(3) * 200, 1e-12, `gamma=3 Vc beta=${beta}`);
  const result = A.models.anisotropy({ gamma: 3, beta, sigma: 200 });
  return { Vc: result.values[0], sigmaR: result.values[1] };
});
ok(flatVc.every(row => Math.abs(row.Vc - flatVc[0].Vc) < 1e-9), 'gamma=3 Vc must not depend on beta');
ok(Math.abs(flatVc[0].sigmaR - flatVc[2].sigmaR) > 10, 'sigma_r must still change with beta at gamma=3');
const gamma3Validation = A.models.anisotropy({ gamma: 3, beta: 0, sigma: 200 }).validation;
ok(gamma3Validation?.message.includes('γ=3'), 'gamma=3 must expose the projection-cancellation note');
ok(gamma3Validation.message.includes('不依赖 β') && !gamma3Validation.message.includes('无法区分 β 与质量'), 'gamma=3 note must not claim a beta-mass degeneracy in this model');
ok(!A.models.anisotropy({ gamma: 2.99, beta: 0, sigma: 200 }).validation, 'projection-cancellation note must stay exclusive to exactly gamma=3');
ok(!A.models.anisotropy({ gamma: 2.5, beta: 0, sigma: 200 }).validation, 'projection-cancellation note must stay specific to gamma=3');
for (const gamma of [1.5, 1.6, 2.5, 3, 3.5]) for (const beta of [-0.5, 0, 0.5]) for (const sigma of [100, 200, 300]) {
  const result = A.models.anisotropy({ gamma, beta, sigma });
  for (const curve of result.curves) for (const point of curve.data) ok(Number.isFinite(point.x) && Number.isFinite(point.y), 'anisotropy curve must stay finite');
  for (const value of result.values) ok(Number.isFinite(value), 'anisotropy readouts must stay finite');
  ok(result.point.x === beta && Math.abs(result.point.y - result.values[0]) < 1e-12, 'current point must sit on the model Vc');
}

// --- Independent spherical Jeans-equation path for 5:jeans-lab -----------
// nu ~ r^-gamma, constant sigma_r and beta:
//   d(nu sigma_r^2)/dr + 2 beta nu sigma_r^2/r = -nu G M(<r)/r^2.
// Numerically differentiate the left side instead of reusing the closed form.
const G_GAL = 4.30091e-6; // kpc (km/s)^2 / Msun
function jeansMassFromEquation(gamma, beta, sigmaR, r) {
  const nu = x => x ** (-gamma);
  const step = 1e-4 * r;
  const derivative = (nu(r + step) - nu(r - step)) / (2 * step) * sigmaR * sigmaR;
  const lhs = derivative + 2 * beta * nu(r) * sigmaR * sigmaR / r;
  return -lhs * r * r / (nu(r) * G_GAL);
}
for (const gamma of [2, 2.5, 3, 3.5, 4]) for (const beta of [-0.5, 0, 0.5, 0.7]) for (const sigmaR of [100, 150, 220]) {
  const result = C.jeans(gamma, beta, sigmaR);
  for (const r of [3, 10, 21]) {
    const mass = jeansMassFromEquation(gamma, beta, sigmaR, r);
    near(mass, (gamma - 2 * beta) * sigmaR * sigmaR * r / G_GAL, 1e-6, `Jeans M(<r) gamma=${gamma} beta=${beta} sigma=${sigmaR} r=${r}`);
  }
  near(result.vc * result.vc, (gamma - 2 * beta) * sigmaR * sigmaR, 1e-12, 'model vc^2 must equal (gamma-2beta) sigma_r^2');
  near(result.sigmaTangential, sigmaR * Math.sqrt(1 - beta), 1e-12, 'single tangential component sigma_theta=sigma_phi');
  near(Math.SQRT2 * result.sigmaTangential, sigmaR * Math.sqrt(2 * (1 - beta)), 1e-12, 'combined tangential dispersion sqrt(sigma_theta^2+sigma_phi^2)');
  near(10 * result.vc * result.vc / G_GAL / 1e11, result.vc * result.vc * 10 / G_GAL / 1e11, 1e-12, 'displayed mass at 10 kpc');
}
const isotropic = C.jeans(3, 0, 150);
near(isotropic.sigmaTangential / isotropic.sigmaR, 1, 1e-12, 'isotropic single component ratio');
near(Math.SQRT2 * isotropic.sigmaTangential / isotropic.sigmaR, Math.SQRT2, 1e-12, 'isotropic combined ratio');
const radial = C.jeans(3, 0.4, 150), tangential = C.jeans(3, -0.4, 150);
ok(radial.sigmaTangential < radial.sigmaR, 'beta>0 must make tangential components smaller than radial');
ok(tangential.sigmaTangential > tangential.sigmaR, 'beta<0 must make tangential components larger than radial');
ok(radial.vc < isotropic.vc && tangential.vc > isotropic.vc, 'fixed sigma_r: radial anisotropy lowers and tangential anisotropy raises the required Vc');
assert.throws(() => C.jeans(2, 1, 150), RangeError, 'beta=1 is outside the declared domain');
checks++;

// --- Author source and generated-page contracts -------------------------
const chapter5 = read('dist/chapter-5.html');
const chapter5js = read('dist/assets/chapter-five.js');
ok(chapter5.includes('id="jeans-moment-canvas"'), 'chapter 5 must contain the second-moment direction canvas');
ok(chapter5.includes('id="jeans-moment-note"'), 'chapter 5 must contain the live second-moment note');
ok(chapter5.includes('id="jeans-reset"'), 'chapter 5 jeans lab must provide a reset control');
ok(chapter5.includes('\\sigma_\\phi') && chapter5.includes('两个切向分量各一'), 'readout and model text must use explicit sigma_phi TeX');
ok(chapter5.includes('\\sqrt{\\sigma_\\theta^2+\\sigma_\\phi^2}'), 'chapter 5 must write the combined tangential dispersion with explicit sigma_phi TeX');
const jeansMath = /data-math-key="legacy-chapter-5\.html-3"[\s\S]*?legacy-chapter-5\.html-3:end/.exec(chapter5);
ok(jeansMath && (jeansMath[0].match(/class="math-line"/g) || []).length === 5, 'jeans model block must state the single-component and combined tangential relations');
ok(chapter5.includes('恒星动力学的 Jeans 二阶矩约束') && chapter5.includes('不是气体 Jeans 不稳定性'), 'chapter 5 must state that this is stellar-dynamics anisotropy, not gas Jeans instability');
ok(chapter5.includes('不追踪个别恒星轨道'), 'chapter 5 must state that the diagram is not a stellar-orbit integration');
for (const fragment of ['function moment(v)', 'jeans-moment-canvas', 'jeans-moment-note', 'sigmaT', 'Math.SQRT2', 'moment(v)', 'aria-label', 'jeans-reset']) ok(chapter5js.includes(fragment), `chapter-five.js must implement ${fragment}`);
ok(chapter5js.includes('dataset.sigmaT') && chapter5js.includes('dataset.sigmaTSum'), 'canvas data attributes must expose both single and combined tangential values');
ok(chapter5js.includes('两分量按方差合成') && chapter5js.includes('单分量'), 'live note/result must distinguish single and combined tangential dispersion');
ok(chapter5js.includes('String.raw') && chapter5js.includes('BookMath.format'), 'live math copy must use explicit TeX through the shared formatter, not bare unicode parsing');
ok(chapter5js.includes('\\sigma_\\phi') && chapter5js.includes('\\sqrt{\\sigma_\\theta^2+\\sigma_\\phi^2}'), 'live note/result must provide explicit sigma_phi TeX');
ok(!chapter5js.includes('σθ 与 σφ') && !chapter5js.includes('σθ = σφ ='), 'live copy must not repeat ambiguous bare unicode sigma_phi combinations');
ok(chapter5js.includes('textBounds') && chapter5js.includes('phiText'), 'moment canvas must record text bounds and keep a fallback placement for the tangential label');
ok(chapter5js.includes('固定标尺 0–400') && chapter5js.includes('value/400'), 'component bars must use the fixed 0-400 km/s scale');
ok(chapter5js.includes('barWidths') && chapter5js.includes("dataset.barScale='400'"), 'canvas must expose the fixed bar scale and bar widths for regression checks');

// --- Runtime explicit-TeX pipeline for the live copy (no browser) -------
const BS = String.fromCharCode(92);
const hasSigmaPhi = text => text.includes(BS + 'sigma_' + BS + 'phi') || text.includes(BS + 'sigma_{' + BS + 'phi}');
const inlineAnnotations = html => {
  const marker = '<annotation encoding="application/x-tex">', out = [];
  let index = html.indexOf(marker);
  while (index >= 0) {
    const start = index + marker.length, end = html.indexOf('</annotation>', start);
    out.push(html.slice(start, end));
    index = html.indexOf(marker, end);
  }
  return out.join(' ');
};
const vocabularyContext = {window: {}};
vm.runInNewContext(read('dist/assets/inline-math-vocabulary.js'), vocabularyContext);
const BookMath = require('../dist/assets/inline-math.js')(katex, vocabularyContext.window.BookMathVocabulary);
const noteStartMarker = 'const noteStr=String.raw`';
const noteStart = chapter5js.indexOf(noteStartMarker) + noteStartMarker.length;
const noteEnd = chapter5js.indexOf('`;$', noteStart);
ok(noteStart > noteStartMarker.length - 1 && noteEnd > noteStart, 'chapter-five.js must keep the live note as a String.raw template');
const noteTemplate = chapter5js.slice(noteStart, noteEnd);
const mockSt = 150 * Math.sqrt(0.7), mockSc = Math.SQRT2 * mockSt;
const noteRuntime = vm.runInNewContext('String.raw`' + noteTemplate + '`', {fmt: (value, digits) => value.toFixed(digits), st: mockSt, sc: mockSc});
const noteHtml = BookMath.format(noteRuntime);
const noteAnnotations = inlineAnnotations(noteHtml);
ok(hasSigmaPhi(noteAnnotations), 'formatted live note annotation must use sigma_phi');
ok(!noteAnnotations.includes(BS + 'sigma ' + BS + 'phi'), 'formatted live note annotation must not contain sigma times phi');
ok(noteRuntime.includes(mockSt.toFixed(1)) && noteRuntime.includes(mockSc.toFixed(1)), 'live note TeX must carry both single and combined values');
const resultStartMarker = 'innerHTML=tex(String.raw`';
const resultStart = chapter5js.indexOf(resultStartMarker) + resultStartMarker.length;
const resultEnd = chapter5js.indexOf('`);}', resultStart);
ok(resultStart > resultStartMarker.length - 1 && resultEnd > resultStart, 'chapter-five.js must keep the live result as a String.raw template');
const resultTemplate = chapter5js.slice(resultStart, resultEnd);
const resultRuntime = vm.runInNewContext('String.raw`' + resultTemplate + '`', {fmt: (value, digits) => value.toFixed(digits), massRatio: 80, st: mockSt, sc: mockSc, s: {beta: 0.3, gamma: 3, sigma: 150}});
const resultHtml = BookMath.format(resultRuntime);
ok(hasSigmaPhi(inlineAnnotations(resultHtml)), 'formatted live result annotation must use sigma_phi');
ok(resultRuntime.includes('89.4') && resultRuntime.includes(mockSc.toFixed(1)), 'live result keeps the expected velocity ratio and combined dispersion');

const chapter13 = JSON.parse(read('content/chapter-13.json'));
const anisotropy = chapter13.labs.find(lab => lab.id === 'anisotropy');
ok(anisotropy && anisotropy.model === 'anisotropy', 'chapter 13 must keep the anisotropy lab on the anisotropy model');
ok(anisotropy.intro.includes('固定可观测的视向弥散') && anisotropy.intro.includes('第 5 章'), 'anisotropy intro must contrast fixed sigma_los with the chapter-5 fixed sigma_r');
ok(anisotropy.params.find(param => param.key === 'sigma').label.includes('视向弥散'), 'sigma slider must say it is the projected velocity dispersion');
ok(anisotropy.assumptions.includes('γ=3') && anisotropy.assumptions.includes('固定三维 σr'), 'assumptions must explain gamma=3 cancellation and the fixed-sigma_r contrast');
ok(anisotropy.formulaTex.length === 3 && anisotropy.formulaTex[2].includes('\\sqrt{3}'), 'anisotropy formula block must state the gamma=3 result');
const chapter13html = read('dist/chapter-13.html');
const anisotropyMath = /data-math-key="lab-anisotropy"[\s\S]*?lab-anisotropy:end/.exec(chapter13html);
ok(anisotropyMath && (anisotropyMath[0].match(/class="math-line"/g) || []).length === 3, 'generated chapter 13 must render three anisotropy formula lines');
ok(chapter13html.includes('固定的视向弥散 σlos（km/s）'), 'generated chapter 13 must show the clarified sigma_los label');
ok(!chapter13html.includes('固定 σlos（km/s）'), 'generated chapter 13 must not keep the old ambiguous sigma label');
const guides = read('dist/assets/lab-guides.js');
ok(guides.includes('"5:jeans-lab"') && guides.includes('"13:anisotropy-lab"'), 'reader task guides must cover both changed experiments');
const guidesJson = JSON.parse(read('content/lab-guides.json'));
const jeansGuide = guidesJson['5:jeans-lab'], anisotropyGuide = guidesJson['13:anisotropy-lab'];
ok(jeansGuide && jeansGuide.check.includes(BS + 'sigma_' + BS + 'phi') && jeansGuide.steps.some(step => step.includes(BS + 'sigma_' + BS + 'theta')), '5:jeans author guide must use explicit sigma_phi TeX');
ok(anisotropyGuide && anisotropyGuide.check.includes('γ=3') && !anisotropyGuide.check.includes('无法区分 β 与质量'), '13:anisotropy author guide must state gamma=3 without a false beta-mass degeneracy');
const installedGuideRaw = read('dist/assets/lab-guides.js');
const installedGuideJson = installedGuideRaw.slice(installedGuideRaw.indexOf('=') + 1, installedGuideRaw.lastIndexOf(';'));
const installedGuides = JSON.parse(installedGuideJson);
ok(installedGuides['5:jeans-lab'].check.includes(BS + 'sigma_' + BS + 'phi'), 'installed reader guide must carry the explicit sigma_phi TeX after build');
ok(installedGuides['5:jeans-lab'].steps.some(step => step.includes(BS + 'sigma_' + BS + 'theta')), 'installed reader guide steps must use explicit sigma_theta TeX after build');

console.log(`${checks} checks passed: 5:jeans-lab second moments + independent spherical Jeans equation, 13:anisotropy-lab independent projection quadrature (${projectionCases} states) + gamma=3 cancellation, and author/generated-page contracts.`);
