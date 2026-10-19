const {chromium} = require('playwright');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const out = process.env.CLARITY_AUDIT_DIR || path.join(os.tmpdir(), 'galaxies-clarity');
fs.mkdirSync(out, {recursive: true});
(async () => {
  const browser = await chromium.launch({channel: 'msedge'});
  const p = await browser.newPage({viewport: {width: 1360, height: 1100}, reducedMotion: 'reduce'});
  const report = {figures: [], experiments: [], layouts: [], errors: []};
  p.on('pageerror', e => report.errors.push(e.message));
  try {
    for (let chapter = 1; chapter <= 16; chapter++) {
      await p.goto(`http://127.0.0.1:8765/${chapter === 1 ? 'index' : 'chapter-' + chapter}.html`);
      await p.addStyleTag({content: '.bookbar,.reader-pager,.lab-tools-launcher{visibility:hidden!important}'});
      const inventory = await p.evaluate(() => {
        const clean = n => {
          if (!n) return '';
          const c = n.cloneNode(true);
          c.querySelectorAll('.katex-mathml,.glossary-ui,select,input,output,.lab-workbench').forEach(n => n.remove());
          return c.textContent.replace(/\s+/g, ' ').trim();
        };
        return {
          figures: [...document.querySelectorAll('.body-figure')].map(n => n.id),
          experiments: [...document.querySelectorAll('.reader-experiment')].filter(n => n.querySelector('input[type=range]:not(.lab-workbench input)')).map(n => ({
            target: n.dataset.pageTarget, title: clean(n.querySelector('h3,h2')), intro: clean(n.querySelector('.lab>p,.experiment-result,.scene-caption')),
            result: [...n.querySelectorAll('.experiment-result,.lab-tool-note:not(.lab-workbench *)')].map(clean),
            labels: [...n.querySelectorAll('label:not(.lab-workbench label)')].map(clean),
            charts: [...n.querySelectorAll('svg.chart')].map(n => {const f = window.BookCharts?.inspect(n);return {id: n.id, x: f?.xLabel, y: f?.yLabel, series: f?.series.map(s => s.label)};})
          }))
        };
      });
      report.experiments.push(...inventory.experiments.map(n => ({chapter, ...n})));
      for (const id of inventory.figures) {
        await p.evaluate(id => {location.hash = id;}, id);
        await p.waitForTimeout(110);
        const figure = p.locator('#' + id);
        const summary = await figure.evaluate(n => ({id: n.id, title: n.querySelector('h3').textContent, caption: n.querySelector('.bf-purpose')?.textContent,
          readout: n.querySelector(':scope>.bf-readout')?.textContent, labels: [...n.querySelectorAll('svg text')].map(n => n.textContent)}));
        report.figures.push({chapter, ...summary});
        for (const [width, theme] of [[1360, 'afterglow'], [390, 'moon']]) {
          await p.setViewportSize({width, height: 1100});
          await p.evaluate(theme => BookTheme.set(theme), theme);
          await p.waitForTimeout(180);
          const overflow = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
          assert.equal(overflow, false, id + ' ' + width);
          const file = path.join(out, `${id}-${width}.png`);
          await figure.screenshot({path: file});
          report.layouts.push({id, width, theme, file});
        }
      }
      fs.writeFileSync(path.join(out, 'inventory.json'), JSON.stringify(report, null, 2));
      console.log(`chapter ${chapter}: ${inventory.figures.length} figures / ${inventory.experiments.length} experiment descriptions`);
    }
    assert.deepEqual(report.errors, []);
    console.log(JSON.stringify({figures: report.figures.length, experiments: report.experiments.length, layouts: report.layouts.length, errors: report.errors, out}));
  } finally {await browser.close();}
})().catch(e => {console.error(e);process.exitCode = 1;});
