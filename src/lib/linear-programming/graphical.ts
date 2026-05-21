import type {
  GraphicalLevelLine,
  GraphicalLine,
  GraphicalResult,
  GraphicalStage,
  GraphicalVertex,
  LinearProgrammingProblem,
} from "@/lib/linear-programming/types";
import {
  EPSILON,
  formatConstraint,
  formatNumber,
  roundForDisplay,
} from "@/lib/linear-programming/utils";

const uniquePoints = (points: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> => {
  return points.filter(
    (point, index) =>
      points.findIndex(
        (candidate) =>
          Math.abs(candidate.x - point.x) < 1e-6 && Math.abs(candidate.y - point.y) < 1e-6,
      ) === index,
  );
};

const isFeasiblePoint = (problem: LinearProgrammingProblem, x: number, y: number): boolean => {
  if (x < -EPSILON || y < -EPSILON) {
    return false;
  }

  return problem.constraints.every(
    (constraint) =>
      constraint.coefficients[0] * x + constraint.coefficients[1] * y <= constraint.rhs + EPSILON,
  );
};

const getIntersection = (
  first: { a: number; b: number; c: number },
  second: { a: number; b: number; c: number },
): { x: number; y: number } | null => {
  const determinant = first.a * second.b - second.a * first.b;
  if (Math.abs(determinant) < EPSILON) {
    return null;
  }

  const x = (first.c * second.b - second.c * first.b) / determinant;
  const y = (first.a * second.c - second.a * first.c) / determinant;
  return { x, y };
};

const buildConvexHull = (
  points: Array<{ x: number; y: number }>,
): Array<{ x: number; y: number }> => {
  if (points.length <= 1) {
    return points;
  }

  const sorted = [...points].sort((left, right) => left.x - right.x || left.y - right.y);
  const cross = (
    origin: { x: number; y: number },
    a: { x: number; y: number },
    b: { x: number; y: number },
  ) => (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x);

  const lower: Array<{ x: number; y: number }> = [];
  sorted.forEach((point) => {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], point) <= EPSILON
    ) {
      lower.pop();
    }
    lower.push(point);
  });

  const upper: Array<{ x: number; y: number }> = [];
  [...sorted].reverse().forEach((point) => {
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], point) <= EPSILON
    ) {
      upper.pop();
    }
    upper.push(point);
  });

  lower.pop();
  upper.pop();
  return [...lower, ...upper];
};

const getBoundarySegment = (
  coefficients: [number, number],
  rhs: number,
  xMax: number,
  yMax: number,
): [{ x: number; y: number }, { x: number; y: number }] => {
  const [a, b] = coefficients;
  if (Math.abs(a) < EPSILON) {
    const y = rhs / b;
    return [
      { x: 0, y },
      { x: xMax, y },
    ];
  }
  if (Math.abs(b) < EPSILON) {
    const x = rhs / a;
    return [
      { x, y: 0 },
      { x, y: yMax },
    ];
  }

  return [
    { x: 0, y: rhs / b },
    { x: rhs / a, y: 0 },
  ];
};

const getObjectiveLinePoints = (
  coefficients: [number, number],
  zValue: number,
  xMax: number,
  yMax: number,
): [{ x: number; y: number }, { x: number; y: number }] | null => {
  const [c1, c2] = coefficients;
  const points: Array<{ x: number; y: number }> = [];

  if (Math.abs(c1) > EPSILON) {
    points.push({ x: zValue / c1, y: 0 });
    points.push({ x: (zValue - c2 * yMax) / c1, y: yMax });
  }

  if (Math.abs(c2) > EPSILON) {
    points.push({ x: 0, y: zValue / c2 });
    points.push({ x: xMax, y: (zValue - c1 * xMax) / c2 });
  }

  const filtered = uniquePoints(points).filter(
    (point) =>
      point.x >= -EPSILON &&
      point.x <= xMax + EPSILON &&
      point.y >= -EPSILON &&
      point.y <= yMax + EPSILON,
  );

  if (filtered.length < 2) {
    return null;
  }

  return [filtered[0], filtered[1]];
};

