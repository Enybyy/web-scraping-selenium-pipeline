'use strict';
const $ = id => document.getElementById(id);
const profiles = {
  menu: {source: 'fixtures/menu.html', currency: 'PEN', selectors: {item: '.menu-item', sku: '.sku', name: '.name', record_type: '.record-type', category: '.category', price: '.price', description: '.description'}},
  fixture: {source: 'fixtures/catalog-1.html', currency: 'USD', selectors: {item: '.product', sku: '.sku', name: 'h2', category: '.category', price: '.price', stock: '.stock'}}
};
const labels = {item: 'Contenedor de entrada', sku: 'Referencia', name: 'Nombre', record_type: 'Tipo de entrada', category: 'Categoría', price: 'Precio', description: 'Descripción', stock: 'Stock', source: 'Documento fuente', item_count: 'Entradas', min_price: 'Precio mínimo', max_price: 'Precio máximo'};
let profile = profiles.menu;
let result = {rows: [], rejected: [], duplicates: [], pages: [], truncated: false};
let rawHtml = '', busy = false, sourceGeneration = 0;
const isMenu = () => profile === profiles.menu;
const money = value => new Intl.NumberFormat(isMenu() ? 'es-PE' : 'en-US', {style:'currency', currency:profile.currency}).format(value);
const dataFields = () => Object.keys(profile.selectors).filter(key => key !== 'item');
function log(text) { const li = document.createElement('li'); li.textContent = text; $('logs').append(li); }
function escapeCsv(value) {
  let text = String(value ?? '');
  if (/^[\s]*[=+\-@]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"','""') + '"';
}
function scopedRows() {
  const term = $('filter').value.trim().toLocaleLowerCase('es');
  return result.rows.filter(row => {
    if (isMenu() && $('scope').value === 'items' && row.record_type === 'Tarifa buffet') return false;
    if (isMenu() && $('scope').value === 'rates' && row.record_type !== 'Tarifa buffet') return false;
    return (!term || [row.sku,row.name,row.category,row.description,row.record_type].join(' ').toLocaleLowerCase('es').includes(term)) && (!$('available').checked || row.stock > 0);
  });
}
function outputRows() {
  let rows = scopedRows();
  if ($('goal').value === 'categories') {
    const groups = new Map();
    for (const row of rows) {
      const category = row.category || 'Sin categoría';
      if (!groups.has(category)) groups.set(category,{category, item_count:0, min_price:row.price, max_price:row.price, source:[]});
      const group = groups.get(category); group.item_count++;
      group.min_price = Math.min(group.min_price,row.price); group.max_price = Math.max(group.max_price,row.price);
      if (!group.source.includes(row.source)) group.source.push(row.source);
    }
    rows = [...groups.values()].map(group => ({...group,source:group.source.join(' · ')}));
  } else rows = [...rows];
  const priority = $('priority').value;
  if (priority === 'price') rows.sort((a,b) => (a.price ?? a.min_price) - (b.price ?? b.min_price));
  if (priority === 'name' || priority === 'category') rows.sort((a,b) => String(a[priority] ?? a.category).localeCompare(String(b[priority] ?? b.category),'es'));
  return rows;
}
function selectedFields() {return [...$('fieldChoices').querySelectorAll('input:checked')].map(input => input.value);}
function setupFields() {
  const goal = $('goal').value;
  const fields = goal === 'categories' ? ['category','item_count','min_price','max_price','source'] : [...dataFields(),'source'];
  const checked = goal === 'prices' ? ['name','record_type','category','price'] : fields;
  $('fieldChoices').replaceChildren();
  for (const field of fields) {
    const label = document.createElement('label'), input = document.createElement('input');
    input.type = 'checkbox'; input.value = field; input.checked = checked.includes(field);
    input.addEventListener('change',render); label.append(input,document.createTextNode(field === 'sku' && isMenu() ? 'Referencia local' : labels[field])); $('fieldChoices').append(label);
  }
}
function setupSelectors() {
  $('selectors').replaceChildren();
  for (const [key,value] of Object.entries(profile.selectors)) {
    const row = document.createElement('div'); row.className = 'selector-row';
    const label = document.createElement('label'); label.htmlFor = key; label.textContent = labels[key];
    const input = document.createElement('input'); input.id = key; input.value = value; input.spellcheck = false;
    row.append(label,input); $('selectors').append(row);
  }
}
function render() {
  const rows = outputRows(), columns = selectedFields();
  $('rows').replaceChildren(); $('tableHead').replaceChildren();
  const head = document.createElement('tr');
  for (const field of columns) {
    const th = document.createElement('th'); th.scope = 'col'; th.dataset.field = field;
    th.textContent = field === 'sku' && isMenu() ? 'Referencia local' : ['price','min_price','max_price'].includes(field) ? `${labels[field]} (${profile.currency === 'PEN' ? 'S/' : 'USD'})` : labels[field];
    head.append(th);
  }
  $('tableHead').append(head);
  if (columns.length) for (const row of rows) {
    const tr = document.createElement('tr'); if (row.record_type === 'Tarifa buffet') tr.className = 'tariff-row';
    for (const field of columns) {
      const td = document.createElement('td'); td.dataset.field = field;
      const value = row[field];
      td.textContent = ['price','min_price','max_price'].includes(field) ? money(value) : value === '' || value == null ? '—' : String(value);
      if (field === 'stock' && value === 0) td.className = 'zero';
      if (field === 'record_type') {const badge = document.createElement('span'); badge.className = 'type-badge'; badge.textContent = value; td.replaceChildren(badge);}
      tr.append(td);
    }
    $('rows').append(tr);
  }
  if (!rows.length || !columns.length) {
    const tr = document.createElement('tr'), td = document.createElement('td'); td.colSpan = columns.length || 1; td.className = 'empty';
    td.textContent = !columns.length ? 'Selecciona al menos una columna de salida.' : result.rows.length ? 'No hay entradas para esta selección.' : 'Ejecuta una extracción para obtener datos.';
    tr.append(td); $('rows').append(tr);
  }
  $('count').textContent = rows.length;
  $('visibleCount').textContent = result.rows.length ? `${rows.length} ${$('goal').value === 'categories' ? 'categorías' : 'entradas'} · ${scopedRows().length} registros seleccionados` : '';
  $('csv').disabled = $('json').disabled = !rows.length || !columns.length;
  $('filter').disabled = $('available').disabled = !result.rows.length;
  $('tableNote').textContent = isMenu() ? 'Referencias CARTA locales. Tarifas, adicionales y bebidas identificados por separado. Precios de la copia guardada, en soles.' : 'Referencias publicadas por el catálogo de prueba. Precios en USD y stock en unidades; los datos de Atelier son sintéticos.';
  const issues = [...result.rejected.map(row => `${row.source} · ${row.sku || 'sin referencia'}: ${row.reason}`),...result.duplicates.map(row => `${row.source} · ${row.sku}: duplicado; se conserva la primera aparición.`)];
  $('issues').hidden = !issues.length; $('issuesSummary').textContent = `${issues.length} entradas excluidas · revisar detalles`;
  $('issueList').replaceChildren(); for (const text of issues) {const li = document.createElement('li'); li.textContent = text; $('issueList').append(li);}
}
function parsePrice(text) {
  const clean = text.replace(/[^\d.,-]/g,'').replaceAll(',','');
  if (!/^\d+(?:\.\d{1,2})?$/.test(clean)) throw new Error('precio ausente o inválido');
  return Number(clean);
}
function parseDocument(html, source, schema) {
  const doc = new DOMParser().parseFromString(html,'text/html');
  const cards = [...doc.querySelectorAll(schema.item)];
  if (!cards.length) throw new Error(`Ningún registro coincide con "${schema.item}". Revisa el contenedor.`);
  const rows = [], rejected = [];
  cards.forEach((card,index) => {
    const row = {};
    for (const field of dataFields()) row[field] = card.querySelector(schema[field])?.textContent.trim().replace(/\s+/g,' ') || '';
    try {
      if (!row.sku || !row.name) throw new Error('falta referencia o nombre');
      row.price = parsePrice(row.price);
      if (isMenu()) {
        if (!['Tarifa buffet','Adicional','Bebida'].includes(row.record_type)) throw new Error('tipo de entrada ausente o inválido: clasifica la tarifa, adicional o bebida');
      } else {
        if (!/^\d+$/.test(row.stock)) throw new Error('stock ausente o inválido');
        row.stock = Number(row.stock);
      }
      row.source = source; rows.push(row);
    } catch(error) {rejected.push({sku:row.sku,record:index+1,source,reason:error.message});}
  });
  return {rows,rejected,next:doc.querySelector('a[rel="next"]')?.getAttribute('href')};
}
async function getHtml(path) {
  const response = await fetch(path,{cache:'no-store',signal:AbortSignal.timeout(10000)});
  if (!response.ok) throw new Error(`La fuente respondió HTTP ${response.status}.`);
  const html = await response.text(); if (html.length > 2_000_000) throw new Error('El documento supera 2 MB.'); return html;
}
function renderHtml(source) {
  const doc = new DOMParser().parseFromString(source, 'text/html');
  const lines = ['<!DOCTYPE html>'];
  const voidTags = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  function walk(node, depth) {
    const pad = '  '.repeat(depth);
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim().replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); if (text) lines.push(pad + text); return;
    }
    if (node.nodeType === Node.COMMENT_NODE) {lines.push(pad + '<!--' + node.textContent + '-->'); return;}
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const tag = node.localName;
    const attrs = [...node.attributes].map(a => ` ${a.name}="${a.value.replaceAll('&','&amp;').replaceAll('"','&quot;')}"`).join('');
    lines.push(pad + '<' + tag + attrs + '>');
    if (voidTags.has(tag)) return;
    if (['pre','script','style','textarea'].includes(tag)) lines.push(node.textContent);
    else node.childNodes.forEach(child => walk(child, depth + 1));
    lines.push(pad + '</' + tag + '>');
  }
  walk(doc.documentElement, 0);
  $('sourceHtml').replaceChildren();
  const formatted = lines.join('\n');
  for (const token of formatted.split(/(<!--[\s\S]*?-->|<[^>]+>)/g)) {
    const span = document.createElement('span'); span.textContent = token;
    if (token.startsWith('<')) span.className = token.startsWith('<!--') ? 'code-comment' : 'code-tag';
    $('sourceHtml').append(span);
  }
}


