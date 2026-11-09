import { compileExpression } from './math/expression.js';
import { simpson_13_detallado, simpsonConvergence, simpsonErrorBound } from './math/simpson.js';
import { session13, powerRate, exactEnergy, powerFourthDerivative, originalSimpsonExercise } from './sessions/session13.js';

const $ = id => document.getElementById(id);
const fmt = (value, digits = 9) => Number.isFinite(value) ? new Intl.NumberFormat('es-PE', { minimumFractionDigits: Math.min(digits, 3), maximumFractionDigits: digits, useGrouping: false }).format(value) : '—';
const raw = value => Number(value).toPrecision(16);
const el = (tag, className = '', content = '') => { const node = document.createElement(tag); if (className) node.className = className; if (content !== '') node.textContent = content; return node; };
const append = (parent, ...children) => { parent.append(...children); return parent; };
const card = (className, title) => append(el('section', className), el('h3', '', title));
const svg = (tag, attrs = {}) => { const node = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value)); return node; };
const svgText = (parent, x, y, content, anchor = 'start') => append(parent, append(svg('text', { x, y, 'text-anchor': anchor, fill: '#667f8a', 'font-size': 11, 'font-family': 'Arial, sans-serif' }), document.createTextNode(content)));

function table(headers, rows) {
  const wrap = el('div', 'table-wrap'), tab = el('table', 'numeric-table'), head = el('thead'), hr = el('tr'), body = el('tbody');
  headers.forEach(h => append(hr, el('th', '', h)));
  rows.forEach(cells => { const tr = el('tr'); cells.forEach(c => append(tr, el('td', '', String(c)))); append(body, tr); });
  append(head, hr); append(tab, head, body); append(wrap, tab);
  return { wrap, body };
}

function resultCard(detail, exact, digits, original) {
  const box = el('section', 'result-card');
  append(box, el('span', 'card-kicker', 'Integral aproximada · Simpson 1/3'), el('strong', '', `${fmt(detail.result, digits)}${original ? ' kWh' : ''}`));
  append(box, el('p', '', `n = ${detail.n}, h = ${fmt(detail.h, digits)}. Los cálculos usan los valores sin redondeo intermedio.`));
  if (exact !== null) append(box, el('p', '', `${original ? 'Valor exacto' : 'Valor de referencia'}: ${fmt(exact, digits)}. ${original ? 'Error absoluto real' : 'Diferencia absoluta frente a la referencia'}: ${fmt(Math.abs(detail.result - exact), digits)}${original ? ' kWh' : ''}.`));
  return box;
}

function dataCard(detail, expression, digits, exact, M, original) {
  const box = card('data-card', 'Datos identificados'), list = el('div', 'data-list');
  const pairs = [['Función', expression], ['Intervalo', `[${fmt(detail.a, digits)}, ${fmt(detail.b, digits)}]`], ['n', `${detail.n} (par)`], ['h', fmt(detail.h, digits)], ['Unidad', original ? 'kW · h = kWh' : 'unidades de f × x'], [original ? 'Valor exacto' : 'Referencia', exact === null ? 'No proporcionada' : fmt(exact, digits)], ['M de |f⁽⁴⁾|', M === null ? 'No proporcionada' : fmt(M, digits)]];
  pairs.forEach(([label, value]) => append(list, append(el('div'), el('span', '', label), el('strong', '', value))));
  append(box, list); return box;
}

