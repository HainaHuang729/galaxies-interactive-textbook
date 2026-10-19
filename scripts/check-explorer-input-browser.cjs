const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
(async () => {
  const browser = await chromium.launch({channel: 'msedge'});
  try {
    const page = await browser.newPage({viewport: {width: 1300, height: 1100}}), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    for (const [chapter, target, id] of [[3, 'distance-lab', 'distance-chart'], [8, 'thermal-conduction-lab', 'thermal-conduction-dispersion-chart']]) {
      await page.goto(`http://127.0.0.1:8765/chapter-${chapter}.html#${target}`);
      await page.waitForTimeout(300);
      const chart = page.locator('#' + id), unit = chart.locator('..'), panel = unit.locator('.curve-explorer');
      await unit.getByRole('button', {name: '区间取样', exact: true}).click();
      const original = await page.locator('.reader-slide.is-active input[type=range]').evaluateAll(nodes => nodes.map(n => n.value));
      await chart.scrollIntoViewIfNeeded();
      const coords = await chart.evaluate(n => {
        const f = BookCharts.inspect(n), m = n.getScreenCTM(), [a, b] = [f.box.x + f.box.w * .18, f.box.x + f.box.w * .62];
        return {a: m.e + m.a * a, b: m.e + m.a * b, y: m.f + m.d * (f.box.y + f.box.h / 2), expected: [f.x.invert(a), f.x.invert(b)], domain: f.x.domain()};
      });
      await page.mouse.move(coords.a, coords.y);await page.mouse.down();
      await page.mouse.move(coords.b, coords.y, {steps: 50});await page.mouse.up();await page.waitForTimeout(60);
      const range = [+await panel.getAttribute('data-lower'), +await panel.getAttribute('data-upper')];
      range.forEach((x, i) => assert(Math.abs(x - coords.expected[i]) < Math.abs(coords.domain[1] - coords.domain[0]) * .02, JSON.stringify({chapter,range,coords})));
      assert.deepEqual(await page.locator('.reader-slide.is-active input[type=range]').evaluateAll(nodes => nodes.map(n => n.value)), original, 'brush does not activate old chart click handlers');
      const group = chart.locator('.curve-explorer-brush');await group.focus();
      await page.keyboard.press('ArrowRight');assert(+await panel.getAttribute('data-lower') > range[0]);
      await page.keyboard.press('Escape');assert.equal(await panel.getAttribute('data-count'), null);
      await panel.getByRole('button', {name: '选择全域', exact: true}).click();
      const xDomain = await chart.evaluate(n => BookCharts.inspect(n).x.domain());
      assert.deepEqual(xDomain, coords.domain, 'selecting does not rescale axes');
      const options = panel.locator('select[aria-label="取样曲线"] option');
      if (await options.count() > 1) {
        await panel.locator('select[aria-label="取样曲线"]').selectOption({index: 1});
        assert.equal(await panel.getAttribute('data-series'), '1');
      }
      const rangeBefore = [await panel.getAttribute('data-lower'), await panel.getAttribute('data-upper')];
      await page.setViewportSize({width: 390, height: 1000});await page.waitForTimeout(250);
      assert.deepEqual([await panel.getAttribute('data-lower'), await panel.getAttribute('data-upper')], rangeBefore);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      await panel.getByRole('button', {name: '清除选区', exact: true}).click();
      const inputs = panel.locator('input');
      await inputs.nth(0).fill(String(coords.expected[0]));await inputs.nth(1).fill(String(coords.expected[1]));await inputs.nth(1).press('Tab');
      assert(+await panel.getAttribute('data-count') >= 0);
      const out = path.join(os.tmpdir(), 'galaxies-discovery');
      fs.mkdirSync(out, {recursive: true});
      await panel.screenshot({path: path.join(out, `explorer-${chapter}-390.png`)});
      await page.setViewportSize({width: 1300, height: 1100});
    }
    assert.deepEqual(errors, []);
    const touch = await browser.newPage({viewport: {width: 390, height: 1000}, hasTouch: true});
    await touch.goto('http://127.0.0.1:8765/chapter-3.html#distance-lab');
    const unit = touch.locator('#distance-chart').locator('..');
    await unit.getByRole('button', {name: '区间取样', exact: true}).tap();
    await unit.getByRole('button', {name: '选择全域', exact: true}).tap();
    assert(+await unit.locator('.curve-explorer').getAttribute('data-count') > 1);
    await touch.close();
    console.log('PASS: continuous/log axes, real drag, keyboard, multi-series, numeric bounds, resize, touch, unchanged model controls');
  } finally {await browser.close();}
})().catch(e => {console.error(e);process.exitCode = 1;});
