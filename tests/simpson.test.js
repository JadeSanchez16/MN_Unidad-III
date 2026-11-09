import test from 'node:test';
import assert from 'node:assert/strict';
import { compileExpression } from '../js/math/expression.js';
import { simpson_13_compuesto, simpson_13_detallado, simpsonConvergence, simpsonErrorBound } from '../js/math/simpson.js';
import { session13, powerRate, exactEnergy, powerFourthDerivative, conservativeFourthBound, originalSimpsonExercise } from '../js/sessions/session13.js';

const near = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≠ ${expected}`);

test('Sesión 13: malla, siete potencias, coeficientes y energía', () => {
  const { detail, exact } = originalSimpsonExercise();
  assert.equal(detail.h, 1);
  assert.deepEqual(detail.rows.map(r => r.x), [0, 1, 2, 3, 4, 5, 6]);
  assert.deepEqual([...detail.coefficients], [1, 4, 2, 4, 2, 4, 1]);
  const expected = [11, 13.721402758, 20.152078735, 26.822118800, 29.546049004, 25.218281828, 13.320116923];
  detail.rows.forEach((r, i) => { near(r.y, expected[i], 1e-9); near(r.contribution, r.coefficient * r.y); });
  near(detail.result, 128.921195317, 1e-9);
  near(simpson_13_compuesto(powerRate, 0, 6, 6), detail.result);
  near(exact, 128.896364127, 1e-9);
  near(exactEnergy(), 60 + 180 / Math.PI + 5 * (Math.exp(1.2) - 1));
  near(Math.abs(detail.result - exact), 0.024831190, 1e-9);
  assert.equal(session13.exercise.n, 6);
});

test('convergencia requerida y dos cotas diferenciadas', () => {
  const original = originalSimpsonExercise();
  assert.deepEqual(original.convergence.map(r => r.n), [2, 4, 6, 12, 24]);
  [131.608592124, 129.027507970, 128.921195317, 128.897878140, 128.896458176].forEach((value, i) => near(original.convergence[i].approximation, value, 1e-9));
  near(original.suppliedBound, 0.015);
  near(Math.abs(powerFourthDerivative(0)), 2.869351544, 1e-9);
  assert.ok(Math.abs(powerFourthDerivative(0)) > session13.exercise.suppliedM);
  near(original.validM, 5.131103802, 1e-9);
  near(original.validBound, 0.171036793, 1e-9);
  assert.ok(original.validBound > Math.abs(original.detail.result - original.exact));
  original.convergence.forEach((r, i) => {
    near(r.bound, simpsonErrorBound(0, 6, r.n, conservativeFourthBound()));
    near(original.suppliedConvergence[i].bound, simpsonErrorBound(0, 6, r.n, .45));
    assert.ok(r.bound > r.absoluteError);
  });
});

test('Simpson 1/3 reutilizable con funciones diversas', () => {
  const cases = [
    ['x^2 + 3*x + 1', 0, 2, 2, 32 / 3],
    ['x^4', 0, 1, 24, .2],
    ['sin(x)', 0, Math.PI, 24, 2],
    ['cos(x)', 0, Math.PI / 2, 24, 1],
    ['exp(x)', 0, 1, 24, Math.E - 1],
    ['e^x', 0, 1, 24, Math.E - 1],
    ['ln(x)', 1, 2, 24, 2 * Math.LN2 - 1],
    ['1/(1+x^2)', 0, 1, 24, Math.PI / 4],
    ['sqrt(1+x^2)', 0, 1, 24, (Math.SQRT2 + Math.asinh(1)) / 2],
    [session13.exercise.expression, 0, 6, 6, originalSimpsonExercise().detail.result]
  ];
  cases.forEach(([expression, a, b, n, expected]) => {
    const actual = simpson_13_compuesto(compileExpression(expression), a, b, n);
    near(actual, expected, expression === 'x^2 + 3*x + 1' || n === 6 ? 1e-12 : 1e-5);
  });
  const rows = simpsonConvergence(x => x ** 3, 0, 1, [2, 4], .25, 0);
  assert.deepEqual(rows.map(r => r.absoluteError), [0, 0]);
  assert.deepEqual(rows.map(r => r.bound), [0, 0]);
  assert.equal(simpsonConvergence(x => x, 0, 1, [2], null, null)[0].absoluteError, null);
});

test('rechaza n impar, dominios inválidos y valores no finitos', () => {
  for (const n of [0, 1, 3, -2, 2.5, 100002, NaN]) assert.throws(() => simpson_13_compuesto(x => x, 0, 1, n), /entero positivo y par/);
  for (const [a, b] of [[1, 1], [2, 1], [NaN, 1], [0, Infinity]]) assert.throws(() => simpson_13_compuesto(x => x, a, b, 2));
  assert.throws(() => simpson_13_compuesto(compileExpression('1/x'), -1, 1, 2), /nodo 1/);
  assert.throws(() => simpson_13_compuesto(compileExpression('ln(x)'), -1, 1, 2));
  assert.throws(() => simpson_13_compuesto(() => Infinity, 0, 1, 2));
  assert.throws(() => simpson_13_detallado(null, 0, 1, 2));
  assert.throws(() => simpsonErrorBound(0, 1, 2, -1));
  assert.throws(() => simpsonConvergence(x => x, 0, 1, [2, 3]));
});