function stepsCard(detail, expression, digits, exact, M, original) {
  const box = card('steps-card', 'Procedimiento matemático paso a paso'), list = el('ol', 'step-list');
  const add = (title, value) => append(list, append(el('li'), el('strong', '', title), el('span', '', value)));
  const v = original || /\bt\b/i.test(expression) ? 't' : 'x';
  add('Enunciado', original ? 'Estimar la energía consumida por un centro de datos para microservicios durante 6 horas de carga crítica.' : `Estimar la integral definida de f(${v}) mediante Simpson 1/3 compuesto.`);
  add('Función e integral', `${original ? 'P(t) = 10 + 5t·sen(πt/6) + e^(0,2t)' : `f(${v}) = ${expression}`}; ${original ? 'E' : 'I'} = ∫₍ₐ₎⁽ᵇ⁾ f(${v}) d${v}, de ${fmt(detail.a, digits)} a ${fmt(detail.b, digits)}.`);
  add('Límites y condición', `a = ${fmt(detail.a, digits)}, b = ${fmt(detail.b, digits)}, n = ${detail.n}. Se cumple a < b; n es entero positivo y par, requisito de la regla.`);
  add('Fórmula general', 'Sₙ = (h/3)[f(x₀) + 4∑f(xᵢ) para i impar + 2∑f(xᵢ) para i par interior + f(xₙ)], con h = (b−a)/n. Cada par de subintervalos utiliza un interpolante cuadrático.');
  add('Ancho de paso', `h = (b−a)/n = (${fmt(detail.b, digits)}−${fmt(detail.a, digits)})/${detail.n} = ${fmt(detail.h, digits)}.`);
  add('Malla', detail.n <= 24 ? detail.rows.map(r => `${v}${r.i}=${fmt(r.x, digits)}`).join('; ') + '.' : `${v}ᵢ = ${fmt(detail.a, digits)} + i·${fmt(detail.h, digits)}, i=0,…,${detail.n}. Los ${detail.n + 1} nodos completos figuran en la tabla paginada.`);
  if (original) for (const r of detail.rows) {
    const angle = Math.PI * r.x / 6, sine = Math.sin(angle), exponent = 0.2 * r.x, exponential = Math.exp(exponent);
    add(`Evaluación de P(t${r.i})`, `t${r.i}=${fmt(r.x, digits)} h; πt/6=${fmt(angle, digits)} rad; sen(πt/6)=${fmt(sine, digits)}; 0,2t=${fmt(exponent, digits)}; e^(0,2t)=${fmt(exponential, digits)}. P=10+5·${fmt(r.x, digits)}·${fmt(sine, digits)}+${fmt(exponential, digits)}=${fmt(r.y, digits)} kW. Las cifras visibles son redondeadas; la operación usa precisión completa.`);
  } else if (detail.n <= 24) for (const r of detail.rows) {
    const substituted = expression.replace(/\b[xt]\b/gi, `(${fmt(r.x, digits)})`);
    add(`Evaluación f(${v}${r.i})`, `${substituted} = ${fmt(r.y, digits)}; c${r.i}=${r.coefficient}; c${r.i}·f(${v}${r.i})=${fmt(r.contribution, digits)}.`);
  } else add('Evaluación de todos los nodos', `Se sustituyó cada ${v}ᵢ en la función y se conservó el valor numérico completo. La tabla paginada contiene los ${detail.n + 1} valores, coeficientes y productos.`);
  add('Coeficientes y productos', detail.n <= 24 ? detail.rows.map(r => `${r.coefficient}·${fmt(r.y, digits)}`).join(' + ') + '.' : 'c₀=cₙ=1; cᵢ=4 si i es impar; cᵢ=2 si i es par interior. Cada producto cᵢf(xᵢ) aparece en la tabla.');
  add('Suma de índices impares', `∑₍ᵢ impar₎ f(${v}ᵢ) = ${detail.n <= 24 ? detail.rows.filter(r => r.i % 2).map(r => fmt(r.y, digits)).join(' + ') + ' = ' : ''}${fmt(detail.oddSum, digits)}.`);
  add('Suma de índices pares interiores', `∑₍ᵢ par interior₎ f(${v}ᵢ) = ${detail.n <= 24 ? detail.rows.filter(r => r.i > 0 && r.i < detail.n && r.i % 2 === 0).map(r => fmt(r.y, digits)).join(' + ') + ' = ' : ''}${fmt(detail.evenSum, digits)}.`);
  add('Sustitución completa', `S${detail.n} = (${fmt(detail.h, digits)}/3)[${fmt(detail.rows[0].y, digits)} + 4(${fmt(detail.oddSum, digits)}) + 2(${fmt(detail.evenSum, digits)}) + ${fmt(detail.rows.at(-1).y, digits)}].`);
  add('Suma ponderada', `f(${v}₀)+4Σimpares+2Σpares+f(${v}ₙ) = ${fmt(detail.weightedSum, digits)}.`);
  add('Resultado aproximado', `S${detail.n} = (${fmt(detail.h, digits)}/3)·${fmt(detail.weightedSum, digits)} = ${fmt(detail.result, digits)}${original ? ' kWh' : ''}.`);
  if (original) add('Valor exacto analítico', `E = 60 + 180/π + 5(e^1,2−1) = ${fmt(exact, digits)} kWh.`);
  if (exact !== null) add(original ? 'Error absoluto real' : 'Diferencia frente a la referencia', `|${fmt(exact, digits)} − ${fmt(detail.result, digits)}| = ${fmt(Math.abs(exact - detail.result), digits)}${original ? ' kWh' : ''}. ${exact === 0 ? 'El porcentaje no está definido porque la referencia es cero.' : `Porcentaje = ${fmt(Math.abs(exact - detail.result) / Math.abs(exact) * 100, digits)} %.`}`);
  if (M !== null) add('Fórmula de cota', `|Eₜ| ≤ ((b−a)h⁴M)/180 = ((${fmt(detail.b, digits)}−${fmt(detail.a, digits)})·${fmt(detail.h, digits)}⁴·${fmt(M, digits)})/180 = ${fmt(simpsonErrorBound(detail.a, detail.b, detail.n, M), digits)}${original ? ' kWh' : ''}. ${original ? 'Esta M conservadora está justificada analíticamente.' : 'Solo es una garantía si M es una cota válida de |f⁽⁴⁾| en todo el intervalo.'}`);
  if (original) add('Dato del enunciado y advertencia', 'Con M=0,45: |Eₜ| ≤ (6·1⁴·0,45)/180 = 0,015 kWh como cálculo formal solicitado. Pero |P⁽⁴⁾(0)| ≈ 2,869351544 > 0,45; por tanto 0,015 kWh no garantiza el error.');
  add('Interpretación', original ? `Durante las seis horas, la energía estimada es ${fmt(detail.result, digits)} kWh; esta integral acumula potencia (kW) en el tiempo (h).` : `La integral aproximada es ${fmt(detail.result, digits)}. Se obtiene sumando contribuciones de interpolantes cuadráticos.`);
  add('Conclusión', original ? 'La estimación ayuda a dimensionar el consumo energético del centro de datos. La diferencia real se calcula con la expresión analítica; la cota válida se reporta separadamente.' : 'Compara distintas n para observar convergencia. Sin valor analítico no se conoce el error real, y sin M justificada no hay garantía numérica de error.');
  append(box, list); return box;
}

