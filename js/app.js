import { compileExpression } from './math/expression.js';
import { trapecio_detallado, convergence } from './math/trapezoid.js';
import { session12, originalExercise, trafficRate } from './sessions/session12.js';

const $ = id => document.getElementById(id);
const fmt = (value, digits = 6) => Number.isFinite(value) ? new Intl.NumberFormat('es-PE', { minimumFractionDigits: Math.min(digits, 3), maximumFractionDigits: digits, useGrouping: false }).format(value) : '—';
const number = (value, label) => {
  const trimmed = value.trim().replace(',', '.');
  if (!trimmed) throw new Error(`Ingresa ${label}.`);
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) throw new Error(`${label} debe ser un número finito.`);
  return parsed;
};
const el = (tag, className = '', content = '') => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== '') node.textContent = content;
  return node;
};
const append = (parent, ...children) => { parent.append(...children); return parent; };
const card = (className, title) => append(el('section', className), el('h3', '', title));
const svg = (tag, attrs = {}) => {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
};
const svgText = (parent, x, y, content, anchor = 'start', fill = '#667f8a', size = 12) => append(parent, append(svg('text', { x, y, 'text-anchor': anchor, fill, 'font-size': size, 'font-family': 'Arial, sans-serif' }), document.createTextNode(content)));

function makeTable(headers, rows) {
  const wrap = el('div', 'table-wrap');
  const table = el('table', 'numeric-table');
  const head = el('thead'), tr = el('tr');
  headers.forEach(h => append(tr, el('th', '', h)));
  append(head, tr);
  const body = el('tbody');
  rows.forEach(cells => { const row = el('tr'); cells.forEach(c => append(row, el('td', '', String(c)))); append(body, row); });
  append(table, head, body); append(wrap, table);
  return { wrap, body };
}

function makeResult(detail, unit, digits, exact) {
  const box = el('section', 'result-card');
  append(box, el('span', 'card-kicker', 'Integral aproximada'), el('strong', '', `${fmt(detail.result, digits)}${unit ? ` ${unit}` : ''}`));
  append(box, el('p', '', `Regla del trapecio compuesto con ${detail.n} subintervalo${detail.n === 1 ? '' : 's'}.`));
  if (exact !== null) {
    append(box, el('p', '', `Referencia: ${fmt(exact, digits)}${unit ? ` ${unit}` : ''}. Error absoluto: ${fmt(Math.abs(detail.result - exact), digits)}.`));
  }
  return box;
}

function makeData(detail, expression, digits, exact, unit) {
  const box = card('data-card', 'Datos identificados');
  const list = el('div', 'data-list');
  const pairs = [['Función', expression], ['Intervalo', `[${fmt(detail.a, digits)}, ${fmt(detail.b, digits)}]`], ['Subintervalos', String(detail.n)], ['Ancho h', fmt(detail.h, digits)], ['Unidad', unit || 'Unidades de f × x'], ['Valor de referencia', exact === null ? 'No proporcionado' : fmt(exact, digits)]];
  pairs.forEach(([label, value]) => append(list, append(el('div'), el('span', '', label), el('strong', '', value))));
  append(box, list);
  return box;
}

