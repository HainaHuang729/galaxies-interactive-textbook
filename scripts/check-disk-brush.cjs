const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const A = require('../dist/assets/advanced-physics.js');
const {chromium} = require('playwright');

function integral(a, b) {
  const n = 10000, h = (b - a) / n;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const x = a + (i + .5) * h;
    sum += x * Math.exp(-x) * h;
  }
  return sum;
}
for (const [a, b] of [[0, 1], [1, 2], [3, 4], [0, 18], [.01, .02], [5.999, 6]]) {
  const actual = A.diskEnclosed(b) - A.diskEnclosed(a), expected = integral(a, b);
  assert(Math.abs(actual - expected) < 2e-7 * expected, `${a}–${b}: independent integral`);
}
assert.equal(A.diskEnclosed(0), 0);

(async () => {
  const browser = await chromium.launch({channel: 'msedge'});
  const out = path.join(os.tmpdir(), 'galaxies-disk-brush');
  fs.mkdirSync(out, {recursive: true});
  try {
    const page = await browser.newPage({viewport: {width: 1300, height: 1100}});
    const errors = [], cases = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:8765/chapter-11.html#disk-profile-lab');
    const panel = page.locator('.disk-range-tools');
    await panel.waitFor();
    await page.waitForTimeout(300);
    const fraction = async () => +(await panel.getAttribute('data-fraction'));
    const check = async (a, b) => {
      assert(Math.abs(await fraction() - integral(a, b)) < 2e-7 * integral(a, b));
      const data = await page.evaluate(() => {
        const chart = document.getElementById('disk-profile-chart'), p = BookCharts.inspect(chart);
        const brush = d3.brushSelection(chart.querySelector('.disk-radius-brush'));
        const selected = document.querySelector('.disk-range-tools');
        const a = +selected.dataset.inner, b = +selected.dataset.outer;
        const canvas = document.getElementById('disk-profile-scene');
        const expectedRadius = b * +document.getElementById('disk-profile-Rd').value / 20 * Math.min(canvas.clientWidth - 60, canvas.clientHeight - 65) / 2;
        return {brush, expected: [p.x(a), p.x(b)], ring: document.querySelector('.disk-annulus-overlay path')?.getAttribute('d'), expectedRadius};
      });
      assert(data.ring && !data.ring.includes('NaN'));
      const actualRadius = +data.ring.match(/A([\d.]+),/)[1];
      assert(Math.abs(actualRadius - data.expectedRadius) < .001, 'actual SVG annulus radius follows the physical radius');
      data.brush.forEach((v, i) => assert(Math.abs(v - data.expected[i]) < 1e-7));
      cases.push([a, b]);
    };
    await check(1, 3);
    for (const [a, b, name] of [[0, 1, '内圈 0–1'], [1, 2, '中圈 1–2'], [3, 4, '外圈 3–4']]) {
      await panel.getByRole('button', {name, exact: true}).click();
      await check(a, b);
    }
    // Drag through the actual D3 gesture, then verify inverted chart coordinates.
    await page.locator('#disk-profile-chart').scrollIntoViewIfNeeded();
    const coordinates = await page.evaluate(() => {
      const n = document.getElementById('disk-profile-chart'), f = BookCharts.inspect(n), r = n.getBoundingClientRect();
      return {a: r.left + f.x(.5), b: r.left + f.x(2.5), y: r.top + f.box.y + f.box.h / 2};
    });
    await page.mouse.move(coordinates.a, coordinates.y);
    await page.mouse.down();
    await page.mouse.move(coordinates.b, coordinates.y, {steps: 30});
    await page.mouse.up();
    await page.waitForTimeout(50);
    const low = +(await panel.getAttribute('data-inner')), high = +(await panel.getAttribute('data-outer'));
    assert(Math.abs(low - .5) < .03 && Math.abs(high - 2.5) < .03, JSON.stringify({low, high, coordinates}));
    await check(low, high);
    await panel.getByRole('button', {name: '恢复 1–3', exact: true}).click();
    const brush = page.locator('.disk-radius-brush');
    await brush.focus();await page.keyboard.press('ArrowRight');
    await check(1.1, 3.1);
    await page.keyboard.press('Escape');
    assert.equal(await panel.getAttribute('data-fraction'), null);
    await panel.getByRole('button', {name: '恢复 1–3', exact: true}).click();
    for (const rd of [1, 6, 3]) {
      await page.locator('#disk-profile-Rd').evaluate((n, value) => {n.value = value;n.dispatchEvent(new Event('input', {bubbles: true}));}, rd);
      await check(1, 3);
    }
    await panel.locator('#disk-range-inner').fill('2');
    await panel.locator('#disk-range-inner').press('Tab');
    await check(2, 3);
    await page.locator('#disk-profile-reset').click();
    await check(1, 3);
    // A re-render during a drag must not let a detached brush overwrite selection.
    await page.locator('#disk-profile-chart').scrollIntoViewIfNeeded();
    const point = await page.evaluate(() => {
      const n = document.getElementById('disk-profile-chart'), p = BookCharts.inspect(n), m = n.getScreenCTM();
      return {x: m.e + p.x(.5), y: m.f + p.box.y + p.box.h / 2};
    });
    await page.mouse.move(point.x, point.y);await page.mouse.down();
    await page.mouse.move(point.x + 30, point.y);await page.waitForTimeout(30);
    await page.evaluate(() => document.dispatchEvent(new CustomEvent('reader:pagechange')));
    await page.waitForTimeout(60);
    const frozen = await fraction();
    await page.mouse.move(point.x + 60, point.y);await page.mouse.up();
    await page.waitForTimeout(40);
    assert.equal(await fraction(), frozen, 'detached brush input is ignored after redraw');
    await panel.getByRole('button', {name: '恢复 1–3', exact: true}).click();
    const layouts = [];
    for (const width of [1300, 390, 320]) for (const theme of ['afterglow', 'moon']) {
      await page.setViewportSize({width, height: 1100});
      await page.evaluate(theme => BookTheme.set(theme), theme);
      await page.waitForTimeout(220);
      await check(1, 3);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      const file = path.join(out, `${width}-${theme}.png`);
      await page.locator('#disk-profile-lab').screenshot({path: file});
      layouts.push({width, theme, file});
    }
    assert.deepEqual(errors, []);
    const touch = await browser.newPage({viewport: {width: 390, height: 900}, hasTouch: true});
    await touch.goto('http://127.0.0.1:8765/chapter-11.html#disk-profile-lab');
    await touch.getByRole('button', {name: '内圈 0–1', exact: true}).tap();
    assert(Math.abs(+(await touch.locator('.disk-range-tools').getAttribute('data-fraction')) - integral(0, 1)) < 1e-8);
    await touch.close();
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({cases, layouts, errors}, null, 2));
    console.log(`PASS: ${cases.length} linked states, pointer/keyboard/input/reset, 6 layouts; ${out}`);
  } finally {await browser.close();}
})().catch(error => {console.error(error);process.exitCode = 1;});