function nodesCard(detail, digits) {
  const box = card('steps-card', 'Tabla de nodos, coeficientes y contribuciones');
  append(box, el('p', '', 'La tabla conserva todos los nodos. Los coeficientes siguen 1, 4, 2, 4, …, 2, 4, 1; las cifras se redondean solo al mostrarse.'));
  const { wrap, body } = table(['i', 'xᵢ / tᵢ', 'f(xᵢ) / P(tᵢ)', 'cᵢ', 'cᵢ·f(xᵢ)'], []); append(box, wrap);
  const size = 20, pages = Math.ceil(detail.rows.length / size); let page = 0;
  const draw = () => { body.replaceChildren(); detail.rows.slice(page * size, (page + 1) * size).forEach(r => { const tr = el('tr'); [r.i, fmt(r.x, digits), fmt(r.y, digits), r.coefficient, fmt(r.contribution, digits)].forEach(value => append(tr, el('td', '', String(value)))); append(body, tr); }); };
  draw();
  if (pages > 1) {
    const controls = el('div', 'pagination'), prev = el('button', '', 'Anterior'), next = el('button', '', 'Siguiente'), status = el('span'); prev.type = next.type = 'button';
    const update = () => { draw(); status.textContent = `Filas ${page * size + 1}–${Math.min((page + 1) * size, detail.rows.length)} de ${detail.rows.length}`; prev.disabled = page === 0; next.disabled = page === pages - 1; };
    prev.addEventListener('click', () => { page--; update(); }); next.addEventListener('click', () => { page++; update(); }); append(controls, prev, status, next); append(box, controls); update();
  }
  return box;
}

