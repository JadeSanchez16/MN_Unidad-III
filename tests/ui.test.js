import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

class Element {
  constructor(tagName) { this.tagName = tagName; this.children = []; this.events = {}; this.value = ''; this.hidden = false; this.disabled = false; this.className = ''; this.ownText = ''; this.attributes = {}; }
  set textContent(value) { this.ownText = String(value); this.children = []; }
  get textContent() { return this.ownText + this.children.map(child => child.textContent).join(''); }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.ownText = ''; this.children = children; }
  setAttribute(key, value) { this.attributes[key] = value; }
  addEventListener(name, handler) { this.events[name] = handler; }
  focus() { this.focused = true; }
  select() { this.selected = true; }
}

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const elements = new Map();
for (const match of html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)) {
  const node = new Element(match[0].slice(1).split(/[\s>]/)[0]);
  node.value = match[0].match(/\bvalue="([^"]*)"/)?.[1] ?? '';
  elements.set(match[1], node);
}
globalThis.document = {
  getElementById(id) { const node = elements.get(id); if (!node) throw new Error(`Falta #${id}`); return node; },
  createElement: tag => new Element(tag),
  createElementNS: (_, tag) => new Element(tag),
  createTextNode: content => { const node = new Element('#text'); node.textContent = content; return node; }
};
globalThis.window = { print() { globalThis.__printCalled = true; } };
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { clipboard: { async writeText(value) { globalThis.__copied = value; } } } });

await import('../js/app.js');
await import('../js/session13-app.js');
await import('../js/session14-app.js');

const byId = id => elements.get(id);
const descendants = node => [node, ...node.children.flatMap(descendants)];

test('ambas sesiones se renderizan al abrir y Simpson dibuja parábolas', () => {
  assert.match(byId('original-output').textContent, /160[.,]443697114/);
  assert.match(byId('s13-original-output').textContent, /128[.,]921195317/);
  assert.match(byId('s13-original-output').textContent, /0[.,]015 kWh/);
  assert.match(byId('s13-original-output').textContent, /0[.,]171036793/);
  const s13 = descendants(byId('s13-original-output'));
  assert.ok(s13.some(node => node.tagName === 'path' && node.attributes.d?.includes(' L ')), 'se dibujan interpolantes cuadráticos');
  const s12 = descendants(byId('original-output'));
  assert.ok(s12.some(node => node.tagName === 'polygon'), 'el gráfico del trapecio permanece');
});

test('calcular, modificar, limpiar y restaurar afectan solo al solucionador Simpson', () => {
  const protectedText = byId('s13-original-output').textContent;
  byId('s13-modify').events.click();
  assert.equal(byId('s13-expression').focused, true);
  byId('s13-expression').value = 'x^2'; byId('s13-lower').value = '0'; byId('s13-upper').value = '2';
  byId('s13-intervals').value = '2'; byId('s13-exact').value = String(8 / 3); byId('s13-M').value = '0'; byId('s13-n-values').value = '2, 4';
  byId('s13-form').events.submit({ preventDefault() {} });
  assert.equal(byId('s13-error').hidden, true);
  assert.match(byId('s13-solver-output').textContent, /2[.,]666666667/);
  assert.equal(byId('s13-original-output').textContent, protectedText);
  byId('s13-clear').events.click();
  assert.equal(byId('s13-expression').value, '');
  assert.match(byId('s13-solver-output').textContent, /Entradas limpias/);
  byId('s13-restore').events.click();
  assert.equal(byId('s13-expression').value, '10+5*t*sin(pi*t/6)+exp(0.2*t)');
  assert.match(byId('s13-solver-output').textContent, /128[.,]921195317/);
});

test('n impar muestra error controlado y paginación funciona', () => {
  byId('s13-intervals').value = '3';
  byId('s13-form').events.submit({ preventDefault() {} });
  assert.equal(byId('s13-error').hidden, false);
  assert.match(byId('s13-error').textContent, /entero positivo y par/);
  byId('s13-restore').events.click();
  byId('s13-intervals').value = '50'; byId('s13-n-values').value = '';
  byId('s13-form').events.submit({ preventDefault() {} });
  const buttons = descendants(byId('s13-solver-output')).filter(node => node.tagName === 'button');
  const next = buttons.find(node => node.textContent === 'Siguiente');
  assert.ok(next, 'la tabla de 51 nodos se pagina');
  next.events.click();
  assert.match(byId('s13-solver-output').textContent, /Filas 21–40 de 51/);
  assert.match(byId('original-output').textContent, /160[.,]443697114/);
});

