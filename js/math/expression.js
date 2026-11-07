// Parser de expresiones matemáticas. No ejecuta código proporcionado por el usuario.
const FUNCTIONS = Object.freeze({ sin: Math.sin, cos: Math.cos, tan: Math.tan, exp: Math.exp, sqrt: Math.sqrt, ln: Math.log, log: Math.log10, abs: Math.abs });
const PRECEDENCE = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 4 };

export function compileExpression(source) {
  if (typeof source !== 'string' || !source.trim()) throw new Error('Escribe una función matemática.');
  if (source.length > 300) throw new Error('La expresión supera 300 caracteres.');
  const input = source.replaceAll('π', 'pi').replaceAll('×', '*').replaceAll('÷', '/');
  const tokens = [];
  let cursor = 0;
  while (cursor < input.length) {
    if (/\s/.test(input[cursor])) { cursor++; continue; }
    const rest = input.slice(cursor);
    const number = rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
    if (number) {
      tokens.push({ type: 'number', value: Number(number[0]) });
      cursor += number[0].length;
    } else {
      const identifier = rest.match(/^[a-zA-Z]+/);
      if (identifier) {
        tokens.push({ type: 'name', value: identifier[0].toLowerCase() });
        cursor += identifier[0].length;
      } else if ('+-*/^(),'.includes(input[cursor])) {
        tokens.push({ type: input[cursor], value: input[cursor] });
        cursor++;
      } else {
        throw new Error(`Símbolo no permitido en la posición ${cursor + 1}: ${input[cursor]}`);
      }
    }
    if (tokens.length > 200) throw new Error('La expresión contiene demasiados elementos.');
  }
  let at = 0;
  const peek = () => tokens[at];
  const take = () => tokens[at++];
  const expect = type => { if (peek()?.type !== type) throw new Error(`Se esperaba «${type}».`); take(); };
  function parse(min = 0, depth = 0) {
    if (depth > 60) throw new Error('La expresión tiene demasiados niveles.');
    let token = take();
    if (!token) throw new Error('La expresión está incompleta.');
    let left;
    if (token.type === 'number') {
      if (!Number.isFinite(token.value)) throw new Error('Número no finito.');
      left = { kind: 'number', value: token.value };
    } else if (token.type === 'name') {
      if (token.value === 'x' || token.value === 't') left = { kind: 'variable' };
      else if (token.value === 'pi' || token.value === 'e') left = { kind: 'number', value: token.value === 'pi' ? Math.PI : Math.E };
      else if (Object.hasOwn(FUNCTIONS, token.value)) {
        expect('(');
        const argument = parse(0, depth + 1);
        expect(')');
        left = { kind: 'call', name: token.value, argument };
      } else throw new Error(`Nombre desconocido: ${token.value}. Usa x o t como variable.`);
    } else if (token.type === '(') {
      left = parse(0, depth + 1);
      expect(')');
    } else if (token.type === '+' || token.type === '-') {
      left = { kind: 'unary', op: token.type, argument: parse(3, depth + 1) };
    } else throw new Error(`Elemento inesperado: ${token.value}.`);

    while (peek() && Object.hasOwn(PRECEDENCE, peek().type) && PRECEDENCE[peek().type] > min) {
      token = take();
      const right = parse(token.type === '^' ? PRECEDENCE[token.type] - 1 : PRECEDENCE[token.type], depth + 1);
      left = { kind: 'binary', op: token.type, left, right };
    }
    return left;
  }
  const tree = parse();
  if (at !== tokens.length) throw new Error(`Elemento inesperado: ${peek().value}.`);
  function evaluate(node, value) {
    switch (node.kind) {
      case 'number': return node.value;
      case 'variable': return value;
      case 'unary': return node.op === '-' ? -evaluate(node.argument, value) : evaluate(node.argument, value);
      case 'call': return FUNCTIONS[node.name](evaluate(node.argument, value));
      case 'binary': {
        const a = evaluate(node.left, value), b = evaluate(node.right, value);
        if (node.op === '+') return a + b;
        if (node.op === '-') return a - b;
        if (node.op === '*') return a * b;
        if (node.op === '/') return a / b;
        return a ** b;
      }
      default: throw new Error('Expresión inválida.');
    }
  }
  return value => {
    if (!Number.isFinite(value)) throw new Error('El punto de evaluación debe ser finito.');
    const result = evaluate(tree, value);
    if (!Number.isFinite(result)) throw new Error(`La función no está definida o no es finita en ${value}.`);
    return result;
  };
}