function showSource(view) {
  const paste = $('sourceMode').value === 'paste';
  $('sourceFrame').hidden = paste || view === 'html'; $('sourceHtml').hidden = !paste && view !== 'html';
  $('visual').setAttribute('aria-pressed',String(!paste && view === 'visual')); $('html').setAttribute('aria-pressed',String(paste || view === 'html'));
  renderHtml(paste ? $('customHtml').value || 'Pega un documento HTML en la configuración.' : rawHtml);
}
function clearResult() {result = {rows:[],rejected:[],duplicates:[],pages:[],truncated:false}; $('filter').value = ''; $('available').checked = false; render();}
async function run() {
  if (busy) return; busy = true; $('run').disabled = true; $('run').textContent = 'Extrayendo…';
  document.querySelectorAll('.config input,.config select,.config textarea,.config .quiet').forEach(node => node.disabled = true);
  $('logs').replaceChildren(); clearResult();
  try {
    const schema = Object.fromEntries(Object.keys(profile.selectors).map(key => [key,$(key).value.trim()]));
    const empty = new DOMParser().parseFromString('<main></main>','text/html');
    for (const [key,value] of Object.entries(schema)) {
      if (!value) throw new Error(`El selector de ${labels[key]} está vacío.`);
      try {empty.querySelector(value);} catch {throw new Error(`Selector inválido en ${labels[key]}: ${value}`);}
    }
    const paste = $('sourceMode').value === 'paste';
    const nextResult = {rows:[],rejected:[],duplicates:[],pages:[],truncated:false};
    const seen = new Set(), visited = new Set(); let url = new URL(profile.source,location.href);
    const limit = paste || isMenu() ? 1 : Number($('pages').value);
    for (let page = 1; page <= limit && url; page++) {
      if (visited.has(url.href)) break; visited.add(url.href);
      const source = paste ? 'HTML pegado' : url.pathname.split('/').pop(); log(`Leyendo ${source}`);
      const html = paste ? $('customHtml').value : await getHtml(url.href);
      if (!html.trim()) throw new Error('Pega el HTML antes de extraer.'); if (html.length > 2_000_000) throw new Error('El documento supera 2 MB.');
      rawHtml = html; $('sourcePath').textContent = paste ? source : `fixtures/${source}`;
      if (!paste) $('sourceFrame').src = url.href; renderHtml(html);
      const batch = parseDocument(html,source,schema); nextResult.pages.push(source); nextResult.rejected.push(...batch.rejected);
      for (const row of batch.rows) {
        if (seen.has(row.sku)) nextResult.duplicates.push({sku:row.sku,source}); else {seen.add(row.sku); nextResult.rows.push(row);}
      }
      log(`${batch.rows.length} válidos · ${batch.rejected.length} incompletos`);
      if (!paste && batch.next) {
        const next = new URL(batch.next,url.href), base = new URL('fixtures/',location.href);
        if (next.origin !== base.origin || !next.pathname.startsWith(base.pathname)) throw new Error('La paginación salió de la carpeta de fuentes.'); url = next;
      } else url = null;
    }
    nextResult.truncated = Boolean(url && !visited.has(url.href)); result = nextResult;
    const parts = [`${result.pages.length} páginas leídas`,`${result.rows.length} entradas validadas`,`${result.duplicates.length} duplicados`,`${result.rejected.length} incompletos`];
    if (result.truncated) parts.push('límite de páginas alcanzado'); $('summary').textContent = parts.join(' · ');
    if (isMenu()) {
      const count = type => result.rows.filter(row => row.record_type === type).length;
      log(`${count('Tarifa buffet')} tarifas · ${count('Adicional')} adicionales · ${count('Bebida')} bebidas`);
    }
    log('Selección aplicada a tabla y descargas'); render();
  } catch(error) {$('summary').textContent = `No se completó la extracción: ${error.message}`; log(`Error: ${error.message}`);}
  finally {
    busy = false; $('run').disabled = false; $('run').innerHTML = '<span aria-hidden="true">▷</span> Extraer datos';
    document.querySelectorAll('.config input,.config select,.config textarea,.config .quiet').forEach(node => node.disabled = false);
    $('pages').disabled = $('sourceMode').value === 'paste' || isMenu();
  }
}
function download(kind) {
  const rows = outputRows(), columns = selectedFields(); if (!rows.length || !columns.length) return;
  const projected = rows.map(row => Object.fromEntries(columns.map(field => [field,row[field] ?? ''])));
  const selection = {scope:$('scope').value,format:$('goal').value,order:$('priority').value,fields:columns,currency:profile.currency};
  const text = kind === 'csv' ? '\uFEFF' + [columns.join(','),...rows.map(row => columns.map(field => escapeCsv(row[field])).join(','))].join('\r\n') : JSON.stringify({rows:projected,selection,pages:result.pages,rejected:result.rejected,duplicates:result.duplicates,truncated:result.truncated,validatedRecords:result.rows.length},null,2);
  const url = URL.createObjectURL(new Blob([text],{type:kind === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8'}));
  const link = document.createElement('a'); link.href = url; link.download = `enybyy-extract-${$('goal').value}.${kind}`; link.click();
  setTimeout(() => URL.revokeObjectURL(url),1000); log(`Exportado ${kind.toUpperCase()}: ${rows.length} filas · ${columns.length} columnas`);
}
$('run').addEventListener('click',run);
$('filter').addEventListener('input',render); $('available').addEventListener('change',render);
$('csv').addEventListener('click',() => download('csv')); $('json').addEventListener('click',() => download('json'));
$('reset').addEventListener('click',setupSelectors);
$('scope').addEventListener('change',render); $('priority').addEventListener('change',render);
$('goal').addEventListener('change',() => {setupFields(); render();});
$('visual').addEventListener('click',() => showSource('visual')); $('html').addEventListener('click',() => showSource('html'));
$('customHtml').addEventListener('input',() => showSource('html'));
$('sourceMode').addEventListener('change',async () => {
  const paste = $('sourceMode').value === 'paste', generation = ++sourceGeneration;
  if (!paste) {
    profile = profiles[$('sourceMode').value]; setupSelectors();
    $('scope').replaceChildren();
    const options = isMenu() ? [['items','Artículos de la carta'],['rates','Tarifas del buffet'],['all','Todo, separado por tipo']] : [['items','Productos del catálogo'],['all','Todos los productos']];
    for (const [value,text] of options) {const option = document.createElement('option'); option.value = value; option.textContent = text; $('scope').append(option);}
    $('goal').value = 'detail'; $('priority').value = 'source'; setupFields(); $('pages').value = isMenu() ? '1' : '3';
  }
  clearResult(); $('summary').textContent = 'Fuente cambiada. Ejecuta la extracción con sus selectores.';
  $('selectionNote').textContent = isMenu() ? 'Las tarifas de ingreso no se mezclan con los artículos. La selección se aplica a la tabla y a las descargas.' : 'Selecciona productos, precios o categorías. La tabla y las descargas usan las mismas columnas.';
  $('sourceHint').textContent = paste ? `Usa los selectores del último tipo de fuente elegido: ${isMenu() ? 'carta de restaurante' : 'catálogo de productos'}.` : isMenu() ? 'Carta real simplificada, sin marcas. Precios en soles; sin stock publicado.' : 'Catálogo sintético de tres páginas. Productos, precios en USD y stock de prueba.';
  $('stockFilter').hidden = isMenu(); $('pasteBox').hidden = !paste; $('pages').disabled = paste || isMenu(); $('visual').disabled = paste;
  $('sourcePath').textContent = paste ? 'HTML pegado · no ejecuta scripts' : profile.source;
  $('sourceNote').textContent = paste ? 'Documento analizado en tu navegador' : isMenu() ? 'Copia de una fuente real · marcas generalizadas' : 'Catálogo sintético de prueba';
  document.querySelector('.source-caption a').href = profile.source;
  $('sourceFrame').title = isMenu() ? 'Carta de restaurante sin marcas' : 'Catálogo sintético Atelier';
  rawHtml = '';
  if (!paste) {
    $('sourceFrame').src = profile.source;
    try {const html = await getHtml(profile.source); if (generation !== sourceGeneration) return; rawHtml = html;} catch(error) {if (generation === sourceGeneration) $('summary').textContent = error.message;}
  }
  if (generation === sourceGeneration) showSource(paste ? 'html' : 'visual');
});
$('sourceFrame').addEventListener('load',() => {
  try {
    const frame = $('sourceFrame').contentDocument; if (!frame || $('sourceMode').value === 'paste') return;
    // Keep the inspected HTML tied to the active source (including catalog pagination).
    const path = new URL(frame.URL).pathname;
    if (isMenu() && !path.endsWith('/menu.html')) return;
    if (!isMenu() && !/\/catalog-[123]\.html$/.test(path)) return;
    rawHtml = '<!DOCTYPE html>\n' + frame.documentElement.outerHTML; renderHtml(rawHtml);
    $('sourcePath').textContent = 'fixtures/' + path.split('/').pop();
  } catch { /* A different-origin frame is not inspected. */ }
});
setupSelectors(); setupFields(); render();
if (matchMedia('(max-width:760px)').matches) document.querySelector('.selector-options').open = false;
if (location.protocol === 'file:') $('summary').textContent = 'Inicia un servidor: python -m http.server 5083 y abre http://localhost:5083.';
