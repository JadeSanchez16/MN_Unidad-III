import { solveInitialValue, errorAgainstReference } from '../math/ode.js';

export const session14 = Object.freeze({
  id: 'sesion-14',
  title: 'Unidad 3 · Sesión 14: Ecuaciones diferenciales ordinarias',
  exercise: Object.freeze({
    name: 'PVI de la Guía de Aprendizaje Autónomo',
    differential: '(y² − x²)dx + xy dy = 0',
    expression: 'x/y-y/x',
    x0: 1, y0: 2, xf: 1.2, h: 0.1
  })
});

export function originalSlope(x, y) {
  if (x === 0 || y === 0) throw new Error('La forma explícita requiere x ≠ 0 e y ≠ 0.');
  return x / y - y / x;
}

export function exactOriginal(x) {
  if (!Number.isFinite(x) || x <= 0) throw new Error('La rama positiva del ejercicio original requiere x > 0.');
  return Math.sqrt(x * x / 2 + 7 / (2 * x * x));
}

export function originalOdeExercise() {
  const { x0, y0, xf, h } = session14.exercise;
  const euler = solveInitialValue(originalSlope, x0, y0, xf, { method: 'euler', h });
  const heun = solveInitialValue(originalSlope, x0, y0, xf, { method: 'heun', h });
  const exact = exactOriginal(xf);
  return { euler, heun, exact, eulerError: errorAgainstReference(euler.result, exact), heunError: errorAgainstReference(heun.result, exact) };
}