function makeSteps(detail, expression, digits, original, exact, unit) {
  const box = card('steps-card', 'Procedimiento paso a paso');
  const list = el('ol', 'step-list');
  const add = (title, content) => append(list, append(el('li'), el('strong', '', title), el('span', '', content)));
  const variable = original ? 't' : /\bt\b/i.test(expression) ? 't' : 'x';
  add('Datos del problema', `f(${variable}) = ${original ? '10 + 5·sen(πt/4) + e^(0,15t)' : expression}; a = ${fmt(detail.a, digits)}, b = ${fmt(detail.b, digits)}, n = ${detail.n}.`);
  add('Fórmula aplicada', 'Tₙ = (h/2)·[f(x₀) + 2·Σf(xᵢ) + f(xₙ)], con i = 1, …, n−1.');
  add('Ancho de paso', `h = (b − a)/n = (${fmt(detail.b, digits)} − ${fmt(detail.a, digits)})/${detail.n} = ${fmt(detail.h, digits)}.`);
  const xs = detail.n <= 20 ? detail.rows.map(r => `${variable}${r.i}=${fmt(r.x, digits)}`) : [];
  add('Malla de puntos', detail.n <= 20 ? xs.join('; ') + '.' : `${variable}ᵢ = ${fmt(detail.a, digits)} + i·${fmt(detail.h, digits)}, i = 0, …, ${detail.n}. Los ${detail.n + 1} nodos se muestran en la tabla paginada.`);
  if (original) {
    for (const r of detail.rows) {
      const angle = Math.PI * r.x / 4;
      const sine = Math.sin(angle);
      const exponent = 0.15 * r.x;
      const exponential = Math.exp(exponent);
      add(`Evaluación R(t${r.i})`, `t${r.i}=${fmt(r.x, digits)}: πt/4=${fmt(angle, digits)} rad; sen(πt/4)=${fmt(sine, digits)}; 0,15t=${fmt(exponent, digits)}; e^(0,15t)=${fmt(exponential, digits)}. R=10 + 5·(${fmt(sine, digits)}) + ${fmt(exponential, digits)} = ${fmt(r.y, digits)} Mbps.`);
    }
  } else if (detail.n <= 12) {
    for (const r of detail.rows) {
      const substituted = expression.replace(/\b[xt]\b/gi, `(${fmt(r.x, Math.min(digits, 10))})`);
      add(`Evaluación f(${variable}${r.i})`, `${substituted} = ${fmt(r.y, digits)}; coeficiente ${r.coefficient}; contribución ${fmt(r.contribution, digits)}.`);
    }
  } else add('Evaluaciones', `Se evaluó f en los ${detail.n + 1} nodos sin redondeo intermedio. Consulta la tabla para cada valor, coeficiente y contribución.`);
  const sum = detail.n <= 12 ? detail.rows.map(r => `${r.coefficient === 2 ? '2·' : ''}${fmt(r.y, digits)}`).join(' + ') : `f(${variable}₀) + 2·Σf(${variable}ᵢ) + f(${variable}ₙ)`;
  add('Sustitución en la regla', `Tₙ = (${fmt(detail.h, digits)}/2)·[${sum}].`);
  add('Suma ponderada', `Σ[cᵢ·f(${variable}ᵢ)] = ${fmt(detail.weightedSum, digits)}. Los extremos tienen coeficiente 1 y los nodos interiores, 2.`);
  add('Multiplicación y resultado', `Tₙ = ${fmt(detail.h, digits)}/2 · ${fmt(detail.weightedSum, digits)} = ${fmt(detail.result, digits)}${unit ? ` ${unit}` : ''}.`);
  if (original) add('Valor exacto para comparar', `D = 120 + 40/π + (e^1,8 − 1)/0,15 = ${fmt(exact, digits)} Mb.`);
  if (exact !== null) add('Error frente a la referencia', `|${fmt(exact, digits)} − ${fmt(detail.result, digits)}| = ${fmt(Math.abs(exact - detail.result), digits)}; error porcentual ${exact === 0 ? 'no definido porque la referencia es cero' : `${fmt(Math.abs(exact - detail.result) / Math.abs(exact) * 100, digits)} %`}.`);
  append(box, list);
  return box;
}

function makeNodes(detail, digits) {
  const box = card('steps-card', 'Tabla de nodos y contribuciones');
  const note = el('p', '', 'Los coeficientes son 1 en los extremos y 2 en cada nodo interior. Las cifras mostradas se redondean solo al visualizar.');
  append(box, note);
  const size = 20, pages = Math.ceil(detail.rows.length / size);
  const { wrap, body } = makeTable(['i', 'xᵢ / tᵢ', 'f(xᵢ) / R(tᵢ)', 'cᵢ', 'cᵢ · f(xᵢ)'], []);
  append(box, wrap);
  if (pages > 1) {
    const controls = el('div', 'pagination');
    const prev = el('button', '', 'Anterior'), next = el('button', '', 'Siguiente'), status = el('span');
    prev.type = next.type = 'button';
    append(controls, prev, status, next); append(box, controls);
    let page = 0;
    const draw = () => {
      body.replaceChildren();
      detail.rows.slice(page * size, (page + 1) * size).forEach(r => { const row = el('tr'); [r.i, fmt(r.x, digits), fmt(r.y, digits), r.coefficient, fmt(r.contribution, digits)].forEach(v => append(row, el('td', '', String(v)))); append(body, row); });
      status.textContent = `Filas ${page * size + 1}–${Math.min((page + 1) * size, detail.rows.length)} de ${detail.rows.length}`;
      prev.disabled = page === 0; next.disabled = page === pages - 1;
    };
    prev.addEventListener('click', () => { page--; draw(); });
    next.addEventListener('click', () => { page++; draw(); });
    draw();
  } else {
    detail.rows.forEach(r => { const row = el('tr'); [r.i, fmt(r.x, digits), fmt(r.y, digits), r.coefficient, fmt(r.contribution, digits)].forEach(v => append(row, el('td', '', String(v)))); append(body, row); });
  }
  return box;
}

