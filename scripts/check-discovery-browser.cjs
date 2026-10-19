const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const base = process.env.BOOK_PREVIEW_URL || 'http://127.0.0.1:8765';
const out = path.join(os.tmpdir(), 'galaxies-discovery');fs.mkdirSync(out, {recursive: true});
(async () => {
  const browser = await chromium.launch({channel: 'msedge'});
  const page = await browser.newPage({viewport: {width: 1360, height: 1100}, reducedMotion: 'reduce'});
  page.setDefaultTimeout(6000);
  const report = {chapters: [], experiments: [], charts: [], layouts: [], errors: []};
  page.on('pageerror', error => report.errors.push(error.message));
  async function activate(target) {
    await page.evaluate(target => {location.hash = target;}, target);
    await page.waitForTimeout(65);
    assert.equal(await page.locator('.reader-slide.is-active').getAttribute('data-page-target'), target);
  }
  async function inspectChart(chartId) {
    const chart = page.locator('#' + chartId), unit = chart.locator('..');
    const toggle = unit.getByRole('button', {name: '区间取样', exact: true});
    assert.equal(await toggle.count(), 1, chartId + ' explorer installed');
    await toggle.click();
    const panel = unit.locator('.curve-explorer');
    await panel.getByRole('button', {name: '选择全域', exact: true}).click();
    const state = await chart.evaluate(n => {
      const info = BookCharts.inspect(n), p = n.parentElement.querySelector('.curve-explorer');
      const a = +p.dataset.lower, b = +p.dataset.upper, index = +p.dataset.series;
      const points = info.series[index].data.filter(d => d.x >= a && d.x <= b && Number.isFinite(info.x(d.x)) && Number.isFinite(info.y(d.y)));
      const marks = [...n.querySelectorAll('.curve-explorer-highlight circle')].map(m => [+m.getAttribute('cx'), +m.getAttribute('cy')]);
      const selection = d3.brushSelection(n.querySelector('.curve-explorer-brush'));
      return {count: +p.dataset.count, expected: points.length, marks, positions: points.map(d => [info.x(d.x), info.y(d.y)]),
        table: [...p.querySelectorAll('tr td')].map(n => +n.textContent.replaceAll(',', '')),
        ys: points.map(d => d.y), range: [a, b], domain: info.x.domain(), selection};
    });
    assert.equal(state.count, state.expected, chartId);
    assert.equal(state.marks.length, state.expected, chartId + ' visible marks');
    state.marks.forEach((p, i) => p.forEach((v, j) => assert(Math.abs(v - state.positions[i][j]) < 1e-6, chartId + ' actual SVG coordinate')));
    if (state.ys.length) {
      const expected = [state.ys[0], state.ys.at(-1), Math.min(...state.ys), Math.max(...state.ys)];
      expected.forEach((n, i) => assert(Math.abs(state.table[i + 1] - n) <= Math.max(1e-12, Math.abs(n) * 1e-5), chartId + ' sampled table'));
    }
    await panel.getByRole('button', {name: '清除选区', exact: true}).click();
    assert.equal(await panel.getAttribute('data-count'), null);
    await toggle.click();
    report.charts.push({chartId, nodes: state.count, domain: state.domain});
  }
  try {
    for (let chapter = 1; chapter <= 16; chapter++) {
      await page.goto(`${base}/${chapter === 1 ? 'index' : 'chapter-' + chapter}.html`);
      await page.waitForTimeout(200);
      const inventory = await page.evaluate(() => [...document.querySelectorAll('.reader-experiment')].filter(n => n.querySelector('input[type=range]')).map(n => ({target: n.dataset.pageTarget, sliders: n.querySelectorAll('input[type=range]').length, attached: n.querySelectorAll('.experiment-discovery').length})));
      assert(inventory.length > 0);
      assert(inventory.every(row => row.attached === 0), 'prediction module removed from every experiment in chapter ' + chapter);
      report.chapters.push({chapter, inventory});
      for (const experiment of inventory) {
        await activate(experiment.target);
        const slide = page.locator('.reader-slide.is-active');
        const charts = await slide.locator('svg.chart').evaluateAll(nodes => nodes.map(n => ({id: n.id, eligible: n.id !== 'disk-profile-chart' && BookCharts.inspect(n)?.series.some(s => s.data.length > 1)})));
        for (const c of charts) if (c.eligible) await inspectChart(c.id);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, chapter + '#' + experiment.target + ' overflow');
        report.experiments.push({chapter, target: experiment.target, charts});
      }
      // Every chapter gets the full theme/viewport matrix on its first experiment.
      await activate(inventory[0].target);
      for (const width of [1360, 390, 320]) for (const theme of ['afterglow', 'moon']) {
        await page.setViewportSize({width, height: 1100});
        await page.evaluate(theme => BookTheme.set(theme), theme);await page.waitForTimeout(180);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${chapter} ${width} ${theme}`);
        report.layouts.push({chapter, width, theme});
        if ((chapter <= 3 || chapter === 8 || chapter === 16) && (width === 390 && theme === 'moon' || width === 1360 && theme === 'afterglow')) {
          await page.locator('.reader-slide.is-active').screenshot({path: path.join(out, `chapter-${chapter}-${width}-${theme}.png`)});
        }
      }
      await page.setViewportSize({width: 1360, height: 1100});
      console.log(`chapter ${chapter}: ${inventory.length} experiments passed`);
      fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(report, null, 2));
    }
    assert.deepEqual(report.errors, []);
    console.log(JSON.stringify({chapters: report.chapters.length, experiments: report.experiments.length, charts: report.charts.length, layouts: report.layouts.length, errors: report.errors, out}));
  } finally {await browser.close();}
})().catch(error => {console.error(error);process.exitCode = 1;});
