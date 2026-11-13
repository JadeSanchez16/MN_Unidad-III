export const ODE_MAX_STEPS = 10000;

export function solveInitialValue(f, x0, y0, xf, { method = 'euler', h = null, n = null } = {}) {
  if (typeof f !== 'function') throw new TypeError('f(x,y) debe ser una función.');
  if (![x0, y0, xf].every(Number.isFinite)) throw new RangeError('x₀, y₀ y x final deben ser finitos.');
  if (xf === x0) throw new RangeError('x final debe ser distinto de x₀.');
  if (!['euler', 'heun'].includes(method)) throw new Error('Selecciona Euler o Euler mejorado (Heun).');
  if ((h === null) === (n === null)) throw new Error('Indica h o n, pero no ambos.');
  const distance = Math.abs(xf - x0), direction = Math.sign(xf - x0);
  let count, nominalStep, mode;
  if (n !== null) {
    if (!Number.isSafeInteger(n) || n < 1 || n > ODE_MAX_STEPS) throw new RangeError(`n debe ser un entero entre 1 y ${ODE_MAX_STEPS}.`);
    count = n; nominalStep = (xf - x0) / count; mode = 'n';
  } else {
    if (!Number.isFinite(h) || h <= 0) throw new RangeError('h debe ser un número finito y positivo; el sentido lo determinan x₀ y x final.');
    const ratio = distance / h;
    if (!Number.isFinite(ratio) || ratio > ODE_MAX_STEPS + 1e-10) throw new RangeError(`El recorrido supera ${ODE_MAX_STEPS} iteraciones.`);
    count = Math.max(1, Math.ceil(ratio - 1e-12));
    if (count > ODE_MAX_STEPS) throw new RangeError(`El recorrido supera ${ODE_MAX_STEPS} iteraciones.`);
    nominalStep = direction * h; mode = 'h';
  }
  if (!Number.isFinite(nominalStep) || nominalStep === 0) throw new RangeError('El paso calculado no es válido.');
  const rows = [];
  let y = y0;
  const slope = (x, value, label) => {
    let result;
    try { result = f(x, value); } catch (error) { throw new Error(`No se pudo evaluar f en ${label} (x=${x}, y=${value}): ${error.message}`); }
    if (!Number.isFinite(result)) throw new Error(`f no es finita en ${label} (x=${x}, y=${value}).`);
    return result;
  };
  for (let i = 0; i < count; i++) {
    const x = mode === 'n' ? x0 + i * nominalStep : x0 + direction * Math.min(i * h, distance);
    const xNext = i === count - 1 ? xf : mode === 'n' ? x0 + (i + 1) * nominalStep : x0 + direction * Math.min((i + 1) * h, distance);
    const step = xNext - x;
    if (!Number.isFinite(step) || step === 0 || Math.sign(step) !== direction) throw new Error(`El paso ${i + 1} no es representable con precisión numérica.`);
    const k1 = slope(x, y, `paso ${i + 1}, pendiente inicial`);
    const predictor = y + step * k1;
    if (!Number.isFinite(predictor)) throw new Error(`El predictor del paso ${i + 1} no es finito.`);
    const k2 = method === 'heun' ? slope(xNext, predictor, `paso ${i + 1}, pendiente final`) : null;
    const yNext = method === 'heun' ? y + step * (k1 + k2) / 2 : predictor;
    if (!Number.isFinite(yNext)) throw new Error(`El resultado del paso ${i + 1} no es finito.`);
    rows.push({ i, x, y, h: step, k1, predictor, k2, xNext, yNext });
    y = yNext;
  }
  const lastStepAdjusted = mode === 'h' && Math.abs(Math.abs(rows.at(-1).h) - h) > 1e-12 * Math.max(1, h);
  return { method, x0, y0, xf, mode, n: count, nominalStep, lastStepAdjusted, rows, result: y };
}

export function errorAgainstReference(approximation, reference) {
  if (!Number.isFinite(approximation) || !Number.isFinite(reference)) throw new RangeError('La aproximación y la referencia deben ser finitas.');
  const absolute = Math.abs(reference - approximation);
  return { absolute, relativePercent: reference === 0 ? null : absolute / Math.abs(reference) * 100 };
}
