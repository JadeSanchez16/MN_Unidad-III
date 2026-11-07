# Sistema de Métodos Numéricos

**Abrir la aplicación:** https://jadesanchez16.github.io/MN_Unidad-III/

Aplicación web para la Unidad III. La Sesión 12 incluye el ejercicio original de tráfico de red, la regla del trapecio compuesto, su procedimiento, gráficas y un solucionador para otras funciones.

## Ejecutar

1. Abre esta carpeta en Visual Studio Code.
2. En PowerShell de Windows, ejecuta `npm.cmd start`. En otras terminales, usa `npm start`.
3. Abre la dirección local que aparece en la terminal (por defecto, `http://127.0.0.1:4173`).

No hay dependencias que instalar ni servicios externos. En PowerShell, ejecuta `npm.cmd test` para las pruebas matemáticas automatizadas. `npm.cmd` evita el bloqueo de `npm.ps1` sin cambiar la política de ejecución de PowerShell.

## Estructura

- `js/math/expression.js`: analizador seguro de expresiones matemáticas.
- `js/math/trapezoid.js`: cálculo reutilizable y análisis de convergencia.
- `js/sessions/session12.js`: datos inmutables del ejercicio original de la sesión.
- `js/app.js`: interfaz de la Sesión 12 y componentes de presentación.
- `tests/`: pruebas de referencia y casos inválidos.

Para añadir una sesión, crea un módulo propio en `js/sessions/` y registra su vista en la navegación. Conserva el cálculo compartido en `js/math/` y ejecuta las pruebas de regresión antes de cambiarlo.

El solucionador usa radianes y requiere multiplicación explícita (`3*x`). Admite `x` o `t`, `pi`, `e`, `sin`, `cos`, `tan`, `exp`, `sqrt`, `ln`, `log`, `abs` y potencias con `^`. La cota de 100000 subintervalos evita bloquear el navegador con cálculos desmedidos. La tabla de nodos se pagina y los gráficos omiten trapecios si hay más de 100; los cálculos sí utilizan todos los nodos.
