// UI/model wiring and local navigation; numerical independence is checked by npm test.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const base = process.env.BOOK_PREVIEW_URL || 'http://127.0.0.1:8765';
(async () => {
  const browser = await chromium.launch({channel: 'msedge'});
  const page = await browser.newPage({viewport: {width: 1440, height: 1100}, reducedMotion: 'reduce'});
  const report = {chapters: [], states: [], errors: []}, documents = new Map();
  page.on('pageerror', e => report.errors.push(e.message));
  try {
    for (let chapter = 1; chapter <= 16; chapter++) {
      const file = chapter === 1 ? 'index.html' : `chapter-${chapter}.html`;
      await page.goto(`${base}/${file}`);
      const navigation = await page.evaluate(() => ({ids: [...document.querySelectorAll('[id]')].map(n => n.id), links: [...document.querySelectorAll('a[href]')].map(n => n.href)}));
      documents.set(file, navigation);
      report.chapters.push({chapter, readingPages: await page.locator('.reader-slide').count(), links: navigation.links.length});
      if (chapter < 9) continue;
      const labs = require(`../content/chapter-${chapter}.json`).labs;
      for (const lab of labs) {
        await page.evaluate(id => {location.hash = id + '-lab';}, lab.id);
        await page.waitForTimeout(70);
        for (const state of ['default', 'min', 'max', 'interior']) {
          await page.evaluate(({lab, state}) => {
            for (const parameter of lab.params) {
              const input = document.getElementById(lab.id + '-' + parameter.key);
              input.value = state === 'default' ? parameter.value : state === 'interior' ? parameter.min + .371 * (parameter.max - parameter.min) : parameter[state];
              input.dispatchEvent(new Event('input', {bubbles: true}));
            }
          }, {lab, state});
          const issues = await page.evaluate(lab => {
            const params = Object.fromEntries(lab.params.map(p => [p.key, +document.getElementById(lab.id + '-' + p.key).value]));
            const expected = AdvancedPhysics.evaluate(lab.model, params), node = document.getElementById(lab.id + '-chart'), plotted = BookCharts.inspect(node), errors = [];
            const same = (a, b) => a.length === b.length && a.every((p, i) => p.x === b[i].x && p.y === b[i].y);
            expected.curves.forEach((curve, i) => {
              const data = curve.data.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
              if (!same(data, plotted.series[i].data)) errors.push('registered data ' + i);
              if (expected.discrete) return;
              const path = node.querySelector(`path[data-plot-series="${i}"]`);
              if (!path || !same(path.__data__, curve.data)) {errors.push('drawn data ' + i);return;}
              const d = d3.line().defined(p => Number.isFinite(p.y) && (!expected.yLog || p.y > 0)).x(p => plotted.x(p.x)).y(p => plotted.y(p.y))(curve.data);
              if (path.getAttribute('d') !== d) errors.push('serialized path ' + i);
            });
            if (expected.point && Number.isFinite(expected.point.y) && (!expected.yLog || expected.point.y > 0)) {
              const marker = node.querySelector('.scientific-data-layer circle[r="4"]');
              if (!marker || Math.abs(+marker.getAttribute('cx') - plotted.x(expected.point.x)) > 1e-8 || Math.abs(+marker.getAttribute('cy') - plotted.y(expected.point.y)) > 1e-8) errors.push('current point');
            }
            if (node.closest('.lab').querySelector('.katex-error') || /NaN|Infinity/.test(node.innerHTML)) errors.push('invalid rendered result');
            return {errors, params, xLabel: plotted.xLabel, yLabel: plotted.yLabel};
          }, lab);
          assert.deepEqual(issues.errors, [], `${chapter}/${lab.id}/${state}`);
          report.states.push({chapter, id: lab.id, model: lab.model, state, parameters: issues.params, units: {x: issues.xLabel, y: issues.yLabel}});
        }
      }
    }
    let localLinks = 0;
    for (const [file, document] of documents) for (const href of document.links) {
      const url = new URL(href);
      if (url.origin !== new URL(base).origin) continue;
      const target = decodeURIComponent(url.pathname.slice(1)) || 'index.html';
      assert(fs.existsSync(path.join(__dirname, '../dist', target)), `${file}: missing ${target}`);
      if (url.hash && documents.has(target)) assert(documents.get(target).ids.includes(decodeURIComponent(url.hash.slice(1))), `${file}: missing ${target}${url.hash}`);
      localLinks++;
    }
    await page.goto(`${base}/rotation.html`);
    report.rotation = {layouts: [], states: []};
    for (const width of [1440, 390, 320]) for (const theme of ['afterglow', 'moon']) {
      await page.setViewportSize({width, height: 1100});
      await page.evaluate(t => BookTheme.set(t), theme);
      await page.waitForTimeout(80);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      assert(await page.locator('[data-action="play"]').isDisabled(), 'standalone lab respects reduced motion');
      assert.equal(await page.locator('path.gl-series').count(), 3);
      assert(!await page.locator('svg.gl-plot').evaluate(n => /NaN|Infinity/.test(n.innerHTML)));
      report.rotation.layouts.push({width, theme});
    }
    for (const state of ['min', 'max']) {
      await page.locator('input[data-control]').evaluateAll((ns, state) => ns.forEach(n => {
        n.value = n[state];n.dispatchEvent(new Event('input', {bubbles: true}));
      }), state);
      assert(!await page.locator('svg.gl-plot').evaluate(n => /NaN|Infinity/.test(n.innerHTML)));
      report.rotation.states.push(state);
    }
    await page.locator('[data-action="compare"]').click();
    assert.equal(await page.locator('path.gl-reference').count(), 1);
    await page.locator('[data-action="compare"]').click();
    assert.equal(await page.locator('path.gl-reference').count(), 0);
    assert.deepEqual(report.errors, []);
    report.localLinks = localLinks;
    const out = path.join(os.tmpdir(), 'galaxies-book-contracts.json');
    fs.writeFileSync(out, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({chapters: report.chapters.length, states: report.states.length, localLinks, rotationLayouts: report.rotation.layouts.length, errors: report.errors, out}));
  } finally {await browser.close();}
})().catch(e => {console.error(e);process.exitCode = 1;});
