import { compileExpression, compileOdeExpression } from './math/expression.js';
import { solveInitialValue, errorAgainstReference, ODE_MAX_STEPS } from './math/ode.js';
import { session14, originalSlope, exactOriginal, originalOdeExercise } from './sessions/session14.js';

const $ = id => document.getElementById(id);
const fmt = (value, digits = 9) => Number.isFinite(value) ? new Intl.NumberFormat('es-PE', { minimumFractionDigits: Math.min(digits, 3), maximumFractionDigits: digits, useGrouping: false }).format(value) : '—';
const el = (tag, className = '', content = '') => { const node = document.createElement(tag); if (className) node.className = className; if (content !== '') node.textContent = content; return node; };
const append = (parent, ...children) => { parent.append(...children); return parent; };
const card = (className, title) => append(el('section', className), el('h3', '', title));
const svg = (tag, attrs = {}) => { const node = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value)); return node; };
const svgText = (parent, x, y, content, anchor = 'start') => append(parent, append(svg('text', { x, y, 'text-anchor': anchor, fill: '#667f8a', 'font-size': 11, 'font-family': 'Arial, sans-serif' }), document.createTextNode(content)));

function makeTable(headers) {
  const wrap = el('div', 'table-wrap'), table = el('table', 'numeric-table'), head = el('thead'), tr = el('tr'), body = el('tbody');
  headers.forEach(h => append(tr, el('th', '', h))); append(head, tr); append(table, head, body); append(wrap, table);
  return { wrap, body };
}
function addRow(body, cells) { const tr = el('tr'); cells.forEach(value => append(tr, el('td', '', String(value)))); append(body, tr); }
function addStep(list, title, text) { append(list, append(el('li'), el('strong', '', title), el('span', '', text))); }
const methodName = method => method === 'heun' ? 'Euler mejorado (Heun)' : 'Euler';

function originalDerivation() {
  const box = card('steps-card', 'Transformación del PVI y solución analítica'), list = el('ol', 'step-list');
  addStep(list, 'Ecuación de la tarea', '(y² − x²)dx + xy dy = 0, con y(1)=2. Se busca y(1,2) usando h=0,1.');
  addStep(list, 'Forma diferencial explícita', 'Dividir por dx: y² − x² + xy·(dy/dx) = 0. Entonces xy·y′ = x² − y².');
  addStep(list, 'Despeje de la derivada', 'Para x ≠ 0 e y ≠ 0: y′ = (x² − y²)/(xy) = x/y − y/x = f(x,y).');
  addStep(list, 'Número de iteraciones', 'n = (x final − x₀)/h = (1,2 − 1)/0,1 = 2. La malla es x₀=1, x₁=1,1, x₂=1,2.');
  addStep(list, 'Sustitución para solución exacta', 'Sea u=y². Como u′=2yy′, entonces u′ = 2x − 2u/x y u′+(2/x)u=2x.');
  addStep(list, 'Factor integrante', 'En x>0, μ(x)=exp(∫2/x dx)=x². Por tanto (x²u)′=2x³ e integrar da x²u=x⁴/2+C.');
  addStep(list, 'Constante y rama', 'y²=x²/2+C/x². Con y(1)=2: 4=1/2+C, así C=7/2. La condición y₀>0 selecciona y(x)=√(x²/2+7/(2x²)).');
  addStep(list, 'Valor verdadero', `y(1,2)=√(1,2²/2+7/(2·1,2²))=${fmt(exactOriginal(1.2), 9)}. Esta solución analítica pertenece exclusivamente al ejercicio original.`);
  append(box, list); return box;
}

