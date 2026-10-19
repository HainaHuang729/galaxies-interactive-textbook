const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const records = require('../content/body-figures.json').figures;
(async () => {
  const browser = await chromium.launch({channel: 'msedge'});
  const page = await browser.newPage({reducedMotion: 'reduce'}), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  let figures = 0, series = 0;
  try {
    for (let chapter = 1; chapter <= 16; chapter++) {
      await page.goto(`http://127.0.0.1:8765/${chapter === 1 ? 'index' : 'chapter-' + chapter}.html`);
      await page.waitForFunction(() => !!window.BookFigureRenderers);
      if ([2,3,4].includes(chapter)) assert(!await page.getByRole('heading', {name: '开篇实验', exact: true}).count(), 'descriptive opening experiment title');
      for (const record of records.filter(r => r.chapter === chapter)) {
        const figure = page.locator('#' + record.id);
        assert((await figure.locator('.bf-purpose').first().textContent()).length > 20, record.id + ': visible reading caption');
        if (record.production === 'code') {
          await page.evaluate(id => {location.hash = id;}, record.id);
          await figure.locator('svg.bf-svg').waitFor({state: 'visible'});
          assert(await figure.evaluate(n => {
            const legend = n.querySelector('.bf-legend'), svg = n.querySelector('svg.bf-svg');
            return !legend || !!(legend.compareDocumentPosition(svg) & Node.DOCUMENT_POSITION_FOLLOWING);
          }), record.id + ': legend precedes drawing');
        }
        figures++;
      }
      if (chapter >= 4 && chapter <= 8) {
        // Visit each experiment so lazily measured plots have real geometry.
        const targets = await page.locator('.reader-experiment').evaluateAll(ns => ns.map(n => n.dataset.pageTarget).filter(Boolean));
        for (const target of targets) {
          await page.evaluate(id => {location.hash = id;}, target);
          await page.waitForTimeout(70);
          const labels = await page.locator('.reader-slide.is-active svg.chart').evaluateAll(ns => ns.flatMap(n => window.BookCharts?.inspect(n)?.series.map(s => s.label) || []));
          assert(labels.every(label => !/^曲线 \d+$/.test(label)), chapter + '/' + target + ': ' + labels);
          series += labels.length;
        }
      }
      if (chapter === 4) {
        await page.evaluate(() => {location.hash = 'transfer-lab';});
        for (const kind of ['power', 'T']) {
          await page.locator('#transfer-kind').selectOption(kind);
          const labels = await page.evaluate(() => BookCharts.inspect('transfer-chart').series.map(s => s.label));
          assert.deepEqual(labels, kind === 'power' ? ['初始功率谱 kⁿ', '经过传递的功率谱 kⁿT²(k)'] : ['振幅传递函数 T(k)']);
        }
      }
    }
    assert.equal(figures, 41);assert(series > 40);assert.deepEqual(errors, []);
    console.log(JSON.stringify({figures, namedSeriesChecked: series, transferModes: 2, errors}));
  } finally {await browser.close();}
})().catch(e => {console.error(e);process.exitCode = 1;});