function makeFunctionChart(f, detail, digits) {
  const box = card('chart-card', 'Función y trapecios');
  const graph = svg('svg', { class: 'chart-svg', viewBox: '0 0 600 320', role: 'img', 'aria-label': 'Curva de la función y aproximación con trapecios' });
  const left = 46, right = 580, top = 22, bottom = 265, count = 180;
  const samples = [];
  for (let i = 0; i <= count; i++) { const x = detail.a + (detail.b - detail.a) * i / count; try { const y = f(x); if (Number.isFinite(y)) samples.push([x, y]); } catch { /* chart tolerates gaps */ } }
  if (!samples.length) { append(box, el('p', '', 'No se pudo dibujar la función en el intervalo.')); return box; }
  let ymin = 0, ymax = 0;
  for (const [, y] of samples) { ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); }
  for (const row of detail.rows) { ymin = Math.min(ymin, row.y); ymax = Math.max(ymax, row.y); }
  if (ymax === ymin) { ymin -= 1; ymax += 1; }
  const pad = (ymax - ymin) * .1; ymin -= pad; ymax += pad;
  const px = x => left + (x - detail.a) / (detail.b - detail.a) * (right - left);
  const py = y => bottom - (y - ymin) / (ymax - ymin) * (bottom - top);
  for (let i = 0; i <= 4; i++) {
    const y = top + i * (bottom - top) / 4;
    append(graph, svg('line', { x1: left, x2: right, y1: y, y2: y, stroke: '#e4ecee' }));
    svgText(graph, left - 8, y + 4, fmt(ymax - i * (ymax - ymin) / 4, Math.min(digits, 2)), 'end', '#6c7f88', 10);
  }
  const zero = py(0);
  append(graph, svg('line', { x1: left, x2: right, y1: zero, y2: zero, stroke: '#8ea6ae', 'stroke-width': 1.5 }));
  const maxTraps = 100;
  if (detail.n <= maxTraps) for (let i = 0; i < detail.n; i++) {
    const a = detail.rows[i], b = detail.rows[i + 1];
    append(graph, svg('polygon', { points: `${px(a.x)},${zero} ${px(a.x)},${py(a.y)} ${px(b.x)},${py(b.y)} ${px(b.x)},${zero}`, fill: '#2ca6a0', 'fill-opacity': .15, stroke: '#2c9a95', 'stroke-width': .8 }));
  }
  append(graph, svg('polyline', { points: samples.map(([x, y]) => `${px(x)},${py(y)}`).join(' '), fill: 'none', stroke: '#bd6435', 'stroke-width': 2.7, 'stroke-linejoin': 'round' }));
  svgText(graph, left, 290, fmt(detail.a, Math.min(digits, 2))); svgText(graph, right, 290, fmt(detail.b, Math.min(digits, 2)), 'end');
  append(box, graph, el('p', 'chart-caption', detail.n > maxTraps ? `Se muestra la curva; se omiten los ${detail.n} trapecios del gráfico para conservar su legibilidad. La tabla y el cálculo sí usan todos los nodos.` : 'Curva en naranja y aproximación trapezoidal en verde. Las áreas bajo el eje horizontal cuentan con signo.'));
  return box;
}

