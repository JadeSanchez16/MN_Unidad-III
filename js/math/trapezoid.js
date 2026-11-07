export function validateTrapezoidArgs(f, a, b, n) {
  if (typeof f !== 'function') throw new TypeError('f debe ser una función.');
  if (!Number.isFinite(a) || !Number.isFinite(b) || a >= b) throw new RangeError('Los límites deben ser finitos y cumplir a < b.');
  if (!Number.isSafeInteger(n) || n < 1 || n > 100000) throw new RangeError('n debe ser un entero entre 1 y 100000.');
  const h = (b - a) / n;
  if (!Number.isFinite(h) || h <= 0) throw new RangeError('El ancho h no es válido.');
  return h;
}

export function trapecio_detallado(f, a, b, n) {
  const h = validateTrapezoidArgs(f, a, b, n);
  const rows = [];
  let weightedSum = 0;
  let compensation = 0;
  for (let i = 0; i <= n; i++) {
    const x = i === n ? b : a + i * h;
    let y;
    try { y = f(x); } catch (error) { throw new Error(`No se pudo evaluar f en el nodo ${i} (x=${x}): ${error.message}`); }
    if (!Number.isFinite(y)) throw new Error(`f no es finita en el nodo ${i} (x=${x}).`);
    const coefficient = i === 0 || i === n ? 1 : 2;
    const contribution = coefficient * y;
    if (!Number.isFinite(contribution)) throw new Error(`La contribución del nodo ${i} no es finita.`);
    const corrected = contribution - compensation;
    const next = weightedSum + corrected;
    compensation = (next - weightedSum) - corrected;
    weightedSum = next;
    rows.push({ i, x, y, coefficient, contribution });
  }
  const result = h * weightedSum / 2;
  if (!Number.isFinite(result)) throw new Error('El resultado no es finito.');
  return { a, b, n, h, rows, weightedSum, result };
}

export function trapecio_compuesto(f, a, b, n) {
  const h = validateTrapezoidArgs(f, a, b, n);
  let sum = 0, compensation = 0;
  for (let i = 0; i <= n; i++) {
    const x = i === n ? b : a + i * h;
    let y;
    try { y = f(x); } catch (error) { throw new Error(`No se pudo evaluar f en el nodo ${i} (x=${x}): ${error.message}`); }
    if (!Number.isFinite(y)) throw new Error(`f no es finita en el nodo ${i} (x=${x}).`);
    const contribution = (i === 0 || i === n ? 1 : 2) * y;
    if (!Number.isFinite(contribution)) throw new Error(`La contribución del nodo ${i} no es finita.`);
    const corrected = contribution - compensation;
    const next = sum + corrected;
    compensation = (next - sum) - corrected;
    sum = next;
  }
  const result = h * sum / 2;
  if (!Number.isFinite(result)) throw new Error('El resultado no es finito.');
  return result;
}

export function convergence(f, a, b, values, exact = null) {
  if (!Array.isArray(values) || !values.length) throw new Error('Indica al menos un valor de n.');
  if (exact !== null && !Number.isFinite(exact)) throw new Error('El valor exacto debe ser finito.');
  return values.map(n => {
    const approximation = trapecio_compuesto(f, a, b, n);
    const absoluteError = exact === null ? null : Math.abs(exact - approximation);
    const percentError = exact === null || exact === 0 ? null : absoluteError / Math.abs(exact) * 100;
    return { n, h: (b - a) / n, approximation, absoluteError, percentError };
  });
}
