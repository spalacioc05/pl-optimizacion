import type { ExampleModel } from "@/lib/linear-programming/types";

export const exampleModels: ExampleModel[] = [
  {
    id: "wyndor",
    name: "Wyndor Glass",
    description:
      "Caso clásico del material de clase con tres restricciones y resolución tabular y gráfica.",
    variables: ["X1", "X2"],
    objective: { type: "max", coefficients: [3, 5] },
    constraints: [
      { coefficients: [1, 0], operator: "<=", rhs: 4 },
      { coefficients: [0, 2], operator: "<=", rhs: 12 },
      { coefficients: [3, 2], operator: "<=", rhs: 18 },
    ],
    expectedSolution: {
      variables: { X1: 2, X2: 6 },
      slacks: { S1: 2, S2: 0, S3: 0 },
      z: 36,
    },
    interpretation:
      "Se deben producir 2 lotes del producto 1 y 6 lotes del producto 2. La utilidad máxima es 36. La primera restricción queda con holgura de 2 unidades y las restricciones 2 y 3 se utilizan completamente.",
  },
  {
    id: "word-light",
    name: "Word Light",
    description:
      "Ejemplo algebraico de las diapositivas con solución óptima en el punto (125, 25).",
    variables: ["X1", "X2"],
    objective: { type: "max", coefficients: [1, 2] },
    constraints: [
      { coefficients: [1, 3], operator: "<=", rhs: 200 },
      { coefficients: [2, 2], operator: "<=", rhs: 300 },
      { coefficients: [0, 1], operator: "<=", rhs: 60 },
    ],
    expectedSolution: {
      variables: { X1: 125, X2: 25 },
      slacks: { S1: 0, S2: 0, S3: 35 },
      z: 175,
    },
    interpretation:
      "La empresa debe fabricar 125 unidades del producto 1 y 25 unidades del producto 2 para obtener una ganancia máxima de 175. Las restricciones 1 y 2 se utilizan completamente, y la tercera restricción queda con una holgura de 35 unidades.",
  },
  {
    id: "simplex-tabular-material",
    name: "Caso tabular del material",
    description:
      "Ejemplo adicional del material de clase validado con el solver tabular y gráfico actual.",
    variables: ["X1", "X2"],
    objective: { type: "max", coefficients: [5, 4] },
    constraints: [
      { coefficients: [6, 4], operator: "<=", rhs: 24 },
      { coefficients: [1, 2], operator: "<=", rhs: 6 },
      { coefficients: [-1, 1], operator: "<=", rhs: 1 },
      { coefficients: [0, 1], operator: "<=", rhs: 2 },
    ],
    expectedSolution: {
      variables: { X1: 3, X2: 1.5 },
      slacks: { S1: 0, S2: 0, S3: 2.5, S4: 0.5 },
      z: 21,
    },
    interpretation:
      "El óptimo se obtiene en X1 = 3 y X2 = 1.5, con Z = 21. Las restricciones 1 y 2 quedan activas, mientras las restricciones 3 y 4 conservan holguras positivas.",
  },
  {
    id: "mesas-sillas",
    name: "Producción de mesas y sillas",
    description:
      "Modelo de producción con dos variables para comparar solución tabular, gráfica y sensibilidad de recursos.",
    variables: ["X1", "X2"],
    objective: { type: "max", coefficients: [40, 30] },
    constraints: [
      { coefficients: [2, 1], operator: "<=", rhs: 100 },
      { coefficients: [1, 1], operator: "<=", rhs: 80 },
      { coefficients: [1, 0], operator: "<=", rhs: 40 },
    ],
    expectedSolution: {
      variables: { X1: 20, X2: 60 },
      slacks: { S1: 0, S2: 0, S3: 20 },
      z: 2600,
    },
    interpretation:
      "La producción óptima es de 20 mesas y 60 sillas, con utilidad máxima de 2600. Las dos primeras restricciones quedan activas y la tercera conserva 20 unidades disponibles.",
  },
  {
    id: "min-compatible-basic",
    name: "Minimización simple compatible",
    description:
      "Caso introductorio de minimización con restricciones <= y lado derecho positivo, compatible con la transformación interna del solver.",
    variables: ["X1", "X2"],
    objective: { type: "min", coefficients: [4, 6] },
    constraints: [
      { coefficients: [1, 1], operator: "<=", rhs: 10 },
      { coefficients: [2, 1], operator: "<=", rhs: 14 },
      { coefficients: [1, 3], operator: "<=", rhs: 18 },
    ],
    expectedSolution: {
      variables: { X1: 0, X2: 0 },
      slacks: { S1: 10, S2: 14, S3: 18 },
      z: 0,
    },
    interpretation:
      "Como el origen pertenece a la región factible y todos los coeficientes de la función objetivo son positivos, el mínimo global se alcanza en X1 = 0 y X2 = 0, con Z = 0. Es un caso introductorio útil para verificar la minimización compatible con el solver actual.",
  },
  {
    id: "min-three-variables-equivalent",
    name: "Minimización 3D equivalente",
    description:
      "Ejemplo de minimización con tres variables y coeficientes negativos para validar la transformación interna sin perder la vista 3D.",
    variables: ["X1", "X2", "X3"],
    objective: { type: "min", coefficients: [-5, -4, -3] },
    constraints: [
      { coefficients: [2, 3, 1], operator: "<=", rhs: 5 },
      { coefficients: [4, 1, 2], operator: "<=", rhs: 11 },
      { coefficients: [3, 4, 2], operator: "<=", rhs: 8 },
    ],
    expectedSolution: {
      variables: { X1: 2, X2: 0, X3: 1 },
      slacks: { S1: 0, S2: 1, S3: 0 },
      z: -13,
    },
    interpretation:
      "El modelo se ingresa como minimización y se transforma internamente a una maximización equivalente. El mínimo global se alcanza en X1 = 2, X2 = 0 y X3 = 1, con Z = -13, manteniendo la lectura geométrica en 3D.",
  },
  {
    id: "three-variables-simplex",
    name: "Producción con 3 variables",
    description:
      "Caso validado para Simplex tabular con visualización tridimensional del espacio factible.",
    variables: ["X1", "X2", "X3"],
    objective: { type: "max", coefficients: [5, 4, 3] },
    constraints: [
      { coefficients: [2, 3, 1], operator: "<=", rhs: 5 },
      { coefficients: [4, 1, 2], operator: "<=", rhs: 11 },
      { coefficients: [3, 4, 2], operator: "<=", rhs: 8 },
    ],
    expectedSolution: {
      variables: { X1: 2, X2: 0, X3: 1 },
      slacks: { S1: 0, S2: 1, S3: 0 },
      z: 13,
    },
    interpretation:
      "El óptimo tabular se alcanza con X1 = 2, X2 = 0 y X3 = 1, obteniendo Z = 13. La lectura geométrica se muestra en 3D porque el modelo tiene exactamente tres variables de decisión.",
  },
  {
    id: "four-variables-summary",
    name: "Modelo de 4 variables",
    description:
      "Caso tabular ampliado para validar el resumen visual algebraico cuando la dimensión supera el espacio 3D manejable en una carta cartesiana.",
    variables: ["X1", "X2", "X3", "X4"],
    objective: { type: "max", coefficients: [6, 4, 5, 3] },
    constraints: [
      { coefficients: [2, 1, 1, 1], operator: "<=", rhs: 20 },
      { coefficients: [1, 3, 2, 1], operator: "<=", rhs: 30 },
      { coefficients: [2, 2, 1, 3], operator: "<=", rhs: 25 },
    ],
    expectedSolution: {
      variables: { X1: 3.3333, X2: 0, X3: 13.3333, X4: 0 },
      slacks: { S1: 0, S2: 0, S3: 5 },
      z: 86.6667,
    },
    interpretation:
      "La solución óptima asigna X1 = 3.3333 y X3 = 13.3333, con Z = 86.6667. El aplicativo sustituye la gráfica cartesiana por un resumen visual con barras, holguras y mapa de calor de la matriz A.",
  },
  {
    id: "five-variables-summary",
    name: "Modelo de 5 variables",
    description:
      "Ejemplo con cuatro restricciones para verificar sensibilidad y resumen visual en una dimensión mayor que 3.",
    variables: ["X1", "X2", "X3", "X4", "X5"],
    objective: { type: "max", coefficients: [10, 8, 6, 7, 5] },
    constraints: [
      { coefficients: [2, 1, 1, 1, 1], operator: "<=", rhs: 40 },
      { coefficients: [1, 2, 1, 3, 1], operator: "<=", rhs: 60 },
      { coefficients: [3, 1, 2, 1, 2], operator: "<=", rhs: 50 },
      { coefficients: [1, 1, 1, 1, 1], operator: "<=", rhs: 30 },
    ],
    expectedSolution: {
      variables: { X1: 10, X2: 20, X3: 0, X4: 0, X5: 0 },
      slacks: { S1: 0, S2: 10, S3: 0, S4: 0 },
      z: 260,
    },
    interpretation:
      "El óptimo se obtiene con X1 = 10 y X2 = 20, alcanzando Z = 260. La segunda restricción conserva holgura y el resto queda activo en la base óptima.",
  },
  {
    id: "ten-variables-summary",
    name: "Modelo grande de 10 variables",
    description:
      "Caso grande para el trabajo final, pensado para comprobar que la app conserva claridad visual y estabilidad tabular con muchas variables.",
    variables: ["X1", "X2", "X3", "X4", "X5", "X6", "X7", "X8", "X9", "X10"],
    objective: { type: "max", coefficients: [5, 4, 6, 3, 7, 2, 8, 4, 5, 6] },
    constraints: [
      { coefficients: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], operator: "<=", rhs: 100 },
      { coefficients: [2, 1, 3, 1, 2, 1, 1, 2, 1, 1], operator: "<=", rhs: 150 },
      { coefficients: [1, 3, 1, 2, 1, 2, 3, 1, 2, 1], operator: "<=", rhs: 180 },
      { coefficients: [3, 1, 1, 1, 2, 3, 1, 1, 1, 2], operator: "<=", rhs: 160 },
    ],
    expectedSolution: {
      variables: {
        X1: 0,
        X2: 0,
        X3: 0,
        X4: 0,
        X5: 50,
        X6: 0,
        X7: 40,
        X8: 0,
        X9: 0,
        X10: 10,
      },
      slacks: { S1: 0, S2: 0, S3: 0, S4: 0 },
      z: 730,
    },
    interpretation:
      "La base óptima concentra la producción en X5 = 50, X7 = 40 y X10 = 10 para alcanzar Z = 730. Todas las restricciones quedan activas y se resume el modelo con visualizaciones algebraicas en lugar de una gráfica cartesiana.",
  },
];