const buildSingleVariableConstraintText = (
  coefficients: [number, number],
  rhs: number,
): {
  inequality: string;
  boundary: string;
  explanation: string;
  feasibleSideLabel: string;
} | null => {
  const [a, b] = coefficients;

  if (Math.abs(b) < EPSILON && Math.abs(a) > EPSILON) {
    const limit = rhs / a;
    const inequality = `X1 ≤ ${formatNumber(limit)}`;
    return {
      inequality,
      boundary: `X1 = ${formatNumber(limit)}`,
      explanation: `La restricción ${inequality} limita la región factible hacia la izquierda de la recta X1 = ${formatNumber(limit)}.`,
      feasibleSideLabel: `Lado permitido: X1 ≤ ${formatNumber(limit)}`,
    };
  }

  if (Math.abs(a) < EPSILON && Math.abs(b) > EPSILON) {
    const limit = rhs / b;
    const inequality = `X2 ≤ ${formatNumber(limit)}`;
    return {
      inequality,
      boundary: `X2 = ${formatNumber(limit)}`,
      explanation: `La restricción ${inequality} limita la región factible por debajo de la recta X2 = ${formatNumber(limit)}.`,
      feasibleSideLabel: `Lado permitido: X2 ≤ ${formatNumber(limit)}`,
    };
  }

  return null;
};

const buildConstraintLine = (
  problem: LinearProgrammingProblem,
  constraintIndex: number,
  xMax: number,
  yMax: number,
): GraphicalLine => {
  const constraint = problem.constraints[constraintIndex];
  const coefficients: [number, number] = [constraint.coefficients[0], constraint.coefficients[1]];
  const singleVariableText = buildSingleVariableConstraintText(coefficients, constraint.rhs);
  const defaultInequality = formatConstraint(constraint).replace(/<=/g, "≤");
  const intercepts = [
    Math.abs(coefficients[0]) > EPSILON
      ? {
          id: `constraint-${constraintIndex}-x`,
          x: roundForDisplay(constraint.rhs / coefficients[0]),
          y: 0,
          label: `(${formatNumber(constraint.rhs / coefficients[0])}, 0)`,
        }
      : null,
    Math.abs(coefficients[1]) > EPSILON
      ? {
          id: `constraint-${constraintIndex}-y`,
          x: 0,
          y: roundForDisplay(constraint.rhs / coefficients[1]),
          label: `(0, ${formatNumber(constraint.rhs / coefficients[1])})`,
        }
      : null,
  ].filter((intercept): intercept is NonNullable<typeof intercept> => intercept !== null);

  const label = singleVariableText?.inequality ?? defaultInequality;
  const explanation = singleVariableText
    ? singleVariableText.explanation
    : `La recta frontera ${defaultInequality.replace("≤", "=")} corta los ejes en ${intercepts
        .map((intercept) => intercept.label)
        .join(" y ")}. La región permitida queda por debajo de esta recta.`;

  return {
    id: `constraint-${constraintIndex}`,
    label,
    tooltip: `Restricción ${constraintIndex + 1}: ${label}`,
    explanation,
    feasibleSideLabel:
      singleVariableText?.feasibleSideLabel ?? `Lado permitido: ${defaultInequality}`,
    coefficients,
    rhs: constraint.rhs,
    points: getBoundarySegment(coefficients, constraint.rhs, xMax, yMax),
    intercepts,
  };
};

