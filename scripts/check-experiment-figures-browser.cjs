// Browser regression for this round's experiment-figure changes.
// Run from the repository root with the local preview server running:
//   node scripts/check-experiment-figures-browser.cjs
// Override the server with BOOK_PREVIEW_URL. Screenshots and the JSON report go
// to TEMP/galaxies-experiment-figures-20261019.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const A = require('../dist/assets/advanced-physics.js');
const C = require('../dist/assets/collapse-physics.js');
const base = process.env.BOOK_PREVIEW_URL || 'http://127.0.0.1:8765';
const out = path.join(os.tmpdir(), 'galaxies-experiment-figures-20261019');
fs.mkdirSync(out, {recursive: true});
let checks = 0;
const report = {base, layouts: [], interactions: [], screenshots: [], errors: [], consoleErrors: []};
function near(actual, expected, tolerance, message) {
  assert.ok(Number.isFinite(actual) && Number.isFinite(expected), `${message}: non-finite ${actual}/${expected}`);
  assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${message}: ${actual} vs ${expected}`);
  checks++;
}
function parseNumber(text) {
  const match = /[-+]?\d[\d,\s]*(?:\.\d+)?(?:e[-+]?\d+)?/i.exec(String(text || ''));
  const exponent = /×\s*10\s*([-+]?\d+)/.exec(String(text || ''));
  return match ? Number(match[0].replaceAll(',', '').replace(/\s/g, '')) * (exponent ? 10 ** Number(exponent[1]) : 1) : NaN;
}
async function openTarget(page, chapter, target) {
  const file = `chapter-${chapter}.html`;
  await page.goto(`${base}/${file}#${target}`);
  await page.waitForFunction(() => document.body.classList.contains('reader-ready'), null, {timeout: 15000});
  await page.waitForFunction(id => {
    const slide = document.querySelector('.reader-slide.is-active');
    return !!slide && !!slide.querySelector('#' + id);
  }, target, {timeout: 15000});
  await page.waitForTimeout(350);
}
async function readChart(page, id) {
  return page.evaluate(chartId => {
    const node = document.getElementById(chartId), info = BookCharts.inspect(node);
    const marker = node.querySelector('circle[data-model-point-x]');
    return {
      series: info.series.map(series => ({label: series.label, count: series.data.length, data: series.data})),
      domain: {x: info.x.domain(), y: info.y.domain()},
      size: {w: node.clientWidth, h: node.clientHeight},
      marker: marker ? {
        x: Number(marker.dataset.modelPointX), y: Number(marker.dataset.modelPointY),
        cx: Number(marker.getAttribute('cx')), cy: Number(marker.getAttribute('cy')),
        expectedCx: info.x(Number(marker.dataset.modelPointX)), expectedCy: info.y(Number(marker.dataset.modelPointY)),
      } : null,
      pointCircle: (() => {
        const info2 = BookCharts.inspect(node);
        const circles = [...node.querySelectorAll('.scientific-data-layer circle[r="4"]')];
        return circles.map(circle => ({cx: Number(circle.getAttribute('cx')), cy: Number(circle.getAttribute('cy'))}));
      })(),
    };
  }, id);
}
async function shot(page, name, selector) {
  const locator = page.locator(selector);
  await page.mouse.move(1, 1);
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(80);
  const file = path.join(out, name + '.png');
  const hideChrome = await page.addStyleTag({content: '.reader-pager,.lab-tools-launcher{visibility:hidden!important}'});
  try {
    await page.evaluate(() => document.fonts.ready);
    const first = await locator.boundingBox();
    await page.waitForTimeout(120);
    const box = await locator.boundingBox();
    assert.ok(first && box && Math.abs(first.width-box.width)<1 && Math.abs(first.height-box.height)<1, 'figure dimensions must settle before capture');
    const scroll = await page.evaluate(() => ({x: scrollX, y: scrollY}));
    // Capture document coordinates directly; element capture repeatedly scrolls
    // the tall, focused experiment while the reader maintains its scroll position.
    await page.screenshot({path: file, animations: 'disabled', clip: {x: box.x+scroll.x, y: box.y+scroll.y, width: box.width, height: box.height}});
  } finally {
    await hideChrome.evaluate(node => node.remove());
  }
  report.screenshots.push(path.basename(file));
  return file;
}
// Genuine pointer drag (no synthetic input events): centre the range in the safe
// viewport area because the reader pager overlays the bottom of the screen, press
// on the actual thumb position derived from the current value, then drag the thumb.
async function dragRangeTo(page, selector, fraction) {
  const slider = page.locator(selector);
  const viewport = page.viewportSize();
  const safeTop = 96, safeBottom = viewport.height - 120;
  let last;
  for (let attempt = 0; attempt < 2; attempt++) {
    await slider.scrollIntoViewIfNeeded();
    await page.waitForTimeout(120);
    let box = await slider.boundingBox();
    assert.ok(box, `${selector}: no bounding box`);
    if (box.y < safeTop || box.y + box.height > safeBottom) {
      const delta = box.y + box.height / 2 - (safeTop + safeBottom) / 2;
      await page.evaluate(value => window.scrollBy(0, value), delta);
      await page.waitForTimeout(150);
      box = await slider.boundingBox();
    }
    const meta = await slider.evaluate(el => ({min: +el.min, max: +el.max, step: +el.step || 1, value: +el.value}));
    const thumbInset = 8, trackLeft = box.x + thumbInset, trackWidth = Math.max(1, box.width - thumbInset * 2);
    const startFraction = (meta.value - meta.min) / (meta.max - meta.min);
    const startX = trackLeft + startFraction * trackWidth, endX = trackLeft + fraction * trackWidth, y = box.y + box.height / 2;
    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(endX, y, {steps: 18});
    await page.mouse.up();
    await page.waitForTimeout(150);
    const value = await slider.evaluate(el => +el.value);
    last = {value, box, startX, endX, startFraction, targetFraction: fraction};
    const expected = meta.min + (meta.max - meta.min) * fraction;
    if (Math.abs(value - expected) <= Math.max(meta.step * 2, 0.02)) break;
  }
  return last;
}
async function layoutMatrix(page, chapter, target, prefix) {
  for (const theme of ['afterglow', 'moon']) {
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({width, height: 1100});
      await page.evaluate(value => BookTheme.set(value), theme);
      await page.waitForTimeout(350);
      const state = await page.evaluate(id => {
        const lab = document.getElementById(id);
        const canvas = lab.querySelector('canvas');
        return {
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          labWidth: lab.getBoundingClientRect().width,
          canvas: canvas ? {w: canvas.getBoundingClientRect().width, h: canvas.getBoundingClientRect().height, aria: canvas.getAttribute('aria-label'), textBounds: canvas.dataset.textBounds ? JSON.parse(canvas.dataset.textBounds) : null} : null,
          theme: document.documentElement.dataset.bookTheme,
          katexErrors: lab.querySelectorAll('.katex-error').length,
          nanText: /NaN|Infinity/.test(lab.textContent),
        };
      }, target);
      assert.equal(state.overflow, false, `${prefix} ${theme} ${width}: horizontal overflow`);
      assert.equal(state.theme, theme, `${prefix} theme should switch`);
      assert.equal(state.katexErrors, 0, `${prefix} ${theme} ${width}: KaTeX error`);
      assert.equal(state.nanText, false, `${prefix} ${theme} ${width}: NaN/Infinity in visible text`);
      if (state.canvas) {
        assert.ok(state.canvas.w > 120 && state.canvas.h > 120, `${prefix} ${theme} ${width}: canvas too small`);
        assert.ok(state.canvas.aria && state.canvas.aria.length > 30, `${prefix} ${theme} ${width}: canvas needs a descriptive label`);
        if (state.canvas.textBounds) {
          const bounds = state.canvas.textBounds;
          assert.ok(bounds.minX >= -1 && bounds.maxX <= state.canvas.w + 1, `${prefix} ${theme} ${width}: canvas text clipped horizontally (${bounds.minX}..${bounds.maxX} in ${state.canvas.w})`);
          assert.ok(bounds.minY >= -1 && bounds.maxY <= state.canvas.h + 1, `${prefix} ${theme} ${width}: canvas text clipped vertically (${bounds.minY}..${bounds.maxY} in ${state.canvas.h})`);
        }
      }
      report.layouts.push({prefix, theme, width, ...state});
      await shot(page, `${prefix}-${theme}-${width}`, '#' + target);
    }
  }
}
(async () => {
  const browser = await chromium.launch({channel: 'msedge'});
  const context = await browser.newContext({viewport: {width: 1440, height: 1100}, reducedMotion: 'reduce'});
  const page = await context.newPage();
  // The preview has no favicon; keep its browser-generated request out of app errors.
  await page.route('**/favicon.ico', route => route.fulfill({status: 204}));
  report.favicon = 'browser-generated favicon request stubbed with HTTP 204';
  await page.addInitScript(() => {
    window.__renderedText = node => {
      if (!node) return '';
      const clone = node.cloneNode(true);
      clone.querySelectorAll('.katex-mathml, .sr-only').forEach(el => el.remove());
      return (clone.innerText || clone.textContent || '').replace(/\s+/g, ' ').trim();
    };
    window.__inlineTex = node => [...(node?.querySelectorAll?.('.inline-math[data-inline-tex]') || [])].map(el => el.getAttribute('data-inline-tex')).join(' ');
    window.__katexAnnotations = node => [...(node?.querySelectorAll?.('.katex annotation[encoding="application/x-tex"]') || [])].map(el => el.textContent).join(' ');
  });
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  try {
    // ---------- 5: jeans-lab ----------
    await openTarget(page, 5, 'jeans-lab');
    const jeansDefault = await page.evaluate(() => {
      const lab = document.getElementById('jeans-lab'), canvas = document.getElementById('jeans-moment-canvas');
      const value = id => document.getElementById(id).value;
      return {
        ids: {canvas: !!canvas, note: !!document.getElementById('jeans-moment-note'), reset: !!document.getElementById('jeans-reset'), chart: !!document.getElementById('jeans-chart')},
        params: {gamma: +value('jeans-gamma'), sigma: +value('jeans-sigma'), beta: +value('jeans-beta')},
        dataset: canvas ? {r: +canvas.dataset.sigmaR, t: +canvas.dataset.sigmaT, tSum: +canvas.dataset.sigmaTSum, beta: +canvas.dataset.beta, barScale: +canvas.dataset.barScale, barWidths: JSON.parse(canvas.dataset.barWidths || '[]')} : null,
        aria: canvas ? canvas.getAttribute('aria-label') : '',
        note: __renderedText(document.getElementById('jeans-moment-note')),
        noteTex: __inlineTex(document.getElementById('jeans-moment-note')),
        noteAnnotations: __katexAnnotations(document.getElementById('jeans-moment-note')),
        vc: document.getElementById('jeans-vc').textContent,
        mass: document.getElementById('jeans-mass').textContent,
        tangent: document.getElementById('jeans-tangent').textContent,
        result: __renderedText(document.getElementById('jeans-result')),
        resultAnnotations: __katexAnnotations(document.getElementById('jeans-result')),
      };
    });
    assert.deepEqual(jeansDefault.ids, {canvas: true, note: true, reset: true, chart: true}, 'jeans lab needs moment canvas, note, reset and chart');
    assert.deepEqual(jeansDefault.params, {gamma: 3, sigma: 150, beta: 0}, 'jeans defaults');
    near(jeansDefault.dataset.r, 150, 1e-9, 'canvas radial sigma');
    near(jeansDefault.dataset.t, 150, 1e-9, 'canvas single tangential sigma');
    near(jeansDefault.dataset.tSum, Math.SQRT2 * 150, 1e-9, 'canvas combined tangential sigma');
    near(parseNumber(jeansDefault.vc), 150 * Math.sqrt(3), 1e-3, 'jeans default Vc');
    near(parseNumber(jeansDefault.tangent), 1, 1e-6, 'jeans default single tangential ratio');
    near(parseNumber(jeansDefault.mass), 10 * 3 * 150 * 150 / 4.30091e-6 / 1e11, 1e-3, 'jeans default mass');
    assert.ok(jeansDefault.note.includes('212.1') && jeansDefault.note.includes('合成'), 'live note must show the combined value and explain the combination');
    assert.ok(jeansDefault.noteTex.includes('\\sigma_\\phi'), 'live note must provide explicit sigma_phi TeX');
    assert.ok(/\\sigma_\{?\\phi\}?/.test(jeansDefault.noteAnnotations), 'note KaTeX annotation must use sigma_phi, not sigma times phi');
    assert.ok(jeansDefault.aria.includes('两分量') && jeansDefault.aria.includes('不是真实恒星轨道'), 'canvas aria-label must explain directions and the non-orbit scope');
    assert.ok(jeansDefault.aria.includes('固定 0–400'), 'canvas aria-label must state the fixed bar scale');
    near(jeansDefault.dataset.barScale, 400, 1e-9, 'bars must use the fixed 0-400 km/s scale');
    assert.equal(jeansDefault.dataset.barWidths.length, 3, 'three component bars must expose their widths');
    assert.ok(jeansDefault.dataset.barWidths[2] > jeansDefault.dataset.barWidths[0], 'combined bar must be longer than the radial bar');
    assert.ok(jeansDefault.result.includes('恒星动力学') && jeansDefault.result.includes('不是气体') && jeansDefault.result.includes('两分量合成'), 'result must separate stellar anisotropy from gas Jeans and state the combination');
    assert.ok(/\\sigma_\{?\\phi\}?/.test(jeansDefault.resultAnnotations), 'result KaTeX annotation must use sigma_phi');
    const jeansChartDefault = await readChart(page, 'jeans-chart');
    assert.equal(jeansChartDefault.series.length, 1, 'jeans chart has one curve');
    near(jeansChartDefault.marker.x, 0, 1e-12, 'jeans marker beta');
    near(jeansChartDefault.marker.y, 150 * Math.sqrt(3), 1e-6, 'jeans marker Vc');
    near(jeansChartDefault.marker.cx, jeansChartDefault.marker.expectedCx, 0.7, 'jeans marker x pixel');
    near(jeansChartDefault.marker.cy, jeansChartDefault.marker.expectedCy, 0.7, 'jeans marker y pixel');
    const atDefault = jeansChartDefault.series[0].data.find(point => Math.abs(point.x - 0) < 1e-12);
    assert.ok(atDefault, 'jeans curve must include the current beta sample');
    near(atDefault.y, 150 * Math.sqrt(3), 1e-6, 'jeans curve value at current beta');
    await shot(page, '5-jeans-lab-default-afterglow-1440', '#jeans-lab');
    report.interactions.push({id: '5:jeans-lab', state: 'default', values: jeansDefault.params});

    // Real pointer drag on the beta slider, then keyboard, then reset.
    const betaSlider = page.locator('#jeans-beta');
    const betaDrag = await dragRangeTo(page, '#jeans-beta', 0.86);
    assert.ok(betaDrag.value > 0.2, `real drag must move beta to the radial side (got ${betaDrag.value}; box=${JSON.stringify(betaDrag.box)})`);
    const betaBox = betaDrag.box;
    const dragged = await page.evaluate(() => {
      const canvas = document.getElementById('jeans-moment-canvas');
      const lab = document.getElementById('jeans-lab');
      return {
        beta: +document.getElementById('jeans-beta').value,
        sigma: +document.getElementById('jeans-sigma').value,
        gamma: +document.getElementById('jeans-gamma').value,
        betaText: document.getElementById('jeans-beta-value').textContent,
        dataset: {r: +canvas.dataset.sigmaR, t: +canvas.dataset.sigmaT, tSum: +canvas.dataset.sigmaTSum, beta: +canvas.dataset.beta, barScale: +canvas.dataset.barScale, barWidths: JSON.parse(canvas.dataset.barWidths || '[]')},
        vc: document.getElementById('jeans-vc').textContent,
        tangent: document.getElementById('jeans-tangent').textContent,
        note: __renderedText(document.getElementById('jeans-moment-note')),
        noteAnnotations: __katexAnnotations(document.getElementById('jeans-moment-note')),
        result: __renderedText(document.getElementById('jeans-result')),
        resultAnnotations: __katexAnnotations(document.getElementById('jeans-result')),
        marker: (() => {
          const node = document.getElementById('jeans-chart');
          const info = BookCharts.inspect(node);
          const marker = node.querySelector('circle[data-model-point-x]');
          return {x: +marker.dataset.modelPointX, y: +marker.dataset.modelPointY, cx: +marker.getAttribute('cx'), cy: +marker.getAttribute('cy'), expectedCx: info.x(+marker.dataset.modelPointX), expectedCy: info.y(+marker.dataset.modelPointY)};
        })(),
      };
    });
    assert.ok(dragged.beta > 0.2, 'real drag must move beta to the radial side');
    near(parseNumber(dragged.betaText), dragged.beta, 0.011, 'beta output follows the real drag');
    near(dragged.dataset.beta, dragged.beta, 1e-9, 'canvas beta follows the real drag');
    const dragModel = C.jeans(dragged.gamma, dragged.beta, dragged.sigma);
    near(dragged.dataset.t, dragModel.sigmaTangential, 1e-9, 'canvas single tangential component follows the model');
    near(dragged.dataset.tSum, Math.SQRT2 * dragModel.sigmaTangential, 1e-9, 'canvas combined tangential component follows the model');
    near(dragged.dataset.barScale, 400, 1e-9, 'bar scale must stay fixed at 0-400 km/s during the drag');
    assert.ok(Math.abs(dragged.dataset.barWidths[2] - dragged.dataset.barWidths[0] * Math.sqrt(2 * (1 - dragged.beta))) < 0.02, 'combined-to-radial bar ratio follows beta within 0.02px (stored widths round to 0.01px)');
    near(parseNumber(dragged.vc), dragModel.vc, 0.06, 'Vc readout follows the model after drag');
    near(parseNumber(dragged.tangent), dragModel.sigmaTangential / dragged.sigma, 0.0011, 'tangential ratio readout follows the model after drag');
    assert.ok(dragged.note.includes((Math.SQRT2 * dragModel.sigmaTangential).toFixed(1)), 'live note must update the combined value');
    assert.ok(/\\sigma_\{?\\phi\}?/.test(dragged.noteAnnotations), 'dragged note annotation must keep sigma_phi');
    assert.ok(/\\sigma_\{?\\phi\}?/.test(dragged.resultAnnotations), 'dragged result annotation must keep sigma_phi');
    assert.ok(dragged.result.includes('偏径向'), 'result must call beta>0 radial');
    near(dragged.marker.x, dragged.beta, 1e-9, 'marker beta after drag');
    near(dragged.marker.y, dragModel.vc, 0.06, 'marker Vc after drag');
    near(dragged.marker.cx, dragged.marker.expectedCx, 0.7, 'marker x after drag');
    near(dragged.marker.cy, dragged.marker.expectedCy, 0.7, 'marker y after drag');
    report.interactions.push({id: '5:jeans-lab', state: 'pointer-drag', beta: dragged.beta, vc: dragModel.vc});
    await shot(page, '5-jeans-lab-drag-radial-afterglow-1440', '#jeans-lab');

    await betaSlider.focus();
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    const keyboardState = await page.evaluate(() => ({beta: +document.getElementById('jeans-beta').value, betaText: document.getElementById('jeans-beta-value').textContent}));
    near(keyboardState.beta, -0.5 + 0.04, 1e-9, 'keyboard Home+2 ArrowRight must move beta by two steps');
    near(parseNumber(keyboardState.betaText), keyboardState.beta, 0.011, 'keyboard output follows the slider');
    const tangentialState = await page.evaluate(() => ({result: __renderedText(document.getElementById('jeans-result')), beta: +document.getElementById('jeans-beta').value}));
    await page.keyboard.press('End');
    await page.waitForTimeout(100);
    assert.equal(+await page.locator('#jeans-beta').inputValue(), 0.7, 'keyboard End must reach the slider maximum');
    assert.ok(tangentialState.result.includes('偏切向'), 'beta<0 must read as tangential anisotropy');
    report.interactions.push({id: '5:jeans-lab', state: 'keyboard', beta: tangentialState.beta});
    await page.locator('#jeans-reset').click();
    await page.waitForTimeout(150);
    const resetState = await page.evaluate(() => ({
      gamma: +document.getElementById('jeans-gamma').value,
      sigma: +document.getElementById('jeans-sigma').value,
      beta: +document.getElementById('jeans-beta').value,
      vc: document.getElementById('jeans-vc').textContent,
      tangent: document.getElementById('jeans-tangent').textContent,
      canvas: {r: +document.getElementById('jeans-moment-canvas').dataset.sigmaR, t: +document.getElementById('jeans-moment-canvas').dataset.sigmaT, barScale: +document.getElementById('jeans-moment-canvas').dataset.barScale, barWidths: JSON.parse(document.getElementById('jeans-moment-canvas').dataset.barWidths || '[]')},
      result: __renderedText(document.getElementById('jeans-result')),
    }));
    assert.deepEqual({gamma: resetState.gamma, sigma: resetState.sigma, beta: resetState.beta}, {gamma: 3, sigma: 150, beta: 0}, 'reset must restore jeans defaults');
    near(parseNumber(resetState.vc), 150 * Math.sqrt(3), 1e-3, 'reset Vc');
    near(parseNumber(resetState.tangent), 1, 1e-6, 'reset tangential ratio');
    near(resetState.canvas.r, 150, 1e-9, 'reset canvas radial sigma');
    near(resetState.canvas.t, 150, 1e-9, 'reset canvas tangential sigma');
    assert.ok(resetState.result.includes('各向同性'), 'reset must read as isotropic');
    report.interactions.push({id: '5:jeans-lab', state: 'reset'});

    // Fixed bar scale: changing sigma_r must change bar lengths, not the scale.
    await page.locator('#jeans-sigma').focus();
    await page.keyboard.press('End');
    await page.waitForTimeout(150);
    const sigmaMax = await page.evaluate(() => {
      const canvas = document.getElementById('jeans-moment-canvas');
      return {sigma: +document.getElementById('jeans-sigma').value, sigmaR: +canvas.dataset.sigmaR, barScale: +canvas.dataset.barScale, barWidths: JSON.parse(canvas.dataset.barWidths || '[]'), aria: canvas.getAttribute('aria-label')};
    });
    assert.equal(sigmaMax.sigma, 220, 'keyboard End must reach the sigma maximum');
    near(sigmaMax.sigmaR, 220, 1e-9, 'canvas radial sigma follows the slider maximum');
    near(sigmaMax.barScale, 400, 1e-9, 'bar scale must remain fixed when sigma_r changes');
    assert.ok(sigmaMax.barWidths[0] > resetState.canvas.barWidths[0], 'changing sigma_r must lengthen the radial bar on the fixed scale');
    assert.ok(sigmaMax.barWidths[1] > resetState.canvas.barWidths[1], 'changing sigma_r must lengthen the tangential bar on the fixed scale');
    assert.ok(sigmaMax.aria.includes('固定 0–400'), 'aria must still state the fixed scale');
    report.interactions.push({id: '5:jeans-lab', state: 'sigma-max-fixed-bars', sigma: 220, barWidths: sigmaMax.barWidths});
    await shot(page, '5-jeans-lab-sigma220-afterglow-1440', '#jeans-lab');
    await page.locator('#jeans-reset').click();
    await page.waitForTimeout(150);
    assert.equal(+await page.locator('#jeans-sigma').inputValue(), 150, 'second reset must restore sigma');

    // Theme switch must preserve state; screenshot in both themes.
    await page.evaluate(() => BookTheme.set('moon'));
    await page.waitForTimeout(300);
    const themeState = await page.evaluate(() => ({
      theme: document.documentElement.dataset.bookTheme,
      dataset: {r: +document.getElementById('jeans-moment-canvas').dataset.sigmaR, t: +document.getElementById('jeans-moment-canvas').dataset.sigmaT, tSum: +document.getElementById('jeans-moment-canvas').dataset.sigmaTSum},
      marker: !!document.querySelector('#jeans-chart circle[data-model-point-x]'),
    }));
    assert.equal(themeState.theme, 'moon', 'theme switch applies');
    assert.deepEqual(themeState.dataset, {r: 150, t: 150, tSum: Math.SQRT2 * 150}, 'theme switch must not reset the moment state');
    assert.ok(themeState.marker, 'theme switch must keep the current point');
    await shot(page, '5-jeans-lab-moon-1440-switch', '#jeans-lab');
    report.interactions.push({id: '5:jeans-lab', state: 'theme-switch'});
    await page.setViewportSize({width: 1440, height: 1100});
    await page.evaluate(() => BookTheme.set('afterglow'));
    await layoutMatrix(page, 5, 'jeans-lab', '5-jeans-lab');

    // ---------- 13: anisotropy-lab ----------
    await openTarget(page, 13, 'anisotropy-lab');
    const anisotropyDefault = await page.evaluate(() => {
      const lab = document.getElementById('anisotropy-lab');
      return {
        params: {gamma: +document.getElementById('anisotropy-gamma').value, beta: +document.getElementById('anisotropy-beta').value, sigma: +document.getElementById('anisotropy-sigma').value},
        legend: [...lab.querySelectorAll('.advanced-legend > span')].map(node => __renderedText(node)),
        values: [...lab.querySelectorAll('.readout-row strong')].map(node => __renderedText(node)),
        result: __renderedText(document.getElementById('anisotropy-result')),
        validity: (() => {const node = lab.querySelector('.lab-validity'); return node && !node.hidden ? __renderedText(node) : null;})(),
        params2: [...lab.querySelectorAll('.instrument-controls label')].map(node => __renderedText(node)),
      };
    });
    assert.deepEqual(anisotropyDefault.params, {gamma: 2.5, beta: 0, sigma: 200}, 'anisotropy defaults');
    assert.equal(anisotropyDefault.legend.length, 2, 'anisotropy legend must show current-gamma and gamma=3 reference curves');
    assert.ok(anisotropyDefault.legend[1].includes('参考') && anisotropyDefault.legend[1].includes('3'), 'reference legend entry must name the gamma=3 reference');
    const anisotropyModelDefault = A.models.anisotropy(anisotropyDefault.params);
    near(parseNumber(anisotropyDefault.values[0]), anisotropyModelDefault.values[0], 2e-5, 'anisotropy Vc readout');
    near(parseNumber(anisotropyDefault.values[1]), anisotropyModelDefault.values[1], 2e-5, 'anisotropy sigma_r readout');
    near(parseNumber(anisotropyDefault.values[2]), anisotropyModelDefault.values[2], 5e-3, 'anisotropy mass readout');
    assert.equal(anisotropyDefault.validity, null, 'gamma=3 note must stay hidden at gamma=2.5');
    assert.ok(anisotropyDefault.result.includes('固定') && anisotropyDefault.result.includes('视向'), 'result must explain what is fixed');
    const anisotropyChartDefault = await readChart(page, 'anisotropy-chart');
    assert.equal(anisotropyChartDefault.series.length, 2, 'anisotropy chart must plot two curves');
    assert.ok(anisotropyChartDefault.series[0].label.includes('当前') && anisotropyChartDefault.series[1].label.includes('γ=3'), 'registered series must distinguish the two curves');
    for (const point of anisotropyChartDefault.series[1].data) near(point.y, Math.sqrt(3) * 200, 1e-9, 'gamma=3 reference curve must be flat');
    const anisotropyPointDefault = await page.evaluate(({beta, vc}) => {
      const node = document.getElementById('anisotropy-chart'), info = BookCharts.inspect(node);
      const circle = node.querySelector('.scientific-data-layer circle[r="4"]');
      return {cx: +circle.getAttribute('cx'), cy: +circle.getAttribute('cy'), ex: info.x(beta), ey: info.y(vc)};
    }, {beta: anisotropyDefault.params.beta, vc: anisotropyModelDefault.values[0]});
    near(anisotropyPointDefault.cx, anisotropyPointDefault.ex, 0.7, 'anisotropy marker x pixel');
    near(anisotropyPointDefault.cy, anisotropyPointDefault.ey, 0.7, 'anisotropy marker y pixel');
    await shot(page, '13-anisotropy-lab-default-afterglow-1440', '#anisotropy-lab');
    report.interactions.push({id: '13:anisotropy-lab', state: 'default', values: anisotropyDefault.params});

    // Real drag on beta: Vc must change at gamma=2.5.
    const anisotropyBeta = page.locator('#anisotropy-beta');
    const anisotropyDrag = await dragRangeTo(page, '#anisotropy-beta', 0.18);
    assert.ok(anisotropyDrag.value < -0.1, `real drag must move beta to the tangential side (got ${anisotropyDrag.value}; box=${JSON.stringify(anisotropyDrag.box)})`);
    const anisotropyDragged = await page.evaluate(() => {
      const lab = document.getElementById('anisotropy-lab');
      const values = [...lab.querySelectorAll('.readout-row strong')].map(node => __renderedText(node));
      const node = document.getElementById('anisotropy-chart'), info = BookCharts.inspect(node);
      const circle = node.querySelector('.scientific-data-layer circle[r="4"]');
      return {
        params: {gamma: +document.getElementById('anisotropy-gamma').value, beta: +document.getElementById('anisotropy-beta').value, sigma: +document.getElementById('anisotropy-sigma').value},
        values,
        result: __renderedText(document.getElementById('anisotropy-result')),
        circle: circle ? {cx: +circle.getAttribute('cx'), cy: +circle.getAttribute('cy'), expectedCx: info.x(+circle.getAttribute('cx')), expectedCy: info.y(+circle.getAttribute('cy'))} : null,
      };
    });
    assert.ok(anisotropyDragged.params.beta < -0.1, 'real drag must move beta to the tangential side');
    const anisotropyModelDragged = A.models.anisotropy(anisotropyDragged.params);
    near(parseNumber(anisotropyDragged.values[0]), anisotropyModelDragged.values[0], 2e-5, 'Vc readout after anisotropy drag');
    near(parseNumber(anisotropyDragged.values[1]), anisotropyModelDragged.values[1], 2e-5, 'sigma_r readout after anisotropy drag');
    near(parseNumber(anisotropyDragged.values[2]), anisotropyModelDragged.values[2], 5e-3, 'mass readout after anisotropy drag');
    near(parseNumber(await page.locator('#anisotropy-beta-value').innerText()), anisotropyDragged.params.beta, 0.001, 'visible beta readout follows the tangential drag');
    report.interactions.push({id: '13:anisotropy-lab', state: 'pointer-drag', beta: anisotropyDragged.params.beta, vc: anisotropyModelDragged.values[0]});
    await shot(page, '13-anisotropy-lab-drag-tangential-afterglow-1440', '#anisotropy-lab');

    // Keyboard to gamma=3: flat Vc and the projection-cancellation note.
    const gammaSlider = page.locator('#anisotropy-gamma');
    await gammaSlider.focus();
    await page.keyboard.press('End');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(150);
    const gamma3 = await page.evaluate(() => {
      const lab = document.getElementById('anisotropy-lab');
      return {
        gamma: +document.getElementById('anisotropy-gamma').value,
        beta: +document.getElementById('anisotropy-beta').value,
        values: [...lab.querySelectorAll('.readout-row strong')].map(node => __renderedText(node)),
        validity: (() => {const node = lab.querySelector('.lab-validity'); return node && !node.hidden ? __renderedText(node) : null;})(),
        curve: BookCharts.inspect(document.getElementById('anisotropy-chart')).series.map(series => ({label: series.label, first: series.data[0], last: series.data[series.data.length - 1]})),
        note: __renderedText(document.getElementById('anisotropy-result')),
      };
    });
    near(gamma3.gamma, 3, 1e-9, 'keyboard must reach gamma=3');
    assert.ok(gamma3.validity && gamma3.validity.includes('投影') && gamma3.validity.includes('质量') && !gamma3.validity.includes('无法区分'), 'gamma=3 must show the projection-cancellation note without a false beta-mass degeneracy');
    const gamma3Model = A.models.anisotropy({gamma: 3, beta: gamma3.beta, sigma: 200});
    near(parseNumber(gamma3.values[0]), Math.sqrt(3) * 200, 1e-6, 'gamma=3 Vc must be sqrt(3) sigma_los');
    near(parseNumber(gamma3.values[0]), gamma3Model.values[0], 2e-6, 'gamma=3 Vc readout (three decimal places)');
    const flatSeries = gamma3.curve[0].first.y - gamma3.curve[0].last.y;
    near(flatSeries, 0, 1e-9, 'current curve at gamma=3 must be flat');
    near(gamma3.curve[1].first.y, Math.sqrt(3) * 200, 1e-9, 'reference curve at gamma=3');
    assert.ok(gamma3.note.includes('投影') && gamma3.note.includes('质量'), 'result must mention the gamma=3 projection cancellation and the mass behavior');
    const betaBefore = gamma3.beta;
    const vcBefore = parseNumber(gamma3.values[0]);
    await page.locator('#anisotropy-beta').focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(120);
    const betaAfter = await page.evaluate(() => ({beta: +document.getElementById('anisotropy-beta').value, values: [...document.querySelectorAll('#anisotropy-lab .readout-row strong')].map(node => __renderedText(node))}));
    assert.ok(Math.abs(betaAfter.beta - betaBefore) > 1e-9, 'beta must move at gamma=3');
    near(parseNumber(betaAfter.values[0]), vcBefore, 1e-6, 'gamma=3 Vc must not change with beta');
    assert.ok(Math.abs(parseNumber(betaAfter.values[1]) - parseNumber(gamma3.values[1])) > 1e-6, 'sigma_r must still change with beta at gamma=3');
    report.interactions.push({id: '13:anisotropy-lab', state: 'gamma3-keyboard', gamma: 3, beta: betaAfter.beta});
    await shot(page, '13-anisotropy-lab-gamma3-afterglow-1440', '#anisotropy-lab');

    // Reset and theme/layout matrix.
    await page.locator('#anisotropy-reset').click();
    await page.waitForTimeout(150);
    const anisotropyReset = await page.evaluate(() => ({
      gamma: +document.getElementById('anisotropy-gamma').value,
      beta: +document.getElementById('anisotropy-beta').value,
      sigma: +document.getElementById('anisotropy-sigma').value,
      legend: [...document.querySelectorAll('#anisotropy-lab .advanced-legend > span')].map(node => __renderedText(node)),
      validity: (() => {const node = document.querySelector('#anisotropy-lab .lab-validity'); return node && !node.hidden ? __renderedText(node) : null;})(),
    }));
    assert.deepEqual({gamma: anisotropyReset.gamma, beta: anisotropyReset.beta, sigma: anisotropyReset.sigma}, {gamma: 2.5, beta: 0, sigma: 200}, 'anisotropy reset must restore defaults');
    assert.equal(anisotropyReset.validity, null, 'reset must hide the gamma=3 note again');
    assert.equal(anisotropyReset.legend.length, 2, 'reset must keep both curves');
    report.interactions.push({id: '13:anisotropy-lab', state: 'reset'});
    await page.evaluate(() => BookTheme.set('moon'));
    await page.waitForTimeout(300);
    const anisotropyTheme = await page.evaluate(() => ({theme: document.documentElement.dataset.bookTheme, curves: document.querySelectorAll('#anisotropy-chart path[data-plot-series]').length, legend: document.querySelectorAll('#anisotropy-lab .advanced-legend > span').length}));
    assert.equal(anisotropyTheme.theme, 'moon', 'anisotropy theme applies');
    assert.equal(anisotropyTheme.curves, 2, 'theme switch must keep both curves');
    await shot(page, '13-anisotropy-lab-moon-1440-switch', '#anisotropy-lab');
    report.interactions.push({id: '13:anisotropy-lab', state: 'theme-switch'});
    await page.setViewportSize({width: 1440, height: 1100});
    await page.evaluate(() => BookTheme.set('afterglow'));
    await layoutMatrix(page, 13, 'anisotropy-lab', '13-anisotropy-lab');

    assert.deepEqual(report.errors, [], 'no uncaught page errors');
    assert.deepEqual(report.consoleErrors, [], 'no console errors');
    report.checks = checks;
    report.summary = {labs: 2, layouts: report.layouts.length, interactions: report.interactions.length, screenshots: report.screenshots.length};
    fs.writeFileSync(path.join(out, 'experiment-figure-browser-report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({checks, ...report.summary, errors: report.errors.length, consoleErrors: report.consoleErrors.length, out}));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