function dataCard(solutions, expression, exactExpression, digits, original) {
  const s = solutions[0], box = card('data-card', 'Datos identificados'), list = el('div', 'data-list');
  const pairs = [['EDO', `y′ = ${expression}`], ['Condición inicial', `y(${fmt(s.x0, digits)}) = ${fmt(s.y0, digits)}`], ['x final', fmt(s.xf, digits)], ['Pasos n', String(s.n)], ['Paso nominal', fmt(s.nominalStep, digits)], ['Métodos', solutions.map(v => methodName(v.method)).join(' y ')], ['Referencia', exactExpression || 'No proporcionada']];
  pairs.forEach(([label, value]) => append(list, append(el('div'), el('span', '', label), el('strong', '', value))));
  append(box, list);
  if (s.lastStepAdjusted) append(box, el('p', '', `El último paso se ajustó a ${fmt(s.rows.at(-1).h, digits)} para llegar exactamente a x final. Los pasos anteriores conservaron la magnitud solicitada.`));
  if (!original && exactExpression) append(box, el('p', '', 'La solución analítica ingresada se toma como referencia proporcionada por el usuario; verifica que satisfaga la EDO y la condición inicial.'));
  return box;
}

function resultCard(solution, reference, digits, original) {
  const box = el('section', 'result-card');
  append(box, el('span', 'card-kicker', methodName(solution.method)), el('strong', '', `y(${fmt(solution.xf, digits)}) ≈ ${fmt(solution.result, digits)}`));
  append(box, el('p', '', `${solution.n} ${solution.n === 1 ? 'iteración' : 'iteraciones'}; ${solution.method === 'heun' ? 'predicción y corrección por paso' : 'pendiente inicial por paso'}.`));
  if (reference !== null) { const error = errorAgainstReference(solution.result, reference); append(box, el('p', '', `${original ? 'Error real' : 'Diferencia con la referencia'}: ${fmt(error.absolute, digits)}; porcentaje: ${error.relativePercent === null ? 'no definido (referencia cero)' : `${fmt(error.relativePercent, digits)} %`}.`)); }
  return box;
}

function substituted(expression, x, y, digits) {
  return expression.replace(/\b[xt]\b/gi, `(${fmt(x, digits)})`).replace(/\by\b/gi, `(${fmt(y, digits)})`);
}
function methodCard(solution, expression, reference, digits) {
  const box = card('steps-card', `Desarrollo paso a paso · ${methodName(solution.method)}`);
  append(box, el('p', '', solution.method === 'heun' ? 'Predictor zᵢ₊₁ = yᵢ+hᵢf(xᵢ,yᵢ); corrector yᵢ₊₁ = yᵢ+(hᵢ/2)[f(xᵢ,yᵢ)+f(xᵢ₊₁,zᵢ₊₁)].' : 'Fórmula de Euler: yᵢ₊₁ = yᵢ+hᵢf(xᵢ,yᵢ).'));
  append(box, el('p', '', 'Cada fila utiliza los valores internos completos; solo se redondea para mostrar y copiar. Las pendientes corresponden a la trayectoria de este método.'));
  const headers = solution.method === 'heun' ? ['i', 'xᵢ', 'yᵢ', 'hᵢ', 'k₁', 'predictor', 'k₂', 'yᵢ₊₁'] : ['i', 'xᵢ', 'yᵢ', 'hᵢ', 'pendiente', 'yᵢ₊₁'];
  const { wrap, body } = makeTable(headers), steps = el('ol', 'step-list'), pagination = el('div', 'pagination'), prev = el('button', '', 'Anterior'), next = el('button', '', 'Siguiente'), status = el('span');
  prev.type = next.type = 'button'; append(pagination, prev, status, next); append(box, wrap, steps);
  const size = 8, pages = Math.ceil(solution.rows.length / size); let page = 0;
  const draw = () => {
    body.replaceChildren(); steps.replaceChildren();
    for (const row of solution.rows.slice(page * size, (page + 1) * size)) {
      const base = [row.i, fmt(row.x, digits), fmt(row.y, digits), fmt(row.h, digits), fmt(row.k1, digits)];
      addRow(body, solution.method === 'heun' ? [...base, fmt(row.predictor, digits), fmt(row.k2, digits), fmt(row.yNext, digits)] : [...base, fmt(row.yNext, digits)]);
      addStep(steps, `Iteración ${row.i + 1}: pendiente inicial`, `x${row.i}=${fmt(row.x, digits)}, y${row.i}=${fmt(row.y, digits)}, h${row.i}=${fmt(row.h, digits)}. k₁=f(x${row.i},y${row.i})=${substituted(expression, row.x, row.y, digits)}=${fmt(row.k1, digits)}.`);
      addStep(steps, solution.method === 'heun' ? `Iteración ${row.i + 1}: predictor` : `Iteración ${row.i + 1}: actualización`, `${solution.method === 'heun' ? 'z' : 'y'}${row.i + 1}=${fmt(row.y, digits)}+(${fmt(row.h, digits)})·(${fmt(row.k1, digits)})=${fmt(row.predictor, digits)}; x${row.i + 1}=${fmt(row.xNext, digits)}.`);
      if (solution.method === 'heun') {
        addStep(steps, `Iteración ${row.i + 1}: pendiente final`, `k₂=f(${fmt(row.xNext, digits)}, ${fmt(row.predictor, digits)})=${substituted(expression, row.xNext, row.predictor, digits)}=${fmt(row.k2, digits)}.`);
        addStep(steps, `Iteración ${row.i + 1}: corrector`, `y${row.i + 1}=${fmt(row.y, digits)}+(${fmt(row.h, digits)}/2)[${fmt(row.k1, digits)}+${fmt(row.k2, digits)}]=${fmt(row.yNext, digits)}.`);
      }
    }
    status.textContent = `Iteraciones ${page * size + 1}–${Math.min((page + 1) * size, solution.n)} de ${solution.n}`;
    prev.disabled = page === 0; next.disabled = page === pages - 1;
  };
  if (pages > 1) { append(box, pagination); prev.addEventListener('click', () => { page--; draw(); }); next.addEventListener('click', () => { page++; draw(); }); }
  draw();
  append(box, el('p', '', `Resultado final: y(${fmt(solution.xf, digits)}) ≈ ${fmt(solution.result, digits)}. ${reference === null ? 'Sin solución analítica no se conoce el error verdadero.' : `Diferencia absoluta frente a ${fmt(reference, digits)}: ${fmt(Math.abs(reference - solution.result), digits)}.`}`));
  return box;
}