const getAxisBounds = (
  problem: LinearProgrammingProblem,
  vertices: Array<{ x: number; y: number }>,
) => {
  const xCandidates = [
    ...vertices.map((vertex) => vertex.x),
    ...problem.constraints
      .filter((constraint) => constraint.coefficients[0] > EPSILON)
      .map((constraint) => constraint.rhs / constraint.coefficients[0]),
  ];
  const yCandidates = [
    ...vertices.map((vertex) => vertex.y),
    ...problem.constraints
      .filter((constraint) => constraint.coefficients[1] > EPSILON)
      .map((constraint) => constraint.rhs / constraint.coefficients[1]),
  ];

  const xMax = Math.max(8, Math.ceil(Math.max(...xCandidates, 0) * 1.15));
  const yMax = Math.max(8, Math.ceil(Math.max(...yCandidates, 0) * 1.15));
  return { xMax, yMax };
};

export const solveGraphically = (problem: LinearProgrammingProblem): GraphicalResult => {
  if (problem.objectiveCoefficients.length !== 2) {
    return {
      available: false,
      message:
        "El método gráfico solo está disponible para problemas con dos variables de decisión.",
      lines: [],
      vertices: [],
      feasiblePolygon: [],
      levelLines: [],
      xMax: 0,
      yMax: 0,
      stages: [],
    };
  }

  const rawLines = problem.constraints.map((constraint, index) => ({
    a: constraint.coefficients[0],
    b: constraint.coefficients[1],
    c: constraint.rhs,
    label: formatConstraint(constraint).replace(/<=/g, "≤"),
  }));

  const candidatePoints: Array<{ x: number; y: number }> = [{ x: 0, y: 0 }];
  rawLines.forEach((line) => {
    if (Math.abs(line.a) > EPSILON) {
      candidatePoints.push({ x: line.c / line.a, y: 0 });
    }
    if (Math.abs(line.b) > EPSILON) {
      candidatePoints.push({ x: 0, y: line.c / line.b });
    }
  });

  for (let firstIndex = 0; firstIndex < rawLines.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < rawLines.length; secondIndex += 1) {
      const point = getIntersection(rawLines[firstIndex], rawLines[secondIndex]);
      if (point) {
        candidatePoints.push(point);
      }
    }
  }

  const feasibleCandidates = uniquePoints(candidatePoints)
    .filter((point) => isFeasiblePoint(problem, point.x, point.y))
    .map((point) => ({
      x: roundForDisplay(point.x),
      y: roundForDisplay(point.y),
      z: roundForDisplay(
        problem.objectiveCoefficients[0] * point.x + problem.objectiveCoefficients[1] * point.y,
      ),
    }));

  const hull = buildConvexHull(feasibleCandidates.map((vertex) => ({ x: vertex.x, y: vertex.y })));
  const hullVertices = hull
    .map((point) =>
      feasibleCandidates.find(
        (candidate) =>
          Math.abs(candidate.x - point.x) < EPSILON && Math.abs(candidate.y - point.y) < EPSILON,
      ),
    )
    .filter((candidate): candidate is (typeof feasibleCandidates)[number] => Boolean(candidate));
  const orderedPoints = hullVertices.concat(
    feasibleCandidates.filter(
      (candidate) =>
        !hullVertices.some(
          (point) =>
            Math.abs(point.x - candidate.x) < EPSILON && Math.abs(point.y - candidate.y) < EPSILON,
        ),
    ),
  );

  const labeledVertices = orderedPoints.map(
    (point, index) =>
      ({
        id: `vertex-${index}`,
        label: String.fromCharCode(65 + index),
        x: point.x,
        y: point.y,
        z: point.z,
        substitution: `${formatNumber(problem.objectiveCoefficients[0])}(${formatNumber(point.x)}) + ${formatNumber(problem.objectiveCoefficients[1])}(${formatNumber(point.y)})`,
        status: "Factible",
      }) satisfies GraphicalVertex,
  );

  const optimalVertex = labeledVertices.reduce<GraphicalVertex | undefined>((best, current) => {
    if (!best || current.z > best.z + EPSILON) {
      return current;
    }
    return best;
  }, undefined);

  const vertices = labeledVertices.map((vertex) =>
    optimalVertex?.id === vertex.id ? { ...vertex, status: "Óptimo" as const } : vertex,
  );
  const feasiblePolygon = hull.map((point) => {
    const match = vertices.find(
      (vertex) => Math.abs(vertex.x - point.x) < EPSILON && Math.abs(vertex.y - point.y) < EPSILON,
    );

    return (
      match ?? {
        id: `polygon-${point.x}-${point.y}`,
        label: "",
        x: point.x,
        y: point.y,
        z: roundForDisplay(
          problem.objectiveCoefficients[0] * point.x + problem.objectiveCoefficients[1] * point.y,
        ),
        substitution: "",
        status: "Factible" as const,
      }
    );
  });

  const { xMax, yMax } = getAxisBounds(problem, vertices);
  const graphicalLines: GraphicalLine[] = problem.constraints.map((_, index) =>
    buildConstraintLine(problem, index, xMax, yMax),
  );
  const evaluationOrder = [...vertices].sort((left, right) => left.z - right.z || left.x - right.x);
  const levelLines: GraphicalLevelLine[] = evaluationOrder
    .map((vertex) => {
      const points = getObjectiveLinePoints(
        [problem.objectiveCoefficients[0], problem.objectiveCoefficients[1]],
        vertex.z,
        xMax,
        yMax,
      );

      if (!points) {
        return null;
      }

      const description =
        optimalVertex?.id === vertex.id
          ? `Para Z = ${formatNumber(vertex.z)}, la recta de nivel toca la región factible en ${vertex.label}(${formatNumber(vertex.x)}, ${formatNumber(vertex.y)}), que es el último punto de contacto en dirección de maximización.`
          : `Para Z = ${formatNumber(vertex.z)}, la recta de nivel pasa por el vértice ${vertex.label}(${formatNumber(vertex.x)}, ${formatNumber(vertex.y)}).`;

      return {
        id: `level-${formatNumber(vertex.z).replace(/\./g, "-")}`,
        label: `Z = ${formatNumber(vertex.z)}`,
        zValue: vertex.z,
        vertexId: vertex.id,
        description,
        tooltip: `Recta de nivel: Z = ${formatNumber(vertex.z)}`,
        points,
      } satisfies GraphicalLevelLine;
    })
    .filter((levelLine): levelLine is GraphicalLevelLine => levelLine !== null);

  const stages: GraphicalStage[] = [
    {
      id: "plane",
      title: "Plano cartesiano",
      description:
        "Se prepara el plano X1 - X2 con ejes, cuadrícula suave y etiquetas para comenzar la construcción geométrica del problema.",
      kind: "plane",
      notes: [
        "Los ejes representan las variables de decisión X1 y X2.",
        "La cuadrícula permite ubicar rectas, interceptos y vértices con claridad.",
      ],
    },
    ...graphicalLines.map(
      (line, index) =>
        ({
          id: `constraint-${index}`,
          title: `Restricción ${index + 1}: ${line.label}`,
          description: line.explanation,
          kind: "constraint",
          constraintIndex: index,
          focusLineId: line.id,
          notes: [line.feasibleSideLabel],
        }) satisfies GraphicalStage,
    ),
    {
      id: "region",
      title: "Región factible",
      description:
        "Se sombrea la intersección de todas las restricciones con las condiciones de no negatividad. Esa zona contiene todos los puntos que cumplen simultáneamente el modelo.",
      kind: "region",
      notes: feasiblePolygon.map(
        (vertex) => `${vertex.label}(${formatNumber(vertex.x)}, ${formatNumber(vertex.y)})`,
      ),
    },
    {
      id: "vertices",
      title: "Vértices factibles",
      description:
        "Se identifican los vértices de la región factible. En programación lineal, el máximo global se alcanza en uno de estos puntos extremos.",
      kind: "vertices",
      revealedVertexIds: vertices.map((vertex) => vertex.id),
      notes: vertices.map(
        (vertex) => `${vertex.label}(${formatNumber(vertex.x)}, ${formatNumber(vertex.y)})`,
      ),
    },
    ...evaluationOrder.map(
      (vertex, index) =>
        ({
          id: `evaluation-${vertex.id}`,
          title: `Evaluación en ${vertex.label}(${formatNumber(vertex.x)}, ${formatNumber(vertex.y)})`,
          description: `Punto ${vertex.label}: Z = ${vertex.substitution} = ${formatNumber(vertex.z)}.`,
          kind: "evaluation",
          focusVertexId: vertex.id,
          revealedVertexIds: evaluationOrder.slice(0, index + 1).map((item) => item.id),
          notes: [
            `Sustitución: ${vertex.substitution}`,
            `Valor obtenido: Z = ${formatNumber(vertex.z)}`,
            `Estado: ${vertex.status === "Óptimo" ? "Óptimo" : "Factible"}`,
          ],
        }) satisfies GraphicalStage,
    ),
    ...levelLines.map(
      (levelLine, index) =>
        ({
          id: `objective-${levelLine.id}`,
          title: `Recta de nivel ${levelLine.label}`,
          description: levelLine.description,
          kind: "objective",
          focusLevelId: levelLine.id,
          focusVertexId: levelLine.vertexId,
          revealedVertexIds: evaluationOrder.map((vertex) => vertex.id),
          revealedLevelIds: levelLines.slice(0, index + 1).map((item) => item.id),
          notes: [levelLine.tooltip],
        }) satisfies GraphicalStage,
    ),
    {
      id: "direction",
      title: "Dirección de maximización",
      description:
        "La función objetivo se desplaza paralelamente aumentando Z. En maximización buscamos la recta más alejada del origen que todavía toca la región factible.",
      kind: "direction",
      focusLevelId: levelLines[levelLines.length - 1]?.id,
      focusVertexId: optimalVertex?.id,
      revealedVertexIds: evaluationOrder.map((vertex) => vertex.id),
      revealedLevelIds: levelLines.map((levelLine) => levelLine.id),
      notes: [
        "Cada recta de nivel conserva la misma pendiente que la función objetivo.",
        "El último punto de contacto con la región factible determina el máximo global.",
      ],
    },
    {
      id: "optimal",
      title: "Punto óptimo",
      description: optimalVertex
        ? `Óptimo: (${formatNumber(optimalVertex.x)}, ${formatNumber(optimalVertex.y)}) con Z = ${formatNumber(optimalVertex.z)}. Máximo global en la región factible.`
        : "No fue posible determinar un punto óptimo gráfico.",
      kind: "optimal",
      focusVertexId: optimalVertex?.id,
      focusLevelId: levelLines[levelLines.length - 1]?.id,
      revealedVertexIds: evaluationOrder.map((vertex) => vertex.id),
      revealedLevelIds: levelLines.map((levelLine) => levelLine.id),
      notes: optimalVertex
        ? [
            `Óptimo: (${formatNumber(optimalVertex.x)}, ${formatNumber(optimalVertex.y)})`,
            `Valor máximo: Z = ${formatNumber(optimalVertex.z)}`,
            "Máximo global en la región factible.",
          ]
        : undefined,
    },
    {
      id: "conclusion",
      title: "Conclusión gráfica",
      description: optimalVertex
        ? `El máximo global en la región factible se alcanza en (${formatNumber(optimalVertex.x)}, ${formatNumber(optimalVertex.y)}) con Z = ${formatNumber(optimalVertex.z)}.`
        : "No fue posible determinar un vértice óptimo.",
      kind: "conclusion",
      focusVertexId: optimalVertex?.id,
      focusLevelId: levelLines[levelLines.length - 1]?.id,
      revealedVertexIds: evaluationOrder.map((vertex) => vertex.id),
      revealedLevelIds: levelLines.map((levelLine) => levelLine.id),
      notes: ["Máximo global en la región factible."],
    },
  ];

  return {
    available: true,
    lines: graphicalLines,
    vertices,
    feasiblePolygon,
    levelLines,
    optimalVertex,
    xMax,
    yMax,
    stages,
  };
};
