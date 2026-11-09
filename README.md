# Sistema de Métodos Numéricos

**Abrir la aplicación:** https://jadesanchez16.github.io/MN_Unidad-III/

Aplicación web para la Unidad III. La Sesión 12 contiene la regla del trapecio compuesto y el ejercicio original de tráfico de red. La Sesión 13 contiene Simpson 1/3 compuesto y el ejercicio original de consumo energético de un centro de datos. Cada sesión tiene su propio procedimiento, tablas, gráficas y solucionador.

## Ejecutar

1. Abre esta carpeta en Visual Studio Code.
2. En PowerShell de Windows, ejecuta `npm.cmd start`. En otras terminales, usa `npm start`.
3. Abre la dirección local que aparece en la terminal (por defecto, `http://127.0.0.1:4173`).

No hay dependencias que instalar ni servicios externos. En PowerShell, ejecuta `npm.cmd test` para las pruebas matemáticas automatizadas. `npm.cmd` evita el bloqueo de `npm.ps1` sin cambiar la política de ejecución de PowerShell.

## Estructura

- `js/math/expression.js`: analizador seguro de expresiones matemáticas.
- `js/math/trapezoid.js`: cálculo reutilizable y análisis de convergencia.
- `js/math/simpson.js`: Simpson 1/3 compuesto, procedimiento y cotas de error.
- `js/sessions/session12.js` y `js/sessions/session13.js`: casos académicos originales independientes.
- `js/app.js` y `js/session13-app.js`: interfaces de las dos sesiones.
- `tests/`: pruebas de referencia y casos inválidos.

Para añadir una sesión, crea un módulo propio en `js/sessions/` y registra su vista en la navegación. Conserva el cálculo compartido en `js/math/` y ejecuta las pruebas de regresión antes de cambiarlo.

Los solucionadores usan radianes y requieren multiplicación explícita (`3*x`). Admiten `x` o `t`, `pi`, `e`, `sin`, `cos`, `tan`, `exp`, `sqrt`, `ln`, `log`, `abs` y potencias con `^`. El máximo es 100000 subintervalos. Las tablas de nodos se paginan y los gráficos omiten las figuras de aproximación si hay más de 100 subintervalos; los cálculos sí utilizan todos los nodos. Simpson requiere n par. Una cota M ingresada por el usuario solo garantiza el error si se justifica en todo el intervalo. En el ejercicio original de la Sesión 13, M=0,45 se presenta con advertencia de que no es válida; también se muestra una cota conservadora demostrada.
