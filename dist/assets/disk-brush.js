/* interaction skill: one radial selection links the cumulative curve and disk. */
(() => {
  'use strict';
  const host = document.getElementById('disk-profile-lab');
  if (!host) return;
  const chart = document.getElementById('disk-profile-chart');
  const canvas = document.getElementById('disk-profile-scene');
  const scene = canvas.parentElement;
  let selection = [1, 3], frame, group, brush, queued = false, panel;
  const value = key => +document.getElementById('disk-profile-' + key).value;
  const fmt = n => n.toLocaleString('zh-CN', {maximumFractionDigits: 3});
  const overlay = d3.select(scene).append('svg').attr('class', 'disk-annulus-overlay')
    .attr('aria-hidden', 'true');

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {queued = false; paint();});
  }
  function move(range) {
    selection = range;
    if (group) group.call(brush.move, range?.map(frame.x) || null);
    paint();
  }
  function paint() {
    if (!panel || !frame) return;
    const result = panel.querySelector('.disk-range-result');
    overlay.selectAll('*').remove();
    if (!selection) {
      result.textContent = '尚未选择圆环。在曲线上拖选，或用下方预设开始。';
      delete panel.dataset.fraction;
      delete panel.dataset.inner;
      delete panel.dataset.outer;
      panel.querySelector('.disk-range-boundary').textContent = '';
      panel.querySelectorAll('input').forEach(n => n.value = '');
      return;
    }
    const [a, b] = selection, rd = value('Rd');
    const fraction = AdvancedPhysics.diskEnclosed(b) - AdvancedPhysics.diskEnclosed(a);
    panel.dataset.fraction = fraction;
    panel.dataset.inner = a;
    panel.dataset.outer = b;
    panel.querySelector('#disk-range-inner').value = +a.toFixed(4);
    panel.querySelector('#disk-range-outer').value = +b.toFixed(4);
    result.textContent = `所选圆环：${fmt(a * rd)}–${fmt(b * rd)} kpc；占整张无限指数盘质量的 ${fmt(fraction * 100)}%，约 ${fmt(10 ** value('mass') * fraction / 1e9)} 十亿太阳质量。`;

    // Match the legacy canvas projection exactly: horizontal radius 20 kpc = R.
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const radius = Math.min(w - 60, h - 65) / 2;
    overlay.attr('viewBox', `0 0 ${w} ${h}`).style('height', h + 'px');
    const ring = d3.arc().innerRadius(a * rd / 20 * radius)
      .outerRadius(b * rd / 20 * radius).startAngle(0).endAngle(Math.PI * 2);
    overlay.append('path').attr('d', ring()).attr('transform', `translate(${w / 2},${(h - 22) / 2}) scale(1,.5)`)
      .attr('fill', 'var(--accent)').attr('fill-opacity', .24)
      .attr('stroke', 'var(--accent)').attr('stroke-width', 1.5);
    const note = panel.querySelector('.disk-range-boundary');
    note.textContent = b * rd > 20 ? '圆环超出场景的 ±20 kpc 画幅；读数仍对完整圆环积分。' : '高亮圆环与曲线阴影表示同一半径区间；场景只作几何示意。';
  }
  function setup() {
    if (!panel) {
      panel = document.createElement('section');
      panel.className = 'disk-range-tools';
      panel.setAttribute('aria-label', '圆环质量联动实验');
      panel.innerHTML = `<h4>哪一圈，装着更多质量？</h4>
        <p>同样宽的内圈和外圈，哪一圈更重？拖选曲线上的半径区间，看圆环与质量份额一起变化。横轴是半径除以盘尺度。</p>
        <div class="disk-range-controls">
          <label for="disk-range-inner">内边界（盘尺度的倍数）<input id="disk-range-inner" type="number" min="0" step="0.1"></label>
          <label for="disk-range-outer">外边界（盘尺度的倍数）<input id="disk-range-outer" type="number" min="0" step="0.1"></label>
        </div><div class="disk-range-presets">
          <button type="button" data-range="0,1">内圈 0–1</button>
          <button type="button" data-range="1,2">中圈 1–2</button>
          <button type="button" data-range="3,4">外圈 3–4</button>
          <button type="button" data-range="1,3">恢复 1–3</button>
          <button type="button" data-clear-range>清除框选</button>
        </div><p class="disk-range-result" role="status" aria-live="polite"></p>
        <p class="disk-range-boundary"></p>
        <p>圆环质量份额 = 外边界的累计份额 − 内边界的累计份额。分母是整张盘的总质量，包含画幅外的质量。</p>
        <p>键盘：聚焦图中框选区，左右键平移，Shift 加速，Esc 清除；也可直接修改边界数值。</p>`;
      host.querySelector('.advanced-stage').after(panel);
      panel.querySelectorAll('[data-range]').forEach(button => button.onclick = () => move(button.dataset.range.split(',').map(Number)));
      panel.querySelector('[data-clear-range]').onclick = () => move(null);
      panel.querySelectorAll('input').forEach(input => input.addEventListener('change', () => {
        const a = +panel.querySelector('#disk-range-inner').value;
        const b = +panel.querySelector('#disk-range-outer').value;
        if (Number.isFinite(a) && Number.isFinite(b) && a >= 0 && b > a && b <= frame.x.domain()[1]) move([a, b]);
        else paint();
      }));
      document.getElementById('disk-profile-reset').addEventListener('click', () => move([1, 3]));
    }
    frame = BookCharts.inspect(chart);
    if (!frame || !chart.clientWidth) return;
    const max = frame.x.domain()[1], box = frame.box;
    if (selection) selection = [Math.min(selection[0], max), Math.min(selection[1], max)];
    if (selection && selection[0] === selection[1]) selection = null;
    panel.querySelectorAll('input').forEach(n => n.max = max);
    d3.select(chart).selectAll('.disk-radius-brush').remove();
    brush = d3.brushX().extent([[box.x, box.y], [box.x + box.w, box.y + box.h]])
      .on('brush.disk end.disk', function(event) {
        // A chapter resize may replace this group during an active gesture.
        if (!event.sourceEvent || !this.isConnected) return;
        selection = event.selection?.map(px => frame.x.invert(px)) || null;
        schedule();
      });
    group = d3.select(chart).append('g').attr('class', 'disk-radius-brush')
      .attr('tabindex', 0).attr('role', 'group').attr('aria-label', '半径框选：左右键平移，Shift 加速，Esc 清除')
      .call(brush).on('keydown.disk', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Escape'].includes(event.key)) return;
        event.preventDefault();event.stopPropagation();
        if (event.key === 'Escape') return move(null);
        const range = selection || [1, 3], sign = event.key === 'ArrowRight' ? 1 : -1;
        const delta = Math.max(-range[0], Math.min(max - range[1], sign * (event.shiftKey ? .5 : .1)));
        move(range.map(x => x + delta));
      });
    group.call(brush.move, selection?.map(frame.x) || null);
    paint();
  }
  document.addEventListener('lab:render', event => {if (event.detail.id === host.id) setup();});
  window.addEventListener('bookthemechange', schedule);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, {once: true});
  else setup();
})();