function makeConvergenceChart(rows, exact) {
  const box = card('chart-card', 'Convergencia y error');
  if (rows.length < 2) { append(box, el('p', '', 'Añade al menos dos valores de n para trazar la convergencia.')); return box; }
  const graph = svg('svg', { class: 'chart-svg', viewBox: '0 0 600 320', role: 'img', 'aria-label': 'Integral aproximada frente al número de subintervalos' });
  const left = 48, right = 578, top = 22, bottom = 265;
  const xs = rows.map(r => Math.log10(r.n)); let xmin = Math.min(...xs), xmax = Math.max(...xs);
  if (xmin === xmax) { xmin -= 1; xmax += 1; }
  const vals = rows.map(r => r.approximation);
  if (exact !== null) vals.push(exact);
  let ymin = Math.min(...vals), ymax = Math.max(...vals);
  if (ymin === ymax) { ymin -= 1; ymax += 1; }
  const pad = (ymax - ymin) * .17; ymin -= pad; ymax += pad;
  const px = n => left + (Math.log10(n) - xmin) / (xmax - xmin) * (right - left);
  const py = value => bottom - (value - ymin) / (ymax - ymin) * (bottom - top);
  for (let i = 0; i <= 4; i++) { const y = top + i * (bottom - top) / 4; append(graph, svg('line', { x1: left, x2: right, y1: y, y2: y, stroke: '#e4ecee' })); svgText(graph, left - 8, y + 4, fmt(ymax - i * (ymax - ymin) / 4, 3), 'end', '#6c7f88', 10); }
  const ordered = [...rows].sort((a, b) => a.n - b.n);
  if (exact !== null) {
    const targetY = py(exact);
    append(graph, svg('line', { x1: left, x2: right, y1: targetY, y2: targetY, stroke: '#bc6b42', 'stroke-width': 1.6, 'stroke-dasharray': '5 5' }));
  }
  append(graph, svg('polyline', { points: ordered.map(r => `${px(r.n)},${py(r.approximation)}`).join(' '), fill: 'none', stroke: '#0c827c', 'stroke-width': 2.8 }));
  ordered.forEach(r => { append(graph, svg('circle', { cx: px(r.n), cy: py(r.approximation), r: 4.7, fill: '#0c827c', stroke: 'white', 'stroke-width': 2 })); svgText(graph, px(r.n), 290, String(r.n), 'middle', '#5e7380', 10); });
  append(box, graph, el('p', 'chart-caption', `Integral aproximada frente a n; eje horizontal logarítmico.${exact === null ? '' : ' La línea punteada indica el valor de referencia.'}`));
  if (exact !== null) {
    const errors = ordered.map(r => r.absoluteError);
    const positives = errors.filter(e => e > 0);
    if (positives.length) {
      const low = Math.floor(Math.log10(Math.min(...positives)));
      const high = Math.ceil(Math.log10(Math.max(...positives)));
      const errorGraph = svg('svg', { class: 'chart-svg', viewBox: '0 0 600 220', role: 'img', 'aria-label': 'Error absoluto frente al número de subintervalos' });
      const yError = e => 175 - (Math.log10(Math.max(e, 10 ** (low - 1))) - (low - 1)) / Math.max(1, high - low + 1) * 145;
      for (let power = low - 1; power <= high; power++) {
        const y = yError(10 ** power);
        append(errorGraph, svg('line', { x1: left, x2: right, y1: y, y2: y, stroke: '#e4ecee' }));
        svgText(errorGraph, left - 8, y + 4, `10^${power}`, 'end', '#6c7f88', 10);
      }
      append(errorGraph, svg('polyline', { points: ordered.map(r => `${px(r.n)},${yError(r.absoluteError)}`).join(' '), fill: 'none', stroke: '#bc6b42', 'stroke-width': 2.6 }));
      ordered.forEach(r => append(errorGraph, svg('circle', { cx: px(r.n), cy: yError(r.absoluteError), r: 4, fill: '#bc6b42' })));
      append(box, el('h4', '', 'Cambio del error absoluto'), errorGraph, el('p', 'chart-caption', 'Ejes logarítmicos: n y error absoluto. Un punto más bajo indica menor error.'));
    }
  }
  return box;
}

function makeConvergence(rows, digits, unit) {
  const box = card('convergence-card', 'Tabla de convergencia');
  if (!rows.length) {
    append(box, el('p', '', 'No se solicitaron valores de n para el análisis de convergencia. Puedes añadirlos en el formulario y volver a calcular.'));
    return box;
  }
  const data = rows.map(r => [r.n, fmt(r.h, digits), `${fmt(r.approximation, digits)}${unit ? ` ${unit}` : ''}`, r.absoluteError === null ? '—' : fmt(r.absoluteError, digits), r.percentError === null ? '—' : `${fmt(r.percentError, digits)} %`]);
  append(box, makeTable(['n', 'h', 'Integral aproximada', 'Error absoluto real', 'Error porcentual'], data).wrap);
  append(box, el('p', '', rows[0].absoluteError === null ? 'Sin valor exacto o de referencia, los errores no se calculan.' : 'Error absoluto = |referencia − aproximación|. Error porcentual = error absoluto / |referencia| × 100.'));
  return box;
}

