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

await import('../js/app.js');
await import('../js/session13-app.js');

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