test('Sesión 14 inicia con ambos métodos, solución exacta y curvas de trayectoria', () => {
  const text = byId('s14-original-output').textContent;
  assert.match(text, /1[.,]741277641/);
  assert.match(text, /1[.,]775806671/);
  assert.match(text, /1[.,]774980438/);
  assert.match(text, /1[.,]898770041/);
  assert.match(text, /0[.,]046548844/);
  assert.match(text, /Factor integrante/);
  assert.ok(descendants(byId('s14-original-output')).filter(node => node.tagName === 'polyline').length >= 3);
  assert.ok(html.includes('href="#sesion14"'));
});

test('solucionador EDO cambia de problema sin alterar los tres casos originales', () => {
  const original14 = byId('s14-original-output').textContent;
  byId('s14-expression').value = 'x+y'; byId('s14-x0').value = '0'; byId('s14-y0').value = '1'; byId('s14-xf').value = '1';
  byId('s14-h').value = '0.2'; byId('s14-exact').value = '2*exp(x)-x-1'; byId('s14-method').value = 'both';
  byId('s14-form').events.submit({ preventDefault() {} });
  assert.equal(byId('s14-error').hidden, true);
  assert.match(byId('s14-solver-output').textContent, /2[.,]97664/);
  assert.match(byId('s14-solver-output').textContent, /3[.,]405416326/);
  assert.equal(byId('s14-original-output').textContent, original14);
  assert.match(byId('original-output').textContent, /160[.,]443697114/);
  assert.match(byId('s13-original-output').textContent, /128[.,]921195317/);
});

test('modo n, sentido decreciente, dominio, paginación y botones EDO', async () => {
  byId('s14-expression').value = 'x'; byId('s14-x0').value = '1'; byId('s14-y0').value = '1'; byId('s14-xf').value = '0';
  byId('s14-method').value = 'heun'; byId('s14-step-mode').value = 'n'; byId('s14-step-mode').events.change();
  assert.equal(byId('s14-h').disabled, true); assert.equal(byId('s14-n').disabled, false);
  byId('s14-n').value = '20'; byId('s14-exact').value = '0.5+x^2/2';
  byId('s14-form').events.submit({ preventDefault() {} });
  assert.equal(byId('s14-error').hidden, true);
  assert.match(byId('s14-solver-output').textContent, /0[.,]500/);
  const next = descendants(byId('s14-solver-output')).find(node => node.tagName === 'button' && node.textContent === 'Siguiente');
  assert.ok(next); next.events.click();
  assert.match(byId('s14-solver-output').textContent, /Iteraciones 9–16 de 20/);
  await byId('s14-copy').events.click();
  assert.match(globalThis.__copied, /Paso 20:/);
  byId('s14-print').events.click(); assert.equal(globalThis.__printCalled, true);
  byId('s14-expression').value = '1/(x-y)'; byId('s14-x0').value = '1'; byId('s14-y0').value = '1';
  byId('s14-form').events.submit({ preventDefault() {} });
  assert.equal(byId('s14-error').hidden, false);
  byId('s14-expression').value = 'x'; byId('s14-exact').value = 'x^2+1';
  byId('s14-form').events.submit({ preventDefault() {} });
  assert.match(byId('s14-error').textContent, /no cumple la condición inicial/);
  byId('s14-clear').events.click(); assert.equal(byId('s14-expression').value, '');
  assert.match(byId('s14-solver-output').textContent, /Entradas limpias/);
  byId('s14-restore').events.click();
  assert.equal(byId('s14-expression').value, 'x/y-y/x');
  assert.match(byId('s14-solver-output').textContent, /1[.,]775806671/);
});

test('paso final ajustado y ausencia de referencia se explican en la interfaz', () => {
  byId('s14-expression').value = '1'; byId('s14-x0').value = '0'; byId('s14-y0').value = '0'; byId('s14-xf').value = '1';
  byId('s14-method').value = 'euler'; byId('s14-step-mode').value = 'h'; byId('s14-step-mode').events.change();
  byId('s14-h').value = '0.3'; byId('s14-exact').value = '';
  byId('s14-form').events.submit({ preventDefault() {} });
  assert.equal(byId('s14-error').hidden, true);
  assert.match(byId('s14-solver-output').textContent, /último paso se ajustó a 0[.,]100/);
  assert.match(byId('s14-solver-output').textContent, /Sin solución analítica no se conoce el error verdadero/);
  assert.match(byId('s14-solver-output').textContent, /y\(1[.,]000\) ≈ 1[.,]000/);
  byId('s14-restore').events.click();
});