function functionChart(f, detail, digits) {
  const box = card('chart-card', 'Función e interpolantes cuadráticos');
  const graph = svg('svg', { class: 'chart-svg', viewBox: '0 0 600 320', role: 'img', 'aria-label': 'Curva de la función y aproximaciones parabólicas de Simpson por parejas de subintervalos' });
  const samples = [];
  for (let j = 0; j <= 240; j++) { const x = detail.a + (detail.b - detail.a) * j / 240; try { const y = f(x); if (Number.isFinite(y)) samples.push([x, y]); } catch { /* discontinuidades visuales */ } }
  if (!samples.length) { append(box, el('p', '', 'No se pudo representar la función.')); return box; }
  let ymin = 0, ymax = 0;
  for (const [, y] of samples) { ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); }
  for (const row of detail.rows) { ymin = Math.min(ymin, row.y); ymax = Math.max(ymax, row.y); }
  if (ymax === ymin) { ymin -= 1; ymax += 1; }
  const pad = (ymax - ymin) * .12; ymin -= pad; ymax += pad;
  const left = 45, right = 580, top = 18, bottom = 265;
  const px = x => left + (x - detail.a) / (detail.b - detail.a) * (right - left);
  const py = y => bottom - (y - ymin) / (ymax - ymin) * (bottom - top);
  const zero = py(0);
  for (let j = 0; j <= 4; j++) { const y = top + j * (bottom - top) / 4; append(graph, svg('line', { x1: left, x2: right, y1: y, y2: y, stroke: '#e4ecee' })); svgText(graph, left - 7, y + 4, fmt(ymax - j * (ymax - ymin) / 4, 2), 'end'); }
  append(graph, svg('line', { x1: left, x2: right, y1: zero, y2: zero, stroke: '#8ea6ae' }));
  if (detail.n <= 100) for (let i = 0; i < detail.n; i += 2) {
    const r0 = detail.rows[i], r1 = detail.rows[i + 1], r2 = detail.rows[i + 2];
    const points = [];
    for (let j = 0; j <= 24; j++) { const u = j / 12; const y = r0.y * (u - 1) * (u - 2) / 2 - r1.y * u * (u - 2) + r2.y * u * (u - 1) / 2; points.push([px(r0.x + u * detail.h), py(y)]); }
    const d = `M ${points[0][0]} ${zero} L ${points[0][0]} ${points[0][1]} ` + points.slice(1).map(([x, y]) => `L ${x} ${y}`).join(' ') + ` L ${points.at(-1)[0]} ${zero} Z`;
    append(graph, svg('path', { d, fill: '#2ca6a0', 'fill-opacity': .13, stroke: '#168d87', 'stroke-width': 1.3 }));
  }
  append(graph, svg('polyline', { points: samples.map(([x, y]) => `${px(x)},${py(y)}`).join(' '), fill: 'none', stroke: '#bd6435', 'stroke-width': 2.7 }));
  svgText(graph, left, 290, fmt(detail.a, Math.min(digits, 2))); svgText(graph, right, 290, fmt(detail.b, Math.min(digits, 2)), 'end');
  append(box, graph, el('p', 'chart-caption', detail.n > 100 ? 'Curva de f; se omiten las parábolas del dibujo por legibilidad. La integral sí usa todos los nodos.' : 'Curva de f en naranja; cada zona verde sigue una parábola interpolada en tres nodos. El área bajo el eje se cuenta con signo.'));
  return box;
}

