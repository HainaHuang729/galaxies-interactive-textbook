const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {chromium} = require('playwright');

(async () => {
  const browser = await chromium.launch({channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL || 'msedge'});
  try {
    const page = await browser.newPage({viewport: {width: 1300, height: 1000}});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const base = process.env.BOOK_PREVIEW_URL || 'http://127.0.0.1:8765';
    for (const [chapter, target] of [[11, 'disk-profile-lab'], [16, 'transfer-bench-lab'], [1, 'clocks-experiment-2']]) {
      await page.goto(`${base}/${chapter === 1 ? 'index' : 'chapter-' + chapter}.html#${target}`);
      const slide = page.locator('.reader-slide.is-active');
      await page.getByRole('button', {name: '打开参数扫描与读数对照', exact: true}).click();
      const panel = page.locator('#lab-tools-panel');
      const controls = slide.locator('input[type=range]');
      const original = await controls.evaluateAll(nodes => nodes.map(n => n.value));
      const readings = () => panel.locator('.lab-comparison-table tbody tr td:nth-child(3)').allTextContents();
      await panel.getByRole('button', {name: '记录当前读数', exact: true}).click();
      const before = await readings();
      assert(before.length > 0);
      await controls.evaluateAll(nodes => nodes.forEach(n => {
        n.value = n.value === n.max ? n.min : n.max;
        n.dispatchEvent(new Event('input', {bubbles: true}));
      }));
      await page.waitForTimeout(80);
      assert.notDeepEqual(await readings(), before);
      const downloaded = page.waitForEvent('download');
      await panel.getByRole('button', {name: '导出对照 CSV', exact: true}).click();
      const file = await downloaded;
      const csv = await fs.readFile(await file.path(), 'utf8');
      assert(csv.startsWith('\ufeff'));
      assert(csv.includes('"参数","记录","当前"'));
      assert(csv.includes('"读数","记录","当前","差值"'));
      for (const value of before) assert(csv.includes(value.replaceAll('"', '""')));
      await panel.getByRole('button', {name: '扫描所选参数', exact: true}).click();
      await panel.getByRole('button', {name: '恢复记录参数', exact: true}).click();
      assert.equal(await panel.getByRole('button', {name: '扫描所选参数', exact: true}).getAttribute('aria-pressed'), 'false');
      assert.deepEqual(await controls.evaluateAll(nodes => nodes.map(n => n.value)), original);
      await page.waitForTimeout(100);
      assert.deepEqual(await readings(), before);
      const selected = await panel.getByRole('combobox', {name: '选择扫描参数', exact: true}).inputValue();
      await panel.getByRole('slider', {name: '调整所选参数', exact: true}).evaluate(n => {
        n.value = n.value === n.max ? n.min : n.max;n.dispatchEvent(new Event('input', {bubbles: true}));
      });
      assert.equal(await page.locator('#' + selected).inputValue(), await panel.getByRole('slider', {name: '调整所选参数', exact: true}).inputValue());
      await panel.getByRole('button', {name: '恢复记录参数', exact: true}).click();
      await panel.getByRole('button', {name: '关闭实验工具', exact: true}).click();
      assert.equal(await panel.isVisible(), false);
      assert.equal(await page.evaluate(() => document.activeElement.className), 'lab-tools-launcher');
      await page.getByRole('button', {name: '打开参数扫描与读数对照', exact: true}).click();
      assert.deepEqual(await readings(), before, 'closing does not discard recorded readings');
      await page.keyboard.press('Escape');assert.equal(await panel.isVisible(), false);
      await page.getByRole('button', {name: '打开参数扫描与读数对照', exact: true}).click();
      for (const width of [1300, 390]) {
        await page.setViewportSize({width, height: 1000});
        for (const theme of ['afterglow', 'moon']) {
          await page.evaluate(theme => BookTheme.set(theme), theme);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
        }
      }
      await panel.screenshot({path: path.join(os.tmpdir(), `galaxies-workbench-${chapter}.png`)});
      await panel.getByRole('button', {name: '清除记录', exact: true}).click();
      assert.equal(await panel.locator('.lab-comparison-table').count(), 0);
      assert.equal(await panel.getByRole('button', {name: '恢复记录参数', exact: true}).count(), 0);
      await page.evaluate(() => {location.hash = 'opening';});
      await page.waitForTimeout(100);
      assert.equal(await panel.isVisible(), false);
      assert.equal(await page.locator('.lab-tools-launcher').isVisible(), false);
    }
    await page.setViewportSize({width: 1300, height: 1000});
    await page.goto(`${base}/chapter-4.html#growth-lab`);
    await page.selectOption('#growth-normalization', 'early');
    await page.getByRole('button', {name: '打开参数扫描与读数对照', exact: true}).click();
    let panel = page.locator('#lab-tools-panel');
    await panel.getByRole('button', {name: '记录当前读数', exact: true}).click();
    await page.selectOption('#growth-normalization', 'today');
    assert((await panel.innerText()).includes('显示方式已改变'));
    assert((await panel.locator('tbody td:nth-child(4)').allTextContents()).every(v => v === '—'));
    let downloaded = page.waitForEvent('download');
    await panel.getByRole('button', {name: '导出对照 CSV', exact: true}).click();
    const modeCSV = await fs.readFile(await (await downloaded).path(), 'utf8');
    assert(modeCSV.includes('"early","today"'), 'CSV records both display modes');
    await panel.getByRole('button', {name: '恢复记录参数', exact: true}).click();
    assert.equal(await page.locator('#growth-normalization').inputValue(), 'early');
    assert(!(await panel.innerText()).includes('显示方式已改变'));
    await page.goto(`${base}/chapter-4.html#transfer-lab`);
    await page.selectOption('#transfer-kind', 'T');
    await page.getByRole('button', {name: '打开参数扫描与读数对照', exact: true}).click();
    panel = page.locator('#lab-tools-panel');
    await panel.getByRole('combobox', {name: '选择扫描参数', exact: true}).selectOption('spectral-n');
    assert(await page.locator('#spectral-n').isDisabled());
    assert(await panel.getByRole('button', {name: '扫描所选参数', exact: true}).isDisabled());
    assert(await panel.getByRole('slider', {name: '调整所选参数', exact: true}).isDisabled());
    await page.selectOption('#transfer-kind', 'power');
    assert(await panel.getByRole('button', {name: '扫描所选参数', exact: true}).isEnabled());
    assert(await panel.getByRole('slider', {name: '调整所选参数', exact: true}).isEnabled());
    assert.deepEqual(errors, []);
    console.log('PASS: four chapters, snapshot modes/CSV/restore, disabled parameters, clock readouts, scan interruption, desktop/mobile and both themes');
  } finally {
    await browser.close();
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
