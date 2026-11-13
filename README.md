# Sistema de Métodos Numéricos

**Abrir la aplicación:** https://jadesanchez16.github.io/MN_Unidad-III/

Aplicación web para la Unidad III. La Sesión 12 contiene la regla del trapecio compuesto y el ejercicio original de tráfico de red. La Sesión 13 contiene Simpson 1/3 compuesto y el ejercicio original de consumo energético de un centro de datos. La Sesión 14 resuelve problemas de valor inicial con Euler y Euler mejorado (Heun), incluido el ejercicio original de la guía autónoma. Cada sesión tiene su propio procedimiento, tablas, gráficas y solucionador.

## Ejecutar

1. Abre esta carpeta en Visual Studio Code.
2. En PowerShell de Windows, ejecuta `npm.cmd start`. En otras terminales, usa `npm start`.
3. Abre la dirección local que aparece en la terminal (por defecto, `http://127.0.0.1:4173`).

No hay dependencias que instalar ni servicios externos. En PowerShell, ejecuta `npm.cmd test` para las pruebas matemáticas automatizadas. `npm.cmd` evita el bloqueo de `npm.ps1` sin cambiar la política de ejecución de PowerShell.

## Estructura

- `js/math/expression.js`: analizador seguro de expresiones matemáticas.
- `js/math/trapezoid.js`: cálculo reutilizable y análisis de convergencia.
- `js/math/simpson.js`: Simpson 1/3 compuesto, procedimiento y cotas de error.
- `js/math/ode.js`: cálculo de Euler y Heun para PVI de primer orden.
- `js/sessions/session12.js`, `js/sessions/session13.js` y `js/sessions/session14.js`: casos académicos originales independientes.
- `js/app.js`, `js/session13-app.js` y `js/session14-app.js`: interfaces de las tres sesiones.
- `tests/`: pruebas de referencia y casos inválidos.

Para añadir una sesión, crea un módulo propio en `js/sessions/` y registra su vista en la navegación. Conserva el cálculo compartido en `js/math/` y ejecuta las pruebas de regresión antes de cambiarlo.

Los solucionadores usan radianes y requieren multiplicación explícita (`3*x`). Admiten `x` o `t`, `pi`, `e`, `sin`, `cos`, `tan`, `exp`, `sqrt`, `ln`, `log`, `abs` y potencias con `^`. El máximo es 100000 subintervalos. Las tablas de nodos se paginan y los gráficos omiten las figuras de aproximación si hay más de 100 subintervalos; los cálculos sí utilizan todos los nodos. Simpson requiere n par. Una cota M ingresada por el usuario solo garantiza el error si se justifica en todo el intervalo. En el ejercicio original de la Sesión 13, M=0,45 se presenta con advertencia de que no es válida; también se muestra una cota conservadora demostrada.

El solucionador de la Sesión 14 acepta f(x,y), valores iniciales, destino y paso h o número n de pasos. Resuelve en ambos sentidos, ajusta el último paso cuando es necesario y muestra Euler, Heun o ambos. La expresión analítica opcional se utiliza como referencia proporcionada por el usuario; si falta, no se informa un error verdadero. El máximo es 10000 pasos. Los procedimientos extensos se consultan por grupos de ocho; la página también ofrece copia del procedimiento e impresión.