function convergenceCard(rows, suppliedRows, digits, original) {
  const box = card('convergence-card', 'Tabla de convergencia');
  if (!rows.length) { append(box, el('p', '', 'Agrega valores pares de n para estudiar la convergencia.')); return box; }
  const headers = ['n', 'h', 'Integral aproximada', original ? 'Cota M=0,45 (no válida)' : 'Cota con M ingresada', ...(original ? ['Cota M conservadora'] : []), original ? 'Error absoluto real' : 'Diferencia con referencia', 'Diferencia %'];
  const data = rows.map((r, i) => [r.n, fmt(r.h, digits), fmt(r.approximation, digits), original ? fmt(suppliedRows[i].bound, digits) : r.bound === null ? '—' : fmt(r.bound, digits), ...(original ? [fmt(r.bound, digits)] : []), r.absoluteError === null ? '—' : fmt(r.absoluteError, digits), r.percentError === null ? '—' : `${fmt(r.percentError, digits)} %`]);
  append(box, table(headers, data).wrap, el('p', '', original ? 'La columna M=0,45 reproduce el dato de la guía, pero no constituye garantía. La cota conservadora sí proviene de una desigualdad válida para toda la función en [0,6].' : 'Una M ingresada por el usuario solo garantiza el error si se ha demostrado que acota |f⁽⁴⁾| en todo [a,b]. El error real requiere un valor analítico exacto; con una referencia numérica, es una diferencia frente a esa referencia.'));
  return box;
}

function convergenceChart(rows, exact) {
  const box = card('chart-card', 'Convergencia y errores');
  if (rows.length < 2) { append(box, el('p', '', 'Se necesitan al menos dos valores de n para graficar la convergencia.')); return box; }
  const ordered = [...rows].sort((a, b) => a.n - b), left = 53, right = 580, top = 23, bottom = 260;
  const x0 = Math.log10(ordered[0].n), x1 = Math.log10(ordered.at(-1).n);
  const px = n => left + (Math.log10(n) - x0) / (x1 - x0) * (right - left);
  const values = ordered.map(r => r.approximation); if (exact !== null) values.push(exact);
  let ymin = Math.min(...values), ymax = Math.max(...values); if (ymin === ymax) { ymin -= 1; ymax += 1; }
  const pad = (ymax - ymin) * .14; ymin -= pad; ymax += pad;
  const py = y => bottom - (y - ymin) / (ymax - ymin) * (bottom - top);
  const graph = svg('svg', { class: 'chart-svg', viewBox: '0 0 600 310', role: 'img', 'aria-label': 'Integral de Simpson frente al número de subintervalos' });
  for (let j = 0; j <= 4; j++) { const y = top + j * (bottom - top) / 4; append(graph, svg('line', { x1: left, x2: right, y1: y, y2: y, stroke: '#e4ecee' })); svgText(graph, left - 6, y + 4, fmt(ymax - j * (ymax - ymin) / 4, 3), 'end'); }
  if (exact !== null) append(graph, svg('line', { x1: left, x2: right, y1: py(exact), y2: py(exact), stroke: '#bd6435', 'stroke-width': 1.7, 'stroke-dasharray': '5 5' }));
  append(graph, svg('polyline', { points: ordered.map(r => `${px(r.n)},${py(r.approximation)}`).join(' '), fill: 'none', stroke: '#0c827c', 'stroke-width': 2.8 }));
  ordered.forEach(r => { append(graph, svg('circle', { cx: px(r.n), cy: py(r.approximation), r: 4, fill: '#0c827c' })); svgText(graph, px(r.n), 286, String(r.n), 'middle'); });
  append(box, graph, el('p', 'chart-caption', `Aproximación frente a n (escala horizontal logarítmica).${exact === null ? '' : ' Línea punteada: valor exacto o de referencia.'}`));
  const errorRows = ordered.filter(r => r.absoluteError !== null && r.absoluteError > 0);
  if (errorRows.length >= 2) {
    const errorGraph = svg('svg', { class: 'chart-svg', viewBox: '0 0 600 230', role: 'img', 'aria-label': 'Error absoluto frente al número de subintervalos' });
    const logs = errorRows.map(r => Math.log10(r.absoluteError)), min = Math.min(...logs), max = Math.max(...logs);
    const ey = e => max === min ? 110 : 180 - (Math.log10(e) - min) / (max - min) * 140;
    for (let j = 0; j <= 3; j++) { const y = 40 + j * 140 / 3; append(errorGraph, svg('line', { x1: left, x2: right, y1: y, y2: y, stroke: '#e4ecee' })); }
    append(errorGraph, svg('polyline', { points: errorRows.map(r => `${px(r.n)},${ey(r.absoluteError)}`).join(' '), fill: 'none', stroke: '#bd6435', 'stroke-width': 2.7 }));
    errorRows.forEach(r => append(errorGraph, svg('circle', { cx: px(r.n), cy: ey(r.absoluteError), r: 4, fill: '#bd6435' })));
    append(box, el('h4', '', 'Error absoluto'), errorGraph, el('p', 'chart-caption', 'Diferencia absoluta respecto al valor exacto o de referencia; escala vertical logarítmica.'));
  }
  return box;
}

