'use strict';
const $ = id => document.getElementById(id);
const defaults = {item: '.product', name: 'h2', sku: '.sku', category: '.category', price: '.price', stock: '.stock'};
const fields = ['sku', 'name', 'category', 'price', 'stock'];
let result = {rows: [], rejected: [], duplicates: [], pages: [], truncated: false};
let rawHtml = '';
let busy = false;
let sourceGeneration = 0;
const money = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'});

function log(text) {
  const li = document.createElement('li'); li.textContent = text; $('logs').append(li);
}
function escapeCsv(value) {
  let text = String(value);
  if (/^[\s]*[=+\-@]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
function visibleRows() {
  const term = $('filter').value.trim().toLocaleLowerCase('es');
  return result.rows.filter(row => (!term || [row.sku, row.name, row.category].join(' ').toLocaleLowerCase('es').includes(term)) && (!$('available').checked || row.stock > 0));
}
function render() {
  const rows = visibleRows(); $('rows').replaceChildren();
  for (const row of rows) {
    const tr = document.createElement('tr');
    [row.sku, row.name, row.category || 'Sin categoría', money.format(row.price), row.stock, row.source].forEach((value, index) => {
      const td = document.createElement('td'); td.textContent = value;
      if (index === 4 && !row.stock) td.className = 'zero';
      tr.append(td);
    }); $('rows').append(tr);
  }
  if (!rows.length) {
    const tr = document.createElement('tr'), td = document.createElement('td');
    td.colSpan = 6; td.className = 'empty'; td.textContent = result.rows.length ? 'No hay registros para este filtro.' : 'Ejecuta una extracción para obtener datos.';
    tr.append(td); $('rows').append(tr);
  }
  $('count').textContent = result.rows.length;
  $('visibleCount').textContent = result.rows.length ? `${rows.length} de ${result.rows.length}` : '';
  $('csv').disabled = $('json').disabled = !rows.length;
  $('filter').disabled = $('available').disabled = !result.rows.length;
  const issues = [...result.rejected.map(row => `${row.source} · ${row.sku || 'sin código'}: ${row.reason}`),
                  ...result.duplicates.map(row => `${row.source} · ${row.sku}: duplicado, se conserva la primera aparición.`)];
  $('issues').hidden = !issues.length;
  $('issuesSummary').textContent = `${issues.length} registros excluidos · revisar detalles`;
  $('issueList').replaceChildren(); issues.forEach(text => {const li = document.createElement('li'); li.textContent = text; $('issueList').append(li);});
}
function parsePrice(text) {
  const clean = text.replace(/[^\d.,-]/g, '').replaceAll(',', '');
  if (!/^\d+(?:\.\d{1,2})?$/.test(clean)) throw new Error('precio ausente o inválido');
  return Number(clean);
}
function parseDocument(html, source, schema) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const cards = [...doc.querySelectorAll(schema.item)];
  if (!cards.length) throw new Error(`Ningún registro coincide con "${schema.item}". Revisa el contenedor.`);
  const rows = [], rejected = [];
  cards.forEach((card, index) => {
    const row = {};
    fields.forEach(field => row[field] = card.querySelector(schema[field])?.textContent.trim().replace(/\s+/g, ' ') || '');
    try {
      if (!row.sku || !row.name) throw new Error('falta código o nombre');
      row.price = parsePrice(row.price);
      if (!/^\d+$/.test(row.stock)) throw new Error('stock ausente o inválido');
      row.stock = Number(row.stock); row.source = source; rows.push(row);
    } catch(error) {rejected.push({sku: row.sku, record: index + 1, source, reason: error.message});}
  });
  return {rows, rejected, next: doc.querySelector('a[rel="next"]')?.getAttribute('href')};
}
async function getHtml(path) {
  const response = await fetch(path, {cache: 'no-store', signal: AbortSignal.timeout(10000)});
  if (!response.ok) throw new Error(`La fuente respondió HTTP ${response.status}.`);
  const html = await response.text();
  if (html.length > 2_000_000) throw new Error('El documento supera 2 MB.');
  return html;
}
function showSource(view) {
  const paste = $('sourceMode').value === 'paste';
  $('sourceFrame').hidden = paste || view === 'html';
  $('sourceHtml').hidden = !paste && view !== 'html';
  $('visual').setAttribute('aria-pressed', String(!paste && view === 'visual'));
  $('html').setAttribute('aria-pressed', String(paste || view === 'html'));
  $('sourceHtml').textContent = paste ? $('customHtml').value || 'Pega un documento HTML en la configuración.' : rawHtml;
}
async function run() {
  if (busy) return;
  busy = true; $('run').disabled = true; $('run').textContent = 'Extrayendo…';
  document.querySelectorAll('.config input,.config select,.config textarea,.config .quiet').forEach(node => node.disabled = true);
  $('logs').replaceChildren();
  result = {rows: [], rejected: [], duplicates: [], pages: [], truncated: false};
  $('filter').value = ''; $('available').checked = false; render();
  try {
    const schema = Object.fromEntries(Object.keys(defaults).map(key => [key, $(key).value.trim()]));
    const empty = new DOMParser().parseFromString('<main></main>', 'text/html');
    for (const [key, value] of Object.entries(schema)) {
      if (!value) throw new Error(`El selector de ${key} está vacío.`);
      try {empty.querySelector(value);} catch {throw new Error(`Selector inválido en ${key}: ${value}`);}
    }
    const paste = $('sourceMode').value === 'paste';
    const nextResult = {rows: [], rejected: [], duplicates: [], pages: [], truncated: false};
    const seen = new Set(), visited = new Set();
    let url = new URL('fixtures/catalog-1.html', location.href);
    const limit = paste ? 1 : Number($('pages').value);
    for (let page = 1; page <= limit && url; page++) {
      if (visited.has(url.href)) break;
      visited.add(url.href);
      const source = paste ? 'HTML pegado' : `catalog-${page}.html`;
      log(`Leyendo ${source}`);
      const html = paste ? $('customHtml').value : await getHtml(url.href);
      if (!html.trim()) throw new Error('Pega el HTML antes de extraer.');
      if (html.length > 2_000_000) throw new Error('El documento supera 2 MB.');
      rawHtml = html; $('sourcePath').textContent = paste ? source : `fixtures/${source}`;
      if (!paste) $('sourceFrame').src = url.href;
      $('sourceHtml').textContent = html;
      const batch = parseDocument(html, source, schema);
      nextResult.pages.push(source); nextResult.rejected.push(...batch.rejected);
      batch.rows.forEach(row => {
        if (seen.has(row.sku)) nextResult.duplicates.push({sku: row.sku, source});
        else {seen.add(row.sku); nextResult.rows.push(row);}
      });
      log(`${batch.rows.length} válidos · ${batch.rejected.length} incompletos`);
      if (!paste && batch.next) {
        const next = new URL(batch.next, url.href);
        const base = new URL('fixtures/', location.href);
        if (next.origin !== base.origin || !next.pathname.startsWith(base.pathname)) throw new Error('La paginación salió de la carpeta de fuentes.');
        url = next;
      } else url = null;
    }
    nextResult.truncated = Boolean(url && !visited.has(url.href));
    result = nextResult;
    const parts = [`${result.pages.length} páginas leídas`, `${result.duplicates.length} duplicados`, `${result.rejected.length} incompletos`];
    if (result.truncated) parts.push('límite de páginas alcanzado');
    $('summary').textContent = parts.join(' · ');
    log(`Finalizado: ${result.rows.length} registros únicos`);
    render();
  } catch(error) {
    $('summary').textContent = `No se completó la extracción: ${error.message}`;
    log(`Error: ${error.message}`);
  } finally {
    busy = false; $('run').disabled = false;
    $('run').innerHTML = '<span aria-hidden="true">▷</span> Extraer datos';
    document.querySelectorAll('.config input,.config select,.config textarea,.config .quiet').forEach(node => node.disabled = false);
    $('pages').disabled = $('sourceMode').value === 'paste';
  }
}
function download(kind) {
  const rows = visibleRows(); if (!rows.length) return;
  const columns = [...fields, 'source'];
  const text = kind === 'csv' ? '\uFEFF' + [columns.join(','), ...rows.map(row => columns.map(field => escapeCsv(row[field])).join(','))].join('\r\n') : JSON.stringify({...result, rows, export: {scope: 'visible filtered rows', totalRows: result.rows.length}}, null, 2);
  const blob = new Blob([text], {type: kind === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8'});
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = `extracta-catalogo.${kind}`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  log(`Exportado ${kind.toUpperCase()}: ${rows.length} registros visibles`);
}
$('run').addEventListener('click', run);
$('filter').addEventListener('input', render); $('available').addEventListener('change', render);
$('csv').addEventListener('click', () => download('csv')); $('json').addEventListener('click', () => download('json'));
$('reset').addEventListener('click', () => Object.entries(defaults).forEach(([key, value]) => $(key).value = value));
$('visual').addEventListener('click', () => showSource('visual')); $('html').addEventListener('click', () => showSource('html'));
$('customHtml').addEventListener('input', () => showSource('html'));
$('sourceMode').addEventListener('change', async () => {
  const paste = $('sourceMode').value === 'paste';
  $('pasteBox').hidden = !paste; $('pages').disabled = paste; $('visual').disabled = paste;
  $('sourcePath').textContent = paste ? 'HTML pegado · no ejecuta scripts' : 'fixtures/catalog-1.html';
  $('sourceNote').textContent = paste ? 'Documento analizado en tu navegador' : 'Fuente inspeccionable · sin API ni créditos';
  if (!paste) {const generation = ++sourceGeneration; $('sourceFrame').src = 'fixtures/catalog-1.html'; try {const html = await getHtml('fixtures/catalog-1.html'); if (generation === sourceGeneration) rawHtml = html;} catch(error) {$('summary').textContent = error.message;}}
  showSource(paste ? 'html' : 'visual');
});
$('sourceFrame').addEventListener('load', () => {
  try {
    const frame = $('sourceFrame').contentDocument;
    if (!frame || $('sourceMode').value === 'paste') return;
    rawHtml = '<!DOCTYPE html>\n' + frame.documentElement.outerHTML;
    $('sourceHtml').textContent = rawHtml;
    $('sourcePath').textContent = 'fixtures/' + new URL(frame.URL).pathname.split('/').pop();
  } catch { /* Sandboxed source is not accessible if browser policy changes. */ }
});
if (matchMedia('(max-width:760px)').matches) document.querySelector('.config details').open = false;
if (location.protocol === 'file:') $('summary').textContent = 'Inicia un servidor: python -m http.server 5083 y abre http://localhost:5083.';