function comparisonCard(solutions, reference, digits, original) {
  const box = card('convergence-card', 'Comparación de métodos y errores');
  const { wrap, body } = makeTable(['Método', 'Valor verdadero / referencia', 'Aproximación', 'Error absoluto', 'Error relativo %']);
  solutions.forEach(s => { const error = reference === null ? null : errorAgainstReference(s.result, reference); addRow(body, [methodName(s.method), reference === null ? '—' : fmt(reference, digits), fmt(s.result, digits), error === null ? '—' : fmt(error.absolute, digits), error?.relativePercent === null || error === null ? '—' : `${fmt(error.relativePercent, digits)} %`]); });
  append(box, wrap);
  if (reference === null) append(box, el('p', '', 'Sin solución analítica conocida no puede calcularse el error verdadero. Las dos aproximaciones no constituyen por sí mismas una solución exacta.'));
  else append(box, el('p', '', `Error absoluto = |referencia − aproximación|. Error relativo porcentual = error absoluto / |referencia| × 100. ${original ? 'La referencia del caso original procede de la solución analítica demostrada.' : 'La referencia procede de la expresión analítica ingresada; su validez debe verificarse.'}`));
  return box;
}

function chart(solutions, exact, digits, kind = 'trajectory') {
  const isError = kind === 'error', box = card('chart-card', isError ? 'Evolución del error absoluto' : 'Trayectoria de la solución');
  if (isError && exact === null) { append(box, el('p', '', 'Sin solución analítica no se puede graficar el error verdadero.')); return box; }
  const a = solutions[0].x0, b = solutions[0].xf, xmin = Math.min(a, b), xmax = Math.max(a, b);
  const series = solutions.map(s => ({ name: methodName(s.method), color: s.method === 'euler' ? '#bd6435' : '#0c827c', points: [{ x: s.x0, y: isError ? Math.abs(exact(s.x0) - s.y0) : s.y0 }, ...s.rows.map(r => ({ x: r.xNext, y: isError ? Math.abs(exact(r.xNext) - r.yNext) : r.yNext }))] }));
  if (!isError && exact !== null) {
    const points = [];
    for (let i = 0; i <= 120; i++) { const x = xmin + (xmax - xmin) * i / 120; try { const y = exact(x); if (Number.isFinite(y)) points.push({ x, y }); } catch { /* fuera del dominio de la referencia */ } }
    if (points.length) series.push({ name: 'Solución analítica', color: '#5869aa', points });
  }
  const simplified = series.map(s => {
    if (s.points.length <= 600) return s;
    const stride = Math.ceil(s.points.length / 600);
    return { ...s, points: s.points.filter((_, i) => i === 0 || i === s.points.length - 1 || i % stride === 0) };
  });
  let ymin = isError ? 0 : Infinity, ymax = -Infinity;
  for (const s of series) for (const p of s.points) { ymin = Math.min(ymin, p.y); ymax = Math.max(ymax, p.y); }
  if (isError) { ymin = 0; ymax = ymax > 0 ? ymax * 1.12 : 1; }
  else { if (ymin === ymax) { ymin -= 1; ymax += 1; } const pad = (ymax - ymin) * .12; ymin -= pad; ymax += pad; }
  const graph = svg('svg', { class: 'chart-svg', viewBox: '0 0 600 320', role: 'img', 'aria-label': isError ? 'Error absoluto por punto de la malla' : 'Trayectorias aproximadas y solución analítica cuando existe' });
  const left = 50, right = 580, top = 20, bottom = 260, px = x => left + (x - xmin) / (xmax - xmin) * (right - left), py = y => bottom - (y - ymin) / (ymax - ymin) * (bottom - top);
  for (let j = 0; j <= 4; j++) { const y = top + j * (bottom - top) / 4; append(graph, svg('line', { x1: left, x2: right, y1: y, y2: y, stroke: '#e4ecee' })); svgText(graph, left - 7, y + 4, fmt(ymax - j * (ymax - ymin) / 4, Math.min(digits, 3)), 'end'); }
  for (const s of simplified) {
    append(graph, svg('polyline', { points: s.points.map(p => `${px(p.x)},${py(p.y)}`).join(' '), fill: 'none', stroke: s.color, 'stroke-width': s.name === 'Solución analítica' ? 2 : 2.8, 'stroke-dasharray': s.name === 'Solución analítica' ? '5 4' : 'none' }));
    if (s.points.length <= 40) for (const p of s.points) {
      const marker = svg('circle', { cx: px(p.x), cy: py(p.y), r: 3.5, fill: s.color, tabindex: 0 });
      append(marker, append(svg('title'), document.createTextNode(`${s.name}: x=${fmt(p.x, digits)}, ${isError ? '|error|' : 'y'}=${fmt(p.y, digits)}`)));
      append(graph, marker);
    }
  }
  svgText(graph, left, 290, fmt(xmin, Math.min(digits, 2))); svgText(graph, right, 290, fmt(xmax, Math.min(digits, 2)), 'end');
  append(box, graph, el('p', 'chart-caption', `${series.map(s => s.name).join(' · ')}. ${isError ? 'Cada punto expresa una diferencia absoluta; no representa una cota garantizada.' : 'El eje horizontal es x y el vertical es y. Las líneas unen las aproximaciones sucesivas; no representan áreas.'}${series.some(s => s.points.length > 600) ? ' La gráfica muestra una selección de puntos; el cálculo y el procedimiento conservan todos.' : ''}`));
  return box;
}