function boundCard(detail, M, original, digits) {
  const box = card('steps-card', 'Cota del error: cálculo y validez');
  if (original) {
    const supplied = simpsonErrorBound(detail.a, detail.b, detail.n, 0.45), conservative = M, valid = simpsonErrorBound(detail.a, detail.b, detail.n, conservative);
    append(box, el('p', '', `Dato de la guía: M = 0,45 ⇒ (6·1⁴·0,45)/180 = ${fmt(supplied, digits)} kWh. Este cálculo formal no garantiza el error: |P⁽⁴⁾(0)| = ${fmt(Math.abs(powerFourthDerivative(0)), digits)} > 0,45; el error real también supera 0,015 kWh.`));
    append(box, el('p', '', `Cota conservadora válida: P⁽⁴⁾(t)=5(π/6)⁴t·sen(πt/6)−20(π/6)³cos(πt/6)+0,0016e^(0,2t). En [0,6], |P⁽⁴⁾(t)| ≤ 30(π/6)⁴+20(π/6)³+0,0016e^1,2 = ${fmt(conservative, digits)}. Así, |Eₜ| ≤ ${fmt(valid, digits)} kWh.`));
  } else append(box, el('p', '', M === null ? 'No se proporcionó M. No se informa una cota teórica de error sin justificar la cuarta derivada.' : `Con la M ingresada: |Eₜ| ≤ ((${fmt(detail.b, digits)}−${fmt(detail.a, digits)})·${fmt(detail.h, digits)}⁴·${fmt(M, digits)})/180 = ${fmt(simpsonErrorBound(detail.a, detail.b, detail.n, M), digits)}. Solo garantiza el error si M ≥ max |f⁽⁴⁾(x)| en todo el intervalo.`));
  return box;
}

function insightCard(detail, exact, original, digits) {
  const box = el('section', 'insight-card');
  append(box, el('span', 'card-kicker', 'Interpretación y conclusión'), el('h3', '', original ? 'Energía durante la carga crítica' : 'Lectura del resultado'));
  append(box, el('p', '', original ? `La integral de la potencia durante 6 horas se estima en ${fmt(detail.result, digits)} kWh. La expresión analítica da ${fmt(exact, digits)} kWh y el error real es ${fmt(Math.abs(detail.result - exact), digits)} kWh. El cálculo de 0,015 kWh con M=0,45 no lo garantiza; la cota conservadora demostrada es mayor que el error real.` : `Simpson 1/3 compuesto estima ${fmt(detail.result, digits)} unidades de f × x con n=${detail.n}. ${exact === null ? 'Sin valor exacto no se conoce el error real.' : `La diferencia frente a la referencia ingresada es ${fmt(Math.abs(detail.result - exact), digits)}.`} Refinar n permite estudiar convergencia, pero por sí solo no demuestra exactitud.`));
  return box;
}

function render(target, { detail, exact, rows, suppliedRows = null, f, expression, digits, M, original }) {
  target.replaceChildren(resultCard(detail, exact, digits, original), dataCard(detail, expression, digits, exact, M, original), stepsCard(detail, expression, digits, exact, M, original), nodesCard(detail, digits), boundCard(detail, M, original, digits), functionChart(f, detail, digits), convergenceCard(rows, suppliedRows, digits, original), convergenceChart(rows, exact), insightCard(detail, exact, original, digits));
}