function makeInsight(detail, rows, original, exact, unit, digits) {
  const box = el('section', 'insight-card');
  append(box, el('span', 'card-kicker', original ? 'Interpretación y conclusión' : 'Conclusión matemática'), el('h3', '', original ? 'Datos transferidos durante el pico de demanda' : 'Lectura del resultado'));
  const text = original
    ? `La tasa R(t), en Mbps, se acumuló durante 12 segundos. Con cuatro subintervalos, el trapecio compuesto estima ${fmt(detail.result, digits)} Mb transferidos. Frente al valor exacto de ${fmt(exact, digits)} Mb, la diferencia es ${fmt(Math.abs(exact - detail.result), digits)} Mb. El resultado con n=4 subestima la transferencia real. Como R es suave en [0, 12], el error del trapecio compuesto es de orden h²: al refinar la malla, los valores se acercan al exacto. Por ejemplo, el error con n=100 es aproximadamente un cuarto del error con n=50.`
    : `La aproximación con n=${detail.n} es ${fmt(detail.result, digits)}${unit ? ` ${unit}` : ''}. ${exact === null ? 'Sin un valor de referencia no se puede obtener el error real; la comparación entre varios n muestra estabilidad, pero por sí sola no prueba exactitud.' : `El error absoluto frente a la referencia es ${fmt(Math.abs(exact - detail.result), digits)}. ${rows.length > 1 ? 'Compara los valores de n en la tabla para estudiar la convergencia.' : ''}`}`;
  append(box, el('p', '', text));
  return box;
}

function renderOutput(target, { detail, exact, rows, f, expression, digits, unit, original }) {
  target.replaceChildren(
    makeResult(detail, unit, digits, exact), makeData(detail, expression, digits, exact, unit),
    makeSteps(detail, expression, digits, original, exact, unit), makeNodes(detail, digits),
    makeFunctionChart(f, detail, digits), makeConvergence(rows, digits, unit),
    makeConvergenceChart(rows, exact), makeInsight(detail, rows, original, exact, unit, digits)
  );
}

function parseNValues(raw) {
  if (!raw.trim()) return [];
  const values = raw.split(',').map(part => {
    const trimmed = part.trim();
    if (!/^\d+$/.test(trimmed)) throw new Error('Los valores de n deben ser enteros positivos separados por comas.');
    return Number(trimmed);
  });
  if (values.length > 20) throw new Error('Usa como máximo 20 valores de n.');
  if (values.some(n => !Number.isSafeInteger(n) || n < 1 || n > 100000)) throw new Error('Cada n debe estar entre 1 y 100000.');
  return [...new Set(values)].sort((a, b) => a - b);
}

function solve(event) {
  event?.preventDefault();
  const error = $('form-error'); error.hidden = true; error.textContent = '';
  try {
    const expression = $('expression').value.trim();
    const f = compileExpression(expression);
    const a = number($('lower').value, 'el límite inferior');
    const b = number($('upper').value, 'el límite superior');
    const n = number($('intervals').value, 'n');
    const digits = number($('decimals').value, 'la precisión decimal');
    if (!Number.isInteger(digits) || digits < 0 || digits > 12) throw new Error('La precisión debe ser un entero entre 0 y 12.');
    const exact = $('exact').value.trim() ? number($('exact').value, 'el valor de referencia') : null;
    const nValues = parseNValues($('n-values').value);
    const detail = trapecio_detallado(f, a, b, n);
    const rows = nValues.length ? convergence(f, a, b, nValues, exact) : [];
    renderOutput($('solver-output'), { detail, exact, rows, f, expression, digits, unit: '', original: false });
  } catch (problem) {
    error.textContent = problem.message; error.hidden = false;
    $('solver-output').replaceChildren(append(el('div', 'empty-state'), el('h3', '', 'Revisa los datos de entrada'), el('p', '', problem.message)));
  }
}

function restore() {
  const data = session12.exercise;
  $('expression').value = data.expression;
  $('lower').value = String(data.a); $('upper').value = String(data.b); $('intervals').value = String(data.n);
  $('decimals').value = '9'; $('exact').value = String(originalExercise().exact);
  $('n-values').value = data.convergenceN.join(', ');
  solve();
}
function clear() {
  $('solver-form').reset();
  for (const id of ['expression', 'lower', 'upper', 'intervals', 'exact', 'n-values']) $(id).value = '';
  $('decimals').value = '6';
  $('form-error').hidden = true;
  $('solver-output').replaceChildren(append(el('div', 'empty-state'), el('span', '', '∫'), el('h3', '', 'Entradas limpias'), el('p', '', 'Escribe una función y sus datos para comenzar.')));
  $('expression').focus();
}

const original = originalExercise();
renderOutput($('original-output'), { detail: original.detail, exact: original.exact, rows: original.convergence, f: trafficRate, expression: 'R(t) = 10 + 5·sen(πt/4) + e^(0,15t)', digits: 9, unit: 'Mb', original: true });
$('solver-form').addEventListener('submit', solve);
$('restore-button').addEventListener('click', restore);
$('clear-button').addEventListener('click', clear);
restore();
