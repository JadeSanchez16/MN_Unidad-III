export function validateSimpsonArgs(f, a, b, n) {
  if (typeof f !== 'function') throw new TypeError('f debe ser una función matemática.');
  if (!Number.isFinite(a) || !Number.isFinite(b) || a >= b) throw new RangeError('Los límites deben ser finitos y cumplir a < b.');
  if (!Number.isSafeInteger(n) || n < 2 || n > 100000 || n % 2 !== 0) {
    throw new RangeError('n debe ser un entero positivo y par entre 2 y 100000.');
  }
  const h = (b - a) / n;
  if (!Number.isFinite(h) || h <= 0) throw new RangeError('El ancho h no es válido.');
  return h;
}

function calculate(f, a, b, n, detailed) {
  const h = validateSimpsonArgs(f, a, b, n);
  const coefficients = new Uint8Array(n + 1);
  const rows = detailed ? [] : null;
  let weightedSum = 0, compensation = 0, oddSum = 0, evenSum = 0;
  for (let i = 0; i <= n; i++) {
    const x = i === n ? b : a + i * h;
    let y;
    try { y = f(x); } catch (error) { throw new Error(`No se pudo evaluar f en el nodo ${i} (x=${x}): ${error.message}`); }
    if (!Number.isFinite(y)) throw new Error(`f no es finita en el nodo ${i} (x=${x}).`);
    const coefficient = i === 0 || i === n ? 1 : i % 2 ? 4 : 2;
    coefficients[i] = coefficient;
    const contribution = coefficient * y;
    if (!Number.isFinite(contribution)) throw new Error(`La contribución del nodo ${i} no es finita.`);
    const corrected = contribution - compensation;
    const next = weightedSum + corrected;
    compensation = (next - weightedSum) - corrected;
    weightedSum = next;
    if (i > 0 && i < n) {
      if (i % 2) oddSum += y;
      else evenSum += y;
    }
    if (detailed) rows.push({ i, x, y, coefficient, contribution });
  }
  const result = h * weightedSum / 3;
  if (!Number.isFinite(result) || !Number.isFinite(oddSum) || !Number.isFinite(evenSum)) throw new Error('El resultado o una suma intermedia no es finita.');
  return detailed ? { a, b, n, h, rows, coefficients, oddSum, evenSum, weightedSum, result } : result;
}

export const simpson_13_compuesto = (f, a, b, n) => calculate(f, a, b, n, false);
export const simpson_13_detallado = (f, a, b, n) => calculate(f, a, b, n, true);

export function simpsonErrorBound(a, b, n, M) {
  const h = validateSimpsonArgs(() => 0, a, b, n);
  if (!Number.isFinite(M) || M < 0) throw new RangeError('M debe ser una cota finita y no negativa.');
  const bound = (b - a) * h ** 4 * M / 180;
  if (!Number.isFinite(bound)) throw new Error('La cota calculada no es finita.');
  return bound;
}

export function simpsonConvergence(f, a, b, values, exact = null, M = null) {
  if (!Array.isArray(values) || values.length > 20) throw new Error('Indica hasta 20 valores de n.');
  if (exact !== null && !Number.isFinite(exact)) throw new Error('El valor de referencia debe ser finito.');
  return values.map(n => {
    const approximation = simpson_13_compuesto(f, a, b, n);
    const absoluteError = exact === null ? null : Math.abs(exact - approximation);
    return {
      n, h: (b - a) / n, approximation,
      bound: M === null ? null : simpsonErrorBound(a, b, n, M),
      absoluteError,
      percentError: exact === null || exact === 0 ? null : absoluteError / Math.abs(exact) * 100
    };
  });
}