function convergenceCard(solutions, f, exact, digits) {
  const box = card('convergence-card', 'Iteraciones y precisión');
  if (exact === null) { append(box, el('p', '', 'La relación entre n y el error verdadero requiere una solución analítica válida. Puedes comparar las trayectorias, pero no afirmar precisión exacta sin ella.')); return box; }
  const base = solutions[0].n, counts = [base, base * 2, base * 4].filter(n => n <= ODE_MAX_STEPS);
  if (counts.length < 2) { append(box, el('p', '', 'El límite de iteraciones no permite generar dos refinamientos para esta comparación.')); return box; }
  const { wrap, body } = makeTable(['Método', 'n', '|h|', 'y(x final)', 'Error absoluto', 'Error relativo %']);
  const points = [];
  for (const s of solutions) for (const n of counts) {
    const item = solveInitialValue(f, s.x0, s.y0, s.xf, { method: s.method, n });
    const target = exact(item.xf), error = errorAgainstReference(item.result, target);
    addRow(body, [methodName(s.method), n, fmt(Math.abs((s.xf - s.x0) / n), digits), fmt(item.result, digits), fmt(error.absolute, digits), error.relativePercent === null ? '—' : `${fmt(error.relativePercent, digits)} %`]);
    points.push({ method: s.method, n, error: error.absolute });
  }
  append(box, wrap, el('p', '', 'Refinamientos n, 2n y 4n. La comparación es empírica para este PVI; un menor paso no garantiza por sí solo ausencia de inestabilidad.'));
  const graph = svg('svg', { class: 'chart-svg', viewBox: '0 0 600 230', role: 'img', 'aria-label': 'Error absoluto frente al número de iteraciones' });
  const maxError = Math.max(...points.map(p => p.error), 1e-15), left = 50, right = 580, top = 25, bottom = 175;
  const px = n => left + (n - counts[0]) / (counts.at(-1) - counts[0]) * (right - left), py = error => bottom - error / maxError * (bottom - top);
  for (let j = 0; j <= 3; j++) { const y = top + j * (bottom - top) / 3; append(graph, svg('line', { x1: left, x2: right, y1: y, y2: y, stroke: '#e4ecee' })); }
  for (const s of solutions) {
    const subset = points.filter(p => p.method === s.method), color = s.method === 'euler' ? '#bd6435' : '#0c827c';
    append(graph, svg('polyline', { points: subset.map(p => `${px(p.n)},${py(p.error)}`).join(' '), fill: 'none', stroke: color, 'stroke-width': 2.7 }));
    subset.forEach(p => {
      const marker = svg('circle', { cx: px(p.n), cy: py(p.error), r: 4, fill: color, tabindex: 0 });
      append(marker, append(svg('title'), document.createTextNode(`${methodName(p.method)}: n=${p.n}, error=${fmt(p.error, digits)}`)));
      append(graph, marker);
    });
  }
  counts.forEach(n => svgText(graph, px(n), 205, String(n), 'middle'));
  append(box, graph, el('p', 'chart-caption', 'Eje horizontal: número de pasos. Eje vertical: error absoluto frente a la solución analítica ingresada.'));
  return box;
}

