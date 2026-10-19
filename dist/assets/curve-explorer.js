/* interaction: opt-in brushX, stable domains, current scales and one paint/frame. */
(() => {
  'use strict';
  const states = new WeakMap();
  const make = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const number = n => Number(n).toLocaleString('zh-CN', {maximumSignificantDigits: 6});
  function update(node) {
    const info = BookCharts.inspect(node);
    if (!node.closest('.reader-slide') || node.id === 'disk-profile-chart' || !info?.series.some(s => s.data.length > 1)) return;
    const unit = node.closest('.scientific-chart-unit');
    if (!unit) return;
    let state = states.get(node);
    if (!state) {
      const button = make('button', 'scientific-chart-action', '区间取样');
      button.type = 'button';button.setAttribute('aria-expanded', 'false');
      const panel = make('div', 'curve-explorer');panel.hidden = true;
      panel.id = 'explore-' + node.id;button.setAttribute('aria-controls', panel.id);
      const intro = make('p', '', '拖选横轴区间，比较实际绘制节点的纵轴读数。选区不改变原模型和坐标轴；下列统计不是积分、概率或观测误差。统计对象是当前参数的登记曲线，灰色固定参照供目视比较。');
      const units = make('p', 'curve-explorer-units');
      const controls = make('div', 'curve-explorer-controls');
      const selectLabel = make('label', '', '取样曲线'), select = make('select');
      select.setAttribute('aria-label', '取样曲线');selectLabel.append(select);controls.append(selectLabel);
      const inputs = ['区间下界', '区间上界'].map(title => {
        const label = make('label', '', title), input = make('input');
        input.type = 'number';input.step = 'any';input.setAttribute('aria-label', title);label.append(input);controls.append(label);return input;
      });
      const actions = make('div', 'curve-explorer-actions');
      const whole = make('button', '', '选择全域'), clear = make('button', '', '清除选区');
      whole.type = clear.type = 'button';actions.append(whole, clear);
      const result = make('p', 'curve-explorer-result');result.setAttribute('role', 'status');result.setAttribute('aria-live', 'polite');
      const table = make('table', 'curve-explorer-table');
      const note = make('p', '', '上下界沿用横轴单位，读数沿用纵轴单位。最小、最大只针对已绘制节点，可能遗漏节点之间的真正极值。键盘聚焦选区后左右平移，Shift 加速，Esc 清除；手机可直接输入边界。');
      panel.append(intro, units, controls, actions, result, table, note);unit.append(panel);
      unit.querySelector('.scientific-chart-tools').append(button);
      state = {node, panel, button, select, inputs, result, table, units, on: false, range: null, choice: '', queued: false};
      states.set(node, state);
      button.onclick = () => {state.on = !state.on;panel.hidden = !state.on;button.setAttribute('aria-expanded', String(state.on));update(node);};
      select.onchange = () => {state.choice = select.value;paint(state);};
      inputs.forEach(input => input.onchange = () => {
        const a = +inputs[0].value, b = +inputs[1].value, [lo, hi] = domain(node);
        if (inputs.some(n => n.value === '') || !Number.isFinite(a) || !Number.isFinite(b) || a < lo || b > hi || a >= b) {
          input.setCustomValidity('请输入轴域内递增的上下界。');input.reportValidity();return;
        }
        inputs.forEach(n => n.setCustomValidity(''));move(state, [a, b]);
      });
      whole.onclick = () => move(state, domain(node));
      clear.onclick = () => move(state, null);
    }
    if (!state.on) {d3.select(node).selectAll('.curve-explorer-brush,.curve-explorer-highlight').remove();return;}
    const units = `横轴：${info.xLabel}；纵轴：${info.yLabel}。`;
    if (state.units.dataset.label !== units) {state.units.textContent = units;state.units.dataset.label = units;window.BookMath?.typeset(state.units);}
    const [lo, hi] = domain(node), options = info.series.map((s, i) => ({label: s.label, key: s.label + '\u0000' + i}));
    state.select.replaceChildren(...options.map(item => new Option(item.label, item.key)));
    if (!options.some(item => item.key === state.choice)) state.choice = options[0]?.key;
    state.select.value = state.choice;
    state.inputs.forEach(input => {input.min = lo;input.max = hi;});
    if (state.range) {
      state.range = [Math.max(lo, state.range[0]), Math.min(hi, state.range[1])];
      if (state.range[0] >= state.range[1]) state.range = null;
    }
    if (!state.started) {state.range = [info.x.invert(info.box.x + info.box.w * .25), info.x.invert(info.box.x + info.box.w * .75)].sort((a, b) => a - b);state.started = true;}
    const {box} = info;
    const geometry = JSON.stringify([box, info.x.domain()]);
    // Readout wrapping can redraw a chart during a drag without changing axes.
    // Reattach the same group so D3's active gesture keeps its live target.
    if (state.dragging && state.geometry === geometry && state.group) {
      if (!state.group.node().isConnected) node.append(state.group.node());
      paint(state);return;
    }
    state.dragging = false;state.geometry = geometry;
    d3.select(node).selectAll('.curve-explorer-brush,.curve-explorer-highlight').remove();
    state.brush = d3.brushX().extent([[box.x, box.y], [box.x + box.w, box.y + box.h]])
      .on('start.explore', event => {if (event.sourceEvent) state.dragging = true;})
      .on('brush.explore end.explore', function(event) {
        if (!this.isConnected || !event.sourceEvent) return;
        if (event.type === 'end') state.dragging = false;
        const current = BookCharts.inspect(node);
        state.range = event.selection?.map(px => current.x.invert(px)).sort((a, b) => a - b) || null;
        if (!state.queued) {state.queued = true;requestAnimationFrame(() => {state.queued = false;if (state.on) paint(state);});}
      });
    state.group = d3.select(node).append('g').attr('class', 'curve-explorer-brush')
      .attr('tabindex', 0).attr('role', 'group').attr('aria-label', '区间取样选区：左右键平移，Shift 加速，Esc 清除')
      .call(state.brush).on('pointerdown.explore pointermove.explore', event => event.stopPropagation())
      .on('keydown.explore', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Escape'].includes(event.key)) return;
        event.preventDefault();event.stopPropagation();
        if (event.key === 'Escape') return move(state, null);
        const current = BookCharts.inspect(node), r = state.range || domain(node);
        const pixels = r.map(current.x), sign = event.key === 'ArrowRight' ? 1 : -1;
        const delta = Math.max(current.box.x - pixels[0], Math.min(current.box.x + current.box.w - pixels[1], sign * (event.shiftKey ? 20 : 4)));
        move(state, pixels.map(px => current.x.invert(px + delta)).sort((a, b) => a - b));
      });
    state.group.call(state.brush.move, state.range?.map(info.x).sort((a, b) => a - b) || null);
    paint(state);
  }
  function domain(node) {return BookCharts.inspect(node).x.domain().slice().sort((a, b) => a - b);}
  function move(state, range) {
    state.range = range;
    const info = BookCharts.inspect(state.node);
    if (state.group?.node().isConnected) state.group.call(state.brush.move, range?.map(info.x).sort((a, b) => a - b) || null);
    paint(state);
  }
  function paint(state) {
    const {node, panel, range, inputs, table, result} = state, info = BookCharts.inspect(node);
    d3.select(node).selectAll('.curve-explorer-highlight').remove();
    table.replaceChildren();
    if (!range) {
      result.textContent = '尚未选择区间。可重新拖选、输入上下界或选择全域。';
      delete panel.dataset.count;inputs.forEach(n => n.value = '');return;
    }
    const [a, b] = range, index = state.select.selectedIndex, series = info.series[index];
    if (!series) return;
    inputs.forEach((input, i) => {input.value = +range[i].toPrecision(12);input.setCustomValidity('');});
    const points = series.data.filter(p => p.x >= a && p.x <= b && Number.isFinite(info.x(p.x)) && Number.isFinite(info.y(p.y)));
    Object.assign(panel.dataset, {lower: a, upper: b, count: points.length, series: index});
    result.textContent = `区间 ${number(a)}–${number(b)}：${series.label}，共 ${points.length} 个已绘制节点。`;
    if (!points.length) return;
    const ys = points.map(p => p.y), rows = [['取样指标', '纵轴读数'], ['区间内首节点', number(points[0].y)], ['区间内末节点', number(points.at(-1).y)], ['取样最小值', number(Math.min(...ys))], ['取样最大值', number(Math.max(...ys))]];
    for (const [label, text] of rows) {const row = make('tr');row.append(make('th', '', label), make('td', '', text));table.append(row);}
    const marks = d3.select(node).insert('g', '.curve-explorer-brush').attr('class', 'curve-explorer-highlight')
      .attr('clip-path', `url(#${info.clip})`).attr('pointer-events', 'none');
    // Show existing nodes only; connecting selected points would invent segments.
    marks.selectAll('circle').data(points).join('circle').attr('cx', p => info.x(p.x)).attr('cy', p => info.y(p.y))
      .attr('r', 2.2).attr('fill', 'var(--accent)').attr('fill-opacity', .75);
  }
  window.BookCurveExplorer = {update};
  const start = () => document.querySelectorAll('svg.chart').forEach(update);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true});else start();
})();
