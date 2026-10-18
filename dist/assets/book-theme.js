// Run before styles and deferred experiments to restore the saved appearance.
(() => {
  'use strict';
  const root = document.documentElement;
  const key = 'galaxies-book-theme';
  const names = { afterglow: '宇宙余辉', moon: '月白星图' };
  let current = 'afterglow';
  let button;
  let cache = new Map();
  try { const saved = localStorage.getItem(key); if (names[saved]) current = saved; } catch {}
  function sync() {
    root.dataset.bookTheme = current;
    root.style.colorScheme = current === 'moon' ? 'light' : 'dark';
    cache.clear();
    document.querySelectorAll('.iso').forEach(el => { el.dataset.theme = current === 'moon' ? 'light' : 'dark'; });
    if (button) {
      const next = current === 'moon' ? 'afterglow' : 'moon';
      button.setAttribute('aria-pressed', String(current === 'moon'));
      button.setAttribute('aria-label', `当前${names[current]}，切换到${names[next]}`);
      button.title = `切换到${names[next]}`;
      button.querySelector('.theme-symbol').textContent = current === 'moon' ? '☾' : '☀';
      button.querySelector('.theme-name').textContent = names[current];
    }
  }
  function apply(theme, remember) {
    if (!names[theme]) return;
    current = theme;
    sync();
    if (remember) { try { localStorage.setItem(key, current); } catch {} }
    window.dispatchEvent(new CustomEvent('bookthemechange', { detail: { theme: current } }));
    // Existing renderers redraw without changing their numerical state.
    window.dispatchEvent(new Event('resize'));
  }
  function color(hex) {
    if (typeof hex !== 'string' || !/^#[\da-f]{3,8}$/i.test(hex)) return hex;
    if (!cache.has(hex)) cache.set(hex, getComputedStyle(root).getPropertyValue('--legacy-' + hex.slice(1).toLowerCase()).trim() || hex);
    return cache.get(hex);
  }
  // Palettes are read at draw time, including previously initialized renderers.
  function palette(values) {
    return new Proxy(values, { get(target, property, receiver) { return color(Reflect.get(target, property, receiver)); } });
  }
  window.BookTheme = { color, palette, set: theme => apply(theme, true), get current() { return current; } };
  sync();
  document.addEventListener('DOMContentLoaded', () => {
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'book-theme-toggle';
    const icon = document.createElement('span'); icon.className = 'theme-symbol'; icon.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span'); label.className = 'theme-name';
    button.append(icon, label);
    button.addEventListener('click', () => apply(current === 'moon' ? 'afterglow' : 'moon', true));
    document.querySelector('.bookbar nav')?.append(button);
    sync();
    // The resolution instrument is inserted asynchronously after the page loads.
    const stage = document.getElementById('bench-stage');
    if (stage) new MutationObserver(() => {
      stage.querySelectorAll('.iso').forEach(el => { el.dataset.theme = current === 'moon' ? 'light' : 'dark'; });
    }).observe(stage, { childList: true, subtree: true });
  }, { once: true });
  window.addEventListener('storage', event => {
    if (event.key === key) apply(names[event.newValue] ? event.newValue : 'afterglow', false);
  });
})();
