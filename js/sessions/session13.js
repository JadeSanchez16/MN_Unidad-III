import { simpson_13_detallado, simpsonConvergence, simpsonErrorBound } from '../math/simpson.js';

export const session13 = Object.freeze({
  id: 'sesion-13',
  title: 'Unidad 3 · Sesión 13: Simpson 1/3 compuesto',
  exercise: Object.freeze({
    name: 'Estimación del consumo energético de un centro de datos para microservicios',
    expression: '10+5*t*sin(pi*t/6)+exp(0.2*t)',
    a: 0, b: 6, n: 6, suppliedM: 0.45,
    unit: 'kWh', variable: 't', convergenceN: Object.freeze([2, 4, 6, 12, 24])
  })
});

const k = Math.PI / 6;
export const powerRate = t => 10 + 5 * t * Math.sin(k * t) + Math.exp(0.2 * t);
export const exactEnergy = () => 60 + 180 / Math.PI + 5 * (Math.exp(1.2) - 1);
export const powerFourthDerivative = t => 5 * k ** 4 * t * Math.sin(k * t) - 20 * k ** 3 * Math.cos(k * t) + 0.0016 * Math.exp(0.2 * t);
// En [0,6]: |sin|≤1, |cos|≤1, t≤6 y exp(0.2t)≤exp(1.2).
// Es una cota demostrable por desigualdad triangular, no el máximo exacto.
export const conservativeFourthBound = () => 30 * k ** 4 + 20 * k ** 3 + 0.0016 * Math.exp(1.2);

export function originalSimpsonExercise() {
  const { a, b, n, suppliedM, convergenceN } = session13.exercise;
  const exact = exactEnergy();
  const validM = conservativeFourthBound();
  return {
    detail: simpson_13_detallado(powerRate, a, b, n), exact, validM,
    suppliedBound: simpsonErrorBound(a, b, n, suppliedM),
    validBound: simpsonErrorBound(a, b, n, validM),
    convergence: simpsonConvergence(powerRate, a, b, [...convergenceN], exact, validM),
    suppliedConvergence: simpsonConvergence(powerRate, a, b, [...convergenceN], exact, suppliedM)
  };
}