function number(rawValue, label) {
  const value = rawValue.trim().replace(',', '.'); if (!value) throw new Error(`Ingresa ${label}.`);
  const parsed = Number(value); if (!Number.isFinite(parsed)) throw new Error(`${label} debe ser un número finito.`); return parsed;
}
function nValues(value) {
  if (!value.trim()) return [];
  const parts = value.split(','); if (parts.length > 20) throw new Error('Usa como máximo 20 valores de n.');
  return [...new Set(parts.map(part => { if (!/^\s*\d+\s*$/.test(part)) throw new Error('Los valores de n deben ser enteros pares separados por comas.'); const n = Number(part.trim()); if (!Number.isSafeInteger(n) || n < 2 || n > 100000 || n % 2) throw new Error('Cada n de convergencia debe ser par y estar entre 2 y 100000.'); return n; }))].sort((a, b) => a - b);
}
function solve(event) {
  event?.preventDefault(); const error = $('s13-error'); error.hidden = true; error.textContent = '';
  try {
    const expression = $('s13-expression').value.trim(), f = compileExpression(expression);
    const a = number($('s13-lower').value, 'el límite inferior'), b = number($('s13-upper').value, 'el límite superior');
    const n = number($('s13-intervals').value, 'n'), digits = number($('s13-decimals').value, 'la cantidad de decimales');
    if (!Number.isInteger(digits) || digits < 0 || digits > 12) throw new Error('La cantidad de decimales debe ser un entero entre 0 y 12.');
    const exact = $('s13-exact').value.trim() ? number($('s13-exact').value, 'el valor de referencia') : null;
    const M = $('s13-M').value.trim() ? number($('s13-M').value, 'M') : null;
    if (M !== null && M < 0) throw new Error('M debe ser no negativa.');
    const values = nValues($('s13-n-values').value);
    const detail = simpson_13_detallado(f, a, b, n), rows = values.length ? simpsonConvergence(f, a, b, values, exact, M) : [];
    render($('s13-solver-output'), { detail, exact, rows, f, expression, digits, M, original: false });
  } catch (problem) {
    error.textContent = problem.message; error.hidden = false;
    $('s13-solver-output').replaceChildren(append(el('div', 'empty-state'), el('h3', '', 'Revisa los datos de entrada'), el('p', '', problem.message)));
  }
}
function restore() {
  const source = session13.exercise;
  $('s13-expression').value = source.expression; $('s13-lower').value = String(source.a); $('s13-upper').value = String(source.b); $('s13-intervals').value = String(source.n);
  $('s13-decimals').value = '9'; $('s13-exact').value = raw(exactEnergy()); $('s13-M').value = ''; $('s13-n-values').value = source.convergenceN.join(', ');
  solve();
}
function clear() {
  for (const id of ['s13-expression', 's13-lower', 's13-upper', 's13-intervals', 's13-exact', 's13-M', 's13-n-values']) $(id).value = '';
  $('s13-decimals').value = '6'; $('s13-error').hidden = true;
  $('s13-solver-output').replaceChildren(append(el('div', 'empty-state'), el('span', '', '∫'), el('h3', '', 'Entradas limpias'), el('p', '', 'Escribe una función y sus datos para comenzar.')));
  $('s13-expression').focus();
}

const original = originalSimpsonExercise();
render($('s13-original-output'), { detail: original.detail, exact: original.exact, rows: original.convergence, suppliedRows: original.suppliedConvergence, f: powerRate, expression: 'P(t) = 10 + 5t·sen(πt/6) + e^(0,2t)', digits: 9, M: original.validM, original: true });
$('s13-form').addEventListener('submit', solve);
$('s13-restore').addEventListener('click', restore);
$('s13-modify').addEventListener('click', () => { $('s13-expression').focus(); $('s13-expression').select(); });
$('s13-clear').addEventListener('click', clear);
restore();
