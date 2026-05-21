import type {
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
      xMax: 0,
      yMax: 0,
      stages: [],
    };
  }

  const lines = problem.constraints.map((constraint, index) => ({
    a: constraint.coefficients[0],
    b: constraint.coefficients[1],
    c: constraint.rhs,
    label: `R${index + 1}: ${formatConstraint(constraint).replace(/<=/g, "≤")}`,
  }));

  const candidatePoints: Array<{ x: number; y: number }> = [{ x: 0, y: 0 }];
  lines.forEach((line) => {
    if (Math.abs(line.a) > EPSILON) {
      candidatePoints.push({ x: line.c / line.a, y: 0 });
    }
    if (Math.abs(line.b) > EPSILON) {
      candidatePoints.push({ x: 0, y: line.c / line.b });
    }
  });

  for (let firstIndex = 0; firstIndex < lines.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < lines.length; secondIndex += 1) {
      const point = getIntersection(lines[firstIndex], lines[secondIndex]);
      if (point) {
        candidatePoints.push(point);
      }
    }
  }

  const feasiblePoints = uniquePoints(candidatePoints)
    .filter((point) => isFeasiblePoint(problem, point.x, point.y))
    .map(
      (point, index) =>
        ({
          id: `vertex-${index}`,
          x: roundForDisplay(point.x),
          y: roundForDisplay(point.y),
          z: roundForDisplay(
            problem.objectiveCoefficients[0] * point.x + problem.objectiveCoefficients[1] * point.y,
          ),
        }) satisfies GraphicalVertex,
    );

  const hull = buildConvexHull(feasiblePoints.map((vertex) => ({ x: vertex.x, y: vertex.y })));
  const feasiblePolygon = hull.map((point, index) => {
    const match = feasiblePoints.find(
      (vertex) => Math.abs(vertex.x - point.x) < EPSILON && Math.abs(vertex.y - point.y) < EPSILON,
    );
    return (
      match ?? {
        id: `polygon-${index}`,
        x: point.x,
        y: point.y,
        z: roundForDisplay(
          problem.objectiveCoefficients[0] * point.x + problem.objectiveCoefficients[1] * point.y,
        ),
      }
    );
  });

  const optimalVertex = feasiblePoints.reduce<GraphicalVertex | undefined>((best, current) => {
    if (!best || current.z > best.z + EPSILON) {
      return current;
    }
    return best;
  }, undefined);

  const { xMax, yMax } = getAxisBounds(problem, feasiblePoints);
  const graphicalLines: GraphicalLine[] = problem.constraints.map((constraint, index) => ({
    id: `constraint-${index}`,
    label: lines[index].label,
    coefficients: [constraint.coefficients[0], constraint.coefficients[1]],
    rhs: constraint.rhs,
    points: getBoundarySegment(
      [constraint.coefficients[0], constraint.coefficients[1]],
      constraint.rhs,
      xMax,
      yMax,
    ),
  }));

  const stages: GraphicalStage[] = [
    {
      id: "plane",
      title: "Plano cartesiano",
      description: "Se prepara el plano donde se dibujarán las restricciones y la región factible.",
      kind: "plane",
    },
    {
      id: "axes",
      title: "Ejes X1 y X2",
      description:
        "Se muestran los ejes del problema para ubicar las restricciones y los vértices factibles.",
      kind: "axes",
    },
    ...graphicalLines.map(
      (line, index) =>
        ({
          id: `constraint-${index}`,
          title: `Restricción ${index + 1}`,
          description: `Se dibuja la frontera ${line.label}.`,
          kind: "constraint",
          constraintIndex: index,
        }) satisfies GraphicalStage,
    ),
    {
      id: "region",
      title: "Región factible",
      description:
        "Se resalta la intersección de todas las restricciones con las condiciones de no negatividad.",
      kind: "region",
    },
    {
      id: "vertices",
      title: "Vértices factibles",
      description: "Se identifican todos los vértices candidatos de la región factible.",
      kind: "vertices",
    },
    {
      id: "evaluation",
      title: "Evaluación de la función objetivo",
      description: "Se calcula Z en cada vértice factible para comparar los resultados.",
      kind: "evaluation",
    },
    {
      id: "objective",
      title: "Desplazamiento de la recta Z",
      description:
        "La recta objetivo se mueve en la dirección de maximización hasta tocar el último punto factible.",
      kind: "objective",
    },
    {
      id: "optimal",
      title: "Punto óptimo",
      description: "Se destaca el máximo global en la región factible.",
      kind: "optimal",
    },
    {
      id: "conclusion",
      title: "Conclusión gráfica",
      description: optimalVertex
        ? `El máximo global en la región factible se alcanza en (${formatNumber(optimalVertex.x)}, ${formatNumber(optimalVertex.y)}) con Z = ${formatNumber(optimalVertex.z)}.`
        : "No fue posible determinar un vértice óptimo.",
      kind: "conclusion",
    },
  ];

  return {
    available: true,
    lines: graphicalLines,
    vertices: feasiblePoints,
    feasiblePolygon,
    optimalVertex,
    xMax,
    yMax,
    stages,
  };
};
