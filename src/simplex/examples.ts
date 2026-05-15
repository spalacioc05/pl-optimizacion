import { ExampleProblem } from './simplexTypes';

export const exampleProblems: ExampleProblem[] = [
  {
    id: 'wyndor',
    title: 'Ejemplo 1: Wyndor Glass',
    description: 'Caso clásico de maximización con tres restricciones tipo ≤.',
    expectedSummary: 'Solución esperada: X1 = 2, X2 = 6, Z = 36.',
    problem: {
      optimizationType: 'max',
      objectiveCoefficients: [3, 5],
      constraints: [
        { coefficients: [1, 0], type: '<=', rhs: 4 },
        { coefficients: [0, 2], type: '<=', rhs: 12 },
        { coefficients: [3, 2], type: '<=', rhs: 18 },
      ],
    },
  },
  {
    id: 'word-light',
    title: 'Ejemplo 2: Word Light',
    description: 'Ejemplo de aula con tres restricciones y solución óptima interior.',
    expectedSummary: 'Solución esperada: X1 = 125, X2 = 25, Z = 175.',
    problem: {
      optimizationType: 'max',
      objectiveCoefficients: [1, 2],
      constraints: [
        { coefficients: [1, 3], type: '<=', rhs: 200 },
        { coefficients: [2, 2], type: '<=', rhs: 300 },
        { coefficients: [0, 1], type: '<=', rhs: 60 },
      ],
    },
  },
  {
    id: 'simplex-tabular-material',
    title: 'Ejemplo 3: Caso tabular del material',
    description: 'Ejemplo del material de clase usado aquí como caso tabular normal, aunque también aparezca más adelante en simplex revisado.',
    expectedSummary: 'Solución esperada: X1 = 3, X2 = 1.5, Z = 21.',
    problem: {
      optimizationType: 'max',
      objectiveCoefficients: [5, 4],
      constraints: [
        { coefficients: [6, 4], type: '<=', rhs: 24 },
        { coefficients: [1, 2], type: '<=', rhs: 6 },
        { coefficients: [-1, 1], type: '<=', rhs: 1 },
        { coefficients: [0, 1], type: '<=', rhs: 2 },
      ],
    },
  },
];
