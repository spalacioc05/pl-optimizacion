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
    id: "three-variables-simplex",
    name: "Ejemplo con tres variables",
    description:
      "Caso validado para Simplex tabular donde el método gráfico se desactiva por tener tres variables de decisión.",
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
      "El óptimo tabular se alcanza con X1 = 2, X2 = 0 y X3 = 1, obteniendo Z = 13. El método gráfico se oculta porque el modelo no tiene exactamente dos variables de decisión.",
  },
];
