import test from 'node:test';
import assert from 'node:assert/strict';
import { compileExpression, compileOdeExpression } from '../js/math/expression.js';
import { solveInitialValue, errorAgainstReference } from '../js/math/ode.js';
import { session14, originalSlope, exactOriginal, originalOdeExercise } from '../js/sessions/session14.js';

const near = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≠ ${expected}`);

test('forma explícita y solución analítica del PVI original', () => {
  for (const [x, y] of [[1, 2], [1.1, 1.85], [1.2, 1.7]]) near(originalSlope(x, y), (x * x - y * y) / (x * y));
  near(exactOriginal(1), 2);
  near(exactOriginal(1.2), 1.7749804380768697);
  assert.equal(session14.exercise.h, .1);
});

test('Euler original: dos pendientes, iteraciones y errores', () => {
  const { euler, exact, eulerError } = originalOdeExercise();
  assert.equal(euler.n, 2);
  near(euler.rows[0].k1, -1.5);
  near(euler.rows[0].yNext, 1.85);
  near(euler.rows[1].k1, -1.087223587223587);
  near(euler.result, 1.7412776412776414);
  near(exact, 1.7749804380768697);
  near(eulerError.absolute, 0.033702796799228274);
  near(eulerError.relativePercent, 1.8987700414177011);
});

test('Heun original: predicción, corrección y error relativo', () => {
  const { heun, heunError, eulerError } = originalOdeExercise();
  near(heun.rows[0].k1, -1.5);
  near(heun.rows[0].predictor, 1.85);
  near(heun.rows[0].k2, -1.087223587223587);
  near(heun.rows[0].yNext, 1.8706388206388205);
  near(heun.rows[1].k1, -1.1125463334786483);
  near(heun.rows[1].predictor, 1.7593841872909557);
  near(heun.rows[1].k2, -0.7840966602820463);
  near(heun.result, 1.7758066709507858);
  near(heunError.absolute, 0.000826232873916144);
  near(heunError.relativePercent, 0.04654884393043446);
  assert.ok(heunError.absolute < eulerError.absolute);
});

test('PVI nuevos, parser seguro de x,y y compatibilidad con integración', () => {
  near(compileOdeExpression('exp(x+y)')(1, 0), Math.E);
  near(compileOdeExpression('cos(x*y)')(0, 2), 1);
  near(compileOdeExpression('sqrt(x+y)')(1, 3), 2);
  near(compileOdeExpression('y*(1-y)')(0, .5), .25);
  near(compileExpression('x^2')(2), 4);
  assert.throws(() => compileExpression('y'), /Nombre desconocido/);
  const linear = compileOdeExpression('x+y');
  near(solveInitialValue(linear, 0, 1, 1, { method: 'euler', h: .2 }).result, 2.97664);
  near(solveInitialValue(linear, 0, 1, 1, { method: 'heun', h: .2 }).result, 3.4054163264);
  near(solveInitialValue(compileOdeExpression('2*x*y'), 1, 1, 1.5, { method: 'euler', h: .1 }).result, 2.927812608);
  near(solveInitialValue(compileOdeExpression('exp(x+y)'), 1, 0, 1.2, { method: 'heun', h: .1 }).result, 0.8948160721983024);
  near(solveInitialValue(compileOdeExpression('x^2+y'), 0, 1, .2, { method: 'euler', n: 2 }).result, 1.211);
});

test('recorrido decreciente, n fijo y ajuste del último paso', () => {
  const backward = solveInitialValue(compileOdeExpression('x'), 1, 1, 0, { method: 'heun', n: 2 });
  near(backward.result, .5);
  near(backward.nominalStep, -.5);
  assert.deepEqual(backward.rows.map(r => r.xNext), [.5, 0]);
  const adjusted = solveInitialValue(() => 1, 0, 0, 1, { method: 'euler', h: .3 });
  assert.equal(adjusted.n, 4); assert.equal(adjusted.lastStepAdjusted, true);
  near(adjusted.rows.at(-1).h, .1); near(adjusted.result, 1);
  const fixed = solveInitialValue(() => 1, 0, 0, 1, { method: 'euler', n: 4 });
  near(fixed.rows[0].h, .25); assert.equal(fixed.lastStepAdjusted, false);
});

test('entradas inválidas y dominios producen errores controlados', () => {
  for (const expression of ['alert(1)', 'x;1', 'constructor', 'x.y', 'sin(']) assert.throws(() => compileOdeExpression(expression));
  assert.throws(() => solveInitialValue(compileOdeExpression('x/y'), 1, 0, 2, { h: .1 }), /nodo|pendiente inicial/);
  assert.throws(() => solveInitialValue(compileOdeExpression('sqrt(x+y)'), 0, -1, 1, { n: 2 }), /pendiente inicial/);
  assert.throws(() => solveInitialValue(compileOdeExpression('ln(x)'), -1, 0, 1, { n: 2 }));
  assert.throws(() => solveInitialValue(() => Infinity, 0, 1, 1, { n: 2 }));
  for (const options of [{ h: 0 }, { h: -1 }, { n: 0 }, { n: 1.5 }, { n: 10001 }, {}, { h: .1, n: 2 }]) assert.throws(() => solveInitialValue(() => 1, 0, 0, 1, options));
  assert.throws(() => solveInitialValue(() => 1, 0, 0, 0, { n: 2 }));
  assert.throws(() => solveInitialValue(() => 1, NaN, 0, 1, { n: 2 }));
  assert.throws(() => errorAgainstReference(Infinity, 1));
  assert.equal(errorAgainstReference(1, 0).relativePercent, null);
});
