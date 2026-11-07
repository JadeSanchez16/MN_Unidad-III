import test from 'node:test';
import assert from 'node:assert/strict';
import { compileExpression } from '../js/math/expression.js';
import { trapecio_compuesto, trapecio_detallado, convergence } from '../js/math/trapezoid.js';
import { originalExercise, exactTraffic, session12, trafficRate } from '../js/sessions/session12.js';

const near = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≠ ${expected}`);

test('ejercicio original: nodos, tasas, coeficientes y resultado', () => {
  const { detail } = originalExercise();
  near(detail.h, 3);
  assert.deepEqual(detail.rows.map(row => row.x), [0, 3, 6, 9, 12]);
  assert.deepEqual(detail.rows.map(row => row.coefficient), [1, 2, 2, 2, 1]);
  [11, 15.103846091, 7.459603111, 17.392959437, 16.049647464].forEach((value, i) => near(detail.rows[i].y, value, 1e-9));
  near(detail.result, 160.443697114, 1e-9);
  assert.equal(session12.exercise.n, 4);
});

test('convergencia y errores reales de los cinco valores requeridos', () => {
  const { convergence: rows, exact } = originalExercise();
  near(exactTraffic(), 166.396711877, 1e-9);
  near(exact, 166.396711877, 1e-9);
  const expected = [160.443697114, 165.530824072, 166.362626089, 166.388194635, 166.396626718];
  assert.deepEqual(rows.map(row => row.n), [4, 10, 50, 100, 1000]);
  rows.forEach((row, i) => {
    near(row.approximation, expected[i], 1e-9);
    near(row.absoluteError, Math.abs(exact - row.approximation));
    near(row.percentError, row.absoluteError / Math.abs(exact) * 100);
  });
  assert.ok(rows.every((row, i) => i === 0 || row.absoluteError < rows[i - 1].absoluteError));
});

test('trapecio compuesto reutilizable para n=1 y otras funciones', () => {
  near(trapecio_compuesto(x => x, 0, 2, 1), 2);
  near(trapecio_compuesto(x => x * x, 0, 2, 2), 3);
  near(trapecio_compuesto(trafficRate, 0, 12, 4), originalExercise().detail.result);
  const rows = convergence(x => x, 0, 2, [1, 5], 2);
  assert.deepEqual(rows.map(r => r.absoluteError), [0, 0]);
  assert.equal(convergence(x => x, 0, 2, [1], 0)[0].percentError, null);
  assert.equal(convergence(x => x, 0, 2, [1], null)[0].absoluteError, null);
});

test('analizador matemático: ejemplos y precedencia', () => {
  near(compileExpression('x^2 + 3*x + 1')(2), 11);
  near(compileExpression('sin(x)')(Math.PI / 2), 1);
  near(compileExpression('cos(x)')(0), 1);
  near(compileExpression('exp(x)')(1), Math.E);
  near(compileExpression('e^x')(1), Math.E);
  near(compileExpression('1/(1+x^2)')(1), .5);
  near(compileExpression('sqrt(1+x^2)')(2), Math.sqrt(5));
  near(compileExpression('ln(x)')(Math.E), 1);
  near(compileExpression('10+5*sin(pi*t/4)+exp(0.15*t)')(9), trafficRate(9));
  near(compileExpression('-2^2')(0), -4);
  near(compileExpression('(-2)^2')(0), 4);
  near(compileExpression('2^3^2')(0), 512);
  near(compileExpression('2^-3')(0), .125);
});

test('rechaza expresiones peligrosas, dominios y parámetros inválidos', () => {
  for (const expression of ['alert(1)', 'x;1', 'constructor', 'x.y', 'sin(', '2+']) assert.throws(() => compileExpression(expression));
  assert.throws(() => compileExpression('1/x')(0));
  assert.throws(() => compileExpression('ln(x)')(-1));
  assert.throws(() => compileExpression('sqrt(x)')(-1));
  assert.throws(() => trapecio_detallado(x => 1 / x, -1, 1, 2));
  for (const n of [0, -1, 1.5, 100001, NaN]) assert.throws(() => trapecio_compuesto(x => x, 0, 1, n));
  assert.throws(() => trapecio_compuesto(x => x, 1, 1, 4));
  assert.throws(() => trapecio_compuesto(x => x, 2, 1, 4));
  assert.throws(() => trapecio_compuesto(() => Infinity, 0, 1, 2));
});
