#!/usr/bin/env node
// Minimal self-check for illustration legends, provenance and code-SVG sources.
// This is a source-level check only; it does not replace the browser review owned by the main agent.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'content/illustrations.json'), 'utf8'));
const errors = [];
const warnings = [];
const icons = new Set(['dot', 'line', 'dashed', 'area', 'arrow', 'ring']);
const rgb = /^#[0-9a-fA-F]{6}$/;

const images = manifest.images;
if (images.length !== 19) errors.push(`expected 19 illustrations, found ${images.length}`);
const ids = new Set();
for (const art of images) {
  const where = art.id || '(missing id)';
  if (!art.id || ids.has(art.id)) errors.push(`${where}: missing or duplicate id`);
  ids.add(art.id);
  const format = art.format || 'webp';
  if (!['webp', 'svg'].includes(format)) errors.push(`${where}: unsupported format ${format}`);
  const legend = art.legend;
  if (!legend || !Array.isArray(legend.items)) { errors.push(`${where}: missing legend.items`); continue; }
  if (legend.items.length < 3) errors.push(`${where}: legend has ${legend.items.length} items (need >= 3)`);
  if (!legend.note || legend.note.length < 10) errors.push(`${where}: legend.note too short`);
  if (!legend.read || legend.read.length < 10) errors.push(`${where}: legend.read too short`);
  if (!['ai-concept', 'code-geometry'].includes(legend.kind)) errors.push(`${where}: bad legend.kind ${legend.kind}`);
  for (const [i, item] of legend.items.entries()) {
    if (!icons.has(item.icon)) errors.push(`${where} item ${i}: bad icon ${item.icon}`);
    if (!rgb.test(item.color || '')) errors.push(`${where} item ${i}: bad color ${item.color}`);
    if (!item.label || item.label.length < 2) errors.push(`${where} item ${i}: missing label`);
    if (!item.meaning || item.meaning.length < 6) errors.push(`${where} item ${i}: missing meaning`);
  }
  if (format === 'svg') {
    if (legend.kind !== 'code-geometry') errors.push(`${where}: code SVG must use code-geometry legend`);
    if (!/原创/.test(art.provenance || '')) errors.push(`${where}: SVG provenance must say 原创几何示意`);
    if (!/SVG|代码/.test(art.generator || '')) errors.push(`${where}: SVG generator must name code drawing`);
    const file = art.files?.[0]?.path;
    if (!file || !file.endsWith('.svg')) { errors.push(`${where}: missing svg file entry`); continue; }
    const full = path.join(dist, file);
    if (!fs.existsSync(full)) { errors.push(`${where}: missing ${file}`); continue; }
    const raw = fs.readFileSync(full, 'utf8');
    if (!/^<svg[\s>]/.test(raw)) errors.push(`${where}: svg root missing`);
    if (!/viewBox="0 0 1200 800"/.test(raw)) errors.push(`${where}: unexpected svg viewBox`);
    if (/<image[\s>]|<script[\s>]|foreignObject|xlink:href/i.test(raw)) errors.push(`${where}: svg must stay self-contained vector`);
    const texts = raw.match(/<text[\s>]/g) || [];
    if (texts.length < 5) errors.push(`${where}: too few in-image labels`);
    if (texts.length > 45) warnings.push(`${where}: ${texts.length} in-image labels; consider moving detail to the legend`);
    const ai = /AI|ImageGen|概念图/.test(raw);
    if (ai) errors.push(`${where}: svg must not describe itself as AI-generated`);
  } else {
    if (legend.kind !== 'ai-concept') errors.push(`${where}: webp illustration must use ai-concept legend`);
    if (!/AI/.test(art.provenance || '')) errors.push(`${where}: AI illustration provenance must say AI`);
    for (const width of [640, 960, 1536]) {
      if (!fs.existsSync(path.join(dist, `assets/illustrations/${art.id}-${width}.webp`))) errors.push(`${where}: missing ${width} webp`);
    }
    if (!/刻度/.test(legend.note) && !/温度/.test(legend.note)) warnings.push(`${where}: AI note should explicitly deny a fixed colour scale`);
  }
}
const chapters = [...new Set(images.map(art => art.chapter))].sort((a, b) => a - b);
const expected = Array.from({ length: 16 }, (_, i) => i + 1);
if (chapters.join(',') !== expected.join(',')) errors.push(`chapter coverage ${chapters.join(',')} != 1..16`);

// Builder / runtime wiring
const builder = fs.readFileSync(path.join(root, 'scripts/build-illustrations.cjs'), 'utf8');
for (const needle of ["format === 'svg'", 'legendHtml', 'data-art-generator', 'data-art-format']) {
  if (!builder.includes(needle)) errors.push(`builder missing ${needle}`);
}
const runtime = fs.readFileSync(path.join(dist, 'assets/book-illustrations.js'), 'utf8');
for (const needle of ['artGenerator', 'illustration-legend', 'has-legend']) {
  if (!runtime.includes(needle)) errors.push(`book-illustrations.js missing ${needle}`);
}
if (/provenance\.textContent\s*=\s*`ImageGen/.test(runtime)) errors.push('runtime still hardcodes ImageGen provenance');
const css = fs.readFileSync(path.join(dist, 'assets/book-illustrations.css'), 'utf8');
for (const needle of ['.illustration-legend-list', '.illustration-legend-read', 'grid-template-columns: 1fr', '.illustration-legend .illustration-legend-note']) {
  if (!css.includes(needle)) errors.push(`book-illustrations.css missing ${needle}`);
}
const legendFontSizes = [...css.matchAll(/\.illustration-legend[^\{]*\{[^}]*font-size:\s*([\d.]+)px/g)].map(m => Number(m[1]));
if (!legendFontSizes.length || legendFontSizes.some(size => size < 12)) errors.push(`legend font sizes must all be >= 12px, found ${legendFontSizes.join(',') || 'none'}`);

const summary = {
  images: images.length,
  chapters: chapters.length,
  formats: images.reduce((acc, art) => { const f = art.format || 'webp'; acc[f] = (acc[f] || 0) + 1; return acc; }, {}),
  legendItems: images.reduce((sum, art) => sum + (art.legend?.items?.length || 0), 0),
  legendFontSizes,
  errors,
  warnings
};
console.log(JSON.stringify(summary, null, 2));
if (errors.length) process.exitCode = 1;