function interpretation(solutions, reference, digits, original) {
  const box = el('section', 'insight-card'); append(box, el('span', 'card-kicker', 'Interpretación y conclusión'), el('h3', '', 'Aproximación de la trayectoria'));
  let message = solutions.map(s => `${methodName(s.method)} estima y(${fmt(s.xf, digits)}) ≈ ${fmt(s.result, digits)}.`).join(' ');
  if (reference !== null && solutions.length === 2) {
    const [first, second] = solutions.map(s => errorAgainstReference(s.result, reference).absolute);
    message += first === second ? ' Ambos métodos tienen el mismo error absoluto en este caso.' : ` ${first < second ? 'Euler' : 'Heun'} obtuvo menor error absoluto para este paso. ${original ? 'Heun mejora aquí la estimación porque incorpora una pendiente estimada al final del paso y promedia ambas.' : 'Compara los errores para este PVI; el orden del método no garantiza que una sola prueba siempre sea más precisa.'}`;
  } else if (reference === null) message += ' Sin solución analítica no se conoce el error verdadero.';
  append(box, el('p', '', message)); return box;
}

function render(target, { solutions, exact, exactExpression, f, expression, digits, original }) {
  const reference = exact === null ? null : exact(solutions[0].xf);
  const items = [];
  if (original) items.push(originalDerivation());
  items.push(dataCard(solutions, expression, exactExpression, digits, original));
  solutions.forEach(s => items.push(resultCard(s, reference, digits, original)));
  items.push(comparisonCard(solutions, reference, digits, original));
  solutions.forEach(s => items.push(methodCard(s, expression, reference, digits)));
  items.push(chart(solutions, exact, digits), chart(solutions, exact, digits, 'error'), convergenceCard(solutions, f, exact, digits), interpretation(solutions, reference, digits, original));
  target.replaceChildren(...items);
}

