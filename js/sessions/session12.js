import { trapecio_detallado, convergence } from '../math/trapezoid.js';

export const session12 = Object.freeze({
  id: 'sesion-12',
  title: 'Unidad 3 · Sesión 12: Integración numérica',
  exercise: Object.freeze({
    name: 'Estimación del tráfico de red en un servidor web',
    expression: '10+5*sin(pi*t/4)+exp(0.15*t)',
    a: 0, b: 12, n: 4, unit: 'Mb', variable: 't',
    convergenceN: Object.freeze([4, 10, 50, 100, 1000])
  })
});

export const trafficRate = t => 10 + 5 * Math.sin(Math.PI * t / 4) + Math.exp(0.15 * t);
export const exactTraffic = () => 120 + 40 / Math.PI + (Math.exp(1.8) - 1) / 0.15;
export function originalExercise() {
  const { a, b, n, convergenceN } = session12.exercise;
  const exact = exactTraffic();
  return { detail: trapecio_detallado(trafficRate, a, b, n), exact, convergence: convergence(trafficRate, a, b, [...convergenceN], exact) };
}