function readNumber(value, label) {
  const trimmed = value.trim().replace(',', '.'); if (!trimmed) throw new Error(`Ingresa ${label}.`);
  const number = Number(trimmed); if (!Number.isFinite(number)) throw new Error(`${label} debe ser finito.`); return number;
}
function updateMode() {
  const byN = $('s14-step-mode').value === 'n'; $('s14-h').disabled = byN; $('s14-n').disabled = !byN;
}
let current = null;
function fullProcedure({ solutions, exact, expression, digits }) {
  const first = solutions[0], lines = [`PVI: y′ = ${expression}; y(${fmt(first.x0, digits)}) = ${fmt(first.y0, digits)}; x final = ${fmt(first.xf, digits)}.`, `n = ${first.n}; paso nominal = ${fmt(first.nominalStep, digits)}.`];
  if (first.lastStepAdjusted) lines.push(`Último paso ajustado a ${fmt(first.rows.at(-1).h, digits)} para llegar al destino.`);
  for (const s of solutions) {
    lines.push('', methodName(s.method), s.method === 'heun' ? 'zᵢ₊₁ = yᵢ+hᵢk₁; k₂ = f(xᵢ₊₁,zᵢ₊₁); yᵢ₊₁ = yᵢ+(hᵢ/2)(k₁+k₂).' : 'yᵢ₊₁ = yᵢ+hᵢf(xᵢ,yᵢ).');
    for (const r of s.rows) {
      lines.push(`Paso ${r.i + 1}: xᵢ=${fmt(r.x, digits)}, yᵢ=${fmt(r.y, digits)}, hᵢ=${fmt(r.h, digits)}.`);
      lines.push(`  k₁ = f(xᵢ,yᵢ) = ${substituted(expression, r.x, r.y, digits)} = ${fmt(r.k1, digits)}.`);
      lines.push(`  ${s.method === 'heun' ? 'Predictor z' : 'Actualización y'} = ${fmt(r.y, digits)} + ${fmt(r.h, digits)}·${fmt(r.k1, digits)} = ${fmt(r.predictor, digits)}.`);
      if (s.method === 'heun') lines.push(`  k₂ = f(${fmt(r.xNext, digits)}, ${fmt(r.predictor, digits)}) = ${substituted(expression, r.xNext, r.predictor, digits)} = ${fmt(r.k2, digits)}; corrector y = ${fmt(r.y, digits)} + (${fmt(r.h, digits)}/2)(${fmt(r.k1, digits)}+${fmt(r.k2, digits)}) = ${fmt(r.yNext, digits)}.`);
      lines.push(`  Nuevo punto: (${fmt(r.xNext, digits)}, ${fmt(r.yNext, digits)}).`);
    }
    lines.push(`Resultado ${methodName(s.method)}: y(${fmt(s.xf, digits)}) ≈ ${fmt(s.result, digits)}.`);
    if (exact) { const reference = exact(s.xf), error = errorAgainstReference(s.result, reference); lines.push(`Referencia analítica ingresada: ${fmt(reference, digits)}; diferencia absoluta: ${fmt(error.absolute, digits)}; porcentaje: ${error.relativePercent === null ? 'no definido' : `${fmt(error.relativePercent, digits)} %`}.`); }
  }
  return lines.join('\n');
}
function solve(event) {
  event?.preventDefault(); const error = $('s14-error'); error.hidden = true; error.textContent = ''; $('s14-status').textContent = '';
  try {
    const expression = $('s14-expression').value.trim(), f = compileOdeExpression(expression);
    const x0 = readNumber($('s14-x0').value, 'x₀'), y0 = readNumber($('s14-y0').value, 'y₀'), xf = readNumber($('s14-xf').value, 'x final');
    const digits = readNumber($('s14-decimals').value, 'los decimales'); if (!Number.isInteger(digits) || digits < 0 || digits > 12) throw new Error('Los decimales deben ser un entero entre 0 y 12.');
    const options = $('s14-step-mode').value === 'n' ? { n: readNumber($('s14-n').value, 'n') } : { h: readNumber($('s14-h').value, 'h') };
    const method = $('s14-method').value;
    if (!['both', 'euler', 'heun'].includes(method)) throw new Error('Selecciona un método válido.');
    const methods = method === 'both' ? ['euler', 'heun'] : [method];
    const solutions = methods.map(name => solveInitialValue(f, x0, y0, xf, { method: name, ...options }));
    const exactExpression = $('s14-exact').value.trim(), exact = exactExpression ? compileExpression(exactExpression) : null;
    if (exact) {
      const initialReference = exact(x0);
      if (Math.abs(initialReference - y0) > 1e-8 * Math.max(1, Math.abs(y0))) throw new Error('La solución analítica ingresada no cumple la condición inicial y(x₀)=y₀.');
      for (const row of solutions[0].rows) exact(row.xNext);
    }
    render($('s14-solver-output'), { solutions, exact, exactExpression, f, expression, digits, original: false });
    current = { solutions, exact, expression, digits };
    $('s14-print-full').textContent = fullProcedure(current);
  } catch (problem) {
    current = null; $('s14-print-full').textContent = '';
    error.textContent = problem.message; error.hidden = false;
    $('s14-solver-output').replaceChildren(append(el('div', 'empty-state'), el('h3', '', 'Revisa los datos del PVI'), el('p', '', problem.message)));
  }
}
function restore() {
  const s = session14.exercise;
  $('s14-expression').value = s.expression; $('s14-x0').value = String(s.x0); $('s14-y0').value = String(s.y0); $('s14-xf').value = String(s.xf);
  $('s14-method').value = 'both'; $('s14-step-mode').value = 'h'; $('s14-h').value = String(s.h); $('s14-n').value = '2'; $('s14-decimals').value = '9';
  $('s14-exact').value = 'sqrt(x^2/2+7/(2*x^2))'; updateMode(); solve();
}
function clear() {
  for (const id of ['s14-expression', 's14-x0', 's14-y0', 's14-xf', 's14-h', 's14-n', 's14-exact']) $(id).value = '';
  $('s14-method').value = 'both'; $('s14-step-mode').value = 'h'; $('s14-decimals').value = '9'; updateMode();
  $('s14-error').hidden = true; $('s14-status').textContent = '';
  current = null; $('s14-print-full').textContent = '';
  $('s14-solver-output').replaceChildren(append(el('div', 'empty-state'), el('span', '', 'y′'), el('h3', '', 'Entradas limpias'), el('p', '', 'Escribe un problema de valor inicial para comenzar.')));
  $('s14-expression').focus();
}
async function copyProcedure() {
  if (!current) { $('s14-status').textContent = 'Calcula primero un resultado para copiar.'; return; }
  try { await navigator.clipboard.writeText(fullProcedure(current)); $('s14-status').textContent = 'Procedimiento completo copiado al portapapeles.'; }
  catch { $('s14-status').textContent = 'No se pudo acceder al portapapeles. Selecciona y copia el procedimiento manualmente.'; }
}

const original = originalOdeExercise();
render($('s14-original-output'), { solutions: [original.euler, original.heun], exact: exactOriginal, exactExpression: '√(x²/2+7/(2x²))', f: originalSlope, expression: 'x/y−y/x', digits: 9, original: true });
$('s14-form').addEventListener('submit', solve);
$('s14-step-mode').addEventListener('change', updateMode);
$('s14-restore').addEventListener('click', restore);
$('s14-clear').addEventListener('click', clear);
$('s14-copy').addEventListener('click', copyProcedure);
$('s14-print').addEventListener('click', () => window.print());
restore();
