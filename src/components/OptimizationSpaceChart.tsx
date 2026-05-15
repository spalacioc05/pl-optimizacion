import { Constraint, LinearProgrammingProblem, SimplexResult } from '../simplex/simplexTypes';
import { formatNumber } from '../simplex/simplexUtils';

interface Point {
  x: number;
  y: number;
}

interface OptimizationSpaceChartProps {
  problem: LinearProgrammingProblem;
  result: SimplexResult;
}

const EPSILON = 1e-9;
const CHART_WIDTH = 760;
const CHART_HEIGHT = 420;
const PADDING = { top: 28, right: 34, bottom: 42, left: 50 };
const CONSTRAINT_COLORS = ['#0f766e', '#0891b2', '#0f766e', '#14b8a6', '#115e59', '#0284c7'];

const uniquePoints = (points: Point[]): Point[] => {
  const seen = new Set<string>();

  return points.filter((point) => {
    const key = `${point.x.toFixed(6)}-${point.y.toFixed(6)}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const isFeasiblePoint = (point: Point, problem: LinearProgrammingProblem): boolean => {
  if (point.x < -EPSILON || point.y < -EPSILON) {
    return false;
  }

  return problem.constraints.every((constraint) => {
    const [a, b] = constraint.coefficients;
    return a * point.x + b * point.y <= constraint.rhs + EPSILON;
  });
};

const getIntersection = (first: Constraint, second: Constraint): Point | null => {
  const [a1, b1] = first.coefficients;
  const [a2, b2] = second.coefficients;
  const determinant = a1 * b2 - a2 * b1;

  if (Math.abs(determinant) < EPSILON) {
    return null;
  }

  const x = (first.rhs * b2 - second.rhs * b1) / determinant;
  const y = (a1 * second.rhs - a2 * first.rhs) / determinant;

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  return { x, y };
};

const cross = (origin: Point, a: Point, b: Point): number => {
  return (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x);
};

const buildConvexHull = (points: Point[]): Point[] => {
  if (points.length <= 1) {
    return points;
  }

  const sorted = [...points].sort((left, right) => {
    if (left.x === right.x) {
      return left.y - right.y;
    }

    return left.x - right.x;
  });

  const lower: Point[] = [];
  sorted.forEach((point) => {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= EPSILON) {
      lower.pop();
    }
    lower.push(point);
  });

  const upper: Point[] = [];
  [...sorted].reverse().forEach((point) => {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= EPSILON) {
      upper.pop();
    }
    upper.push(point);
  });

  lower.pop();
  upper.pop();

  return [...lower, ...upper];
};

const getFeasibleVertices = (problem: LinearProgrammingProblem): Point[] => {
  const candidates: Point[] = [{ x: 0, y: 0 }];

  problem.constraints.forEach((constraint) => {
    const [a, b] = constraint.coefficients;

    if (Math.abs(a) > EPSILON) {
      candidates.push({ x: constraint.rhs / a, y: 0 });
    }

    if (Math.abs(b) > EPSILON) {
      candidates.push({ x: 0, y: constraint.rhs / b });
    }
  });

  for (let firstIndex = 0; firstIndex < problem.constraints.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < problem.constraints.length; secondIndex += 1) {
      const intersection = getIntersection(problem.constraints[firstIndex], problem.constraints[secondIndex]);
      if (intersection) {
        candidates.push(intersection);
      }
    }
  }

  const feasible = uniquePoints(
    candidates.filter(
      (point) => Number.isFinite(point.x) && Number.isFinite(point.y) && isFeasiblePoint(point, problem),
    ),
  );

  return buildConvexHull(feasible);
};

const getAxisBounds = (problem: LinearProgrammingProblem, vertices: Point[], optimalPoint: Point) => {
  const xIntercepts = problem.constraints
    .map((constraint) => {
      const [a] = constraint.coefficients;
      return a > EPSILON ? constraint.rhs / a : 0;
    });
  const yIntercepts = problem.constraints
    .map((constraint) => {
      const [, b] = constraint.coefficients;
      return b > EPSILON ? constraint.rhs / b : 0;
    });

  const maxX = Math.max(1, optimalPoint.x, ...xIntercepts, ...vertices.map((vertex) => vertex.x));
  const maxY = Math.max(1, optimalPoint.y, ...yIntercepts, ...vertices.map((vertex) => vertex.y));

  return {
    maxX: maxX * 1.15,
    maxY: maxY * 1.15,
  };
};

const getBoundarySegment = (
  a: number,
  b: number,
  rhs: number,
  maxX: number,
  maxY: number,
): [Point, Point] | null => {
  const candidates: Point[] = [];

  const pushIfValid = (x: number, y: number) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return;
    }

    if (x >= -EPSILON && x <= maxX + EPSILON && y >= -EPSILON && y <= maxY + EPSILON) {
      candidates.push({ x: Math.max(0, x), y: Math.max(0, y) });
    }
  };

  if (Math.abs(b) > EPSILON) {
    pushIfValid(0, rhs / b);
    pushIfValid(maxX, (rhs - a * maxX) / b);
  }

  if (Math.abs(a) > EPSILON) {
    pushIfValid(rhs / a, 0);
    pushIfValid((rhs - b * maxY) / a, maxY);
  }

  const points = uniquePoints(candidates);
  if (points.length < 2) {
    return null;
  }

  const ordered = [...points].sort((left, right) => {
    if (left.x === right.x) {
      return left.y - right.y;
    }

    return left.x - right.x;
  });

  return [ordered[0], ordered[ordered.length - 1]];
};

const clamp = (value: number, minimum: number, maximum: number): number => {
  return Math.min(maximum, Math.max(minimum, value));
};

const OptimizationSpaceChart = ({ problem, result }: OptimizationSpaceChartProps) => {
  if (problem.objectiveCoefficients.length !== 2) {
    return null;
  }

  const optimalPoint: Point = {
    x: result.decisionVariables.X1 ?? 0,
    y: result.decisionVariables.X2 ?? 0,
  };
  const vertices = getFeasibleVertices(problem);
  const { maxX, maxY } = getAxisBounds(problem, vertices, optimalPoint);
  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const mapX = (value: number): number => PADDING.left + (value / maxX) * plotWidth;
  const mapY = (value: number): number => CHART_HEIGHT - PADDING.bottom - (value / maxY) * plotHeight;

  const feasibleRegionPath = vertices.length >= 3
    ? `M ${vertices.map((vertex) => `${mapX(vertex.x)} ${mapY(vertex.y)}`).join(' L ')} Z`
    : '';

  const objectiveSegment = getBoundarySegment(
    problem.objectiveCoefficients[0],
    problem.objectiveCoefficients[1],
    result.optimalValue,
    maxX,
    maxY,
  );

  const gradientLength = Math.hypot(problem.objectiveCoefficients[0], problem.objectiveCoefficients[1]) || 1;
  const direction = {
    x: problem.objectiveCoefficients[0] / gradientLength,
    y: problem.objectiveCoefficients[1] / gradientLength,
  };
  const arrowScale = Math.min(maxX, maxY) * 0.18;
  const arrowStart = {
    x: clamp(optimalPoint.x - direction.x * arrowScale * 0.5, 0, maxX),
    y: clamp(optimalPoint.y - direction.y * arrowScale * 0.5, 0, maxY),
  };
  const arrowEnd = {
    x: clamp(optimalPoint.x + direction.x * arrowScale * 0.5, 0, maxX),
    y: clamp(optimalPoint.y + direction.y * arrowScale * 0.5, 0, maxY),
  };

  return (
    <section className="panel chart-panel">
      <div className="panel-header chart-header">
        <div>
          <p className="eyebrow">Visualización del modelo</p>
          <h2>Espacio de optimización</h2>
        </div>
        <div className="chart-header-tags">
          <span className="status-badge optimal">Óptima</span>
          <span className="status-badge working">Máximo global en la región factible</span>
        </div>
      </div>

      <div className="chart-layout">
        <div className="chart-canvas-card">
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className="optimization-chart"
            role="img"
            aria-label="Gráfica 2D de la región factible y del punto óptimo"
          >
            <defs>
              <marker id="objective-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#0891b2" />
              </marker>
            </defs>

            <rect x="0" y="0" width={CHART_WIDTH} height={CHART_HEIGHT} className="chart-background" />

            {Array.from({ length: 5 }, (_, index) => {
              const x = PADDING.left + (plotWidth / 4) * index;
              const y = PADDING.top + (plotHeight / 4) * index;

              return (
                <g key={`grid-${index}`}>
                  <line x1={x} y1={PADDING.top} x2={x} y2={CHART_HEIGHT - PADDING.bottom} className="chart-grid-line" />
                  <line x1={PADDING.left} y1={y} x2={CHART_WIDTH - PADDING.right} y2={y} className="chart-grid-line" />
                </g>
              );
            })}

            <line
              x1={PADDING.left}
              y1={CHART_HEIGHT - PADDING.bottom}
              x2={CHART_WIDTH - PADDING.right}
              y2={CHART_HEIGHT - PADDING.bottom}
              className="chart-axis-line"
            />
            <line
              x1={PADDING.left}
              y1={PADDING.top}
              x2={PADDING.left}
              y2={CHART_HEIGHT - PADDING.bottom}
              className="chart-axis-line"
            />

            {Array.from({ length: 5 }, (_, index) => {
              const stepX = (maxX / 4) * index;
              const stepY = (maxY / 4) * index;
              return (
                <g key={`ticks-${index}`}>
                  <text x={mapX(stepX)} y={CHART_HEIGHT - PADDING.bottom + 22} className="chart-tick-label">{formatNumber(stepX)}</text>
                  <text x={PADDING.left - 10} y={mapY(stepY) + 4} textAnchor="end" className="chart-tick-label">{formatNumber(stepY)}</text>
                </g>
              );
            })}

            {feasibleRegionPath ? <path d={feasibleRegionPath} className="feasible-region" /> : null}

            {problem.constraints.map((constraint, index) => {
              const segment = getBoundarySegment(
                constraint.coefficients[0],
                constraint.coefficients[1],
                constraint.rhs,
                maxX,
                maxY,
              );

              if (!segment) {
                return null;
              }

              const [start, end] = segment;
              return (
                <line
                  key={`constraint-line-${index}`}
                  x1={mapX(start.x)}
                  y1={mapY(start.y)}
                  x2={mapX(end.x)}
                  y2={mapY(end.y)}
                  stroke={CONSTRAINT_COLORS[index % CONSTRAINT_COLORS.length]}
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="constraint-line"
                />
              );
            })}

            {objectiveSegment ? (
              <line
                x1={mapX(objectiveSegment[0].x)}
                y1={mapY(objectiveSegment[0].y)}
                x2={mapX(objectiveSegment[1].x)}
                y2={mapY(objectiveSegment[1].y)}
                className="objective-line"
              />
            ) : null}

            <line
              x1={mapX(arrowStart.x)}
              y1={mapY(arrowStart.y)}
              x2={mapX(arrowEnd.x)}
              y2={mapY(arrowEnd.y)}
              className="objective-arrow"
              markerEnd="url(#objective-arrow)"
            />

            {vertices.map((vertex) => (
              <circle
                key={`vertex-${vertex.x}-${vertex.y}`}
                cx={mapX(vertex.x)}
                cy={mapY(vertex.y)}
                r="4.5"
                className="vertex-point"
              />
            ))}

            <circle cx={mapX(optimalPoint.x)} cy={mapY(optimalPoint.y)} r="7" className="optimal-point" />
            <g transform={`translate(${mapX(optimalPoint.x) + 14}, ${mapY(optimalPoint.y) - 18})`}>
              <rect width="164" height="46" rx="14" className="optimal-label-box" />
              <text x="12" y="19" className="optimal-label-title">Óptimo ({formatNumber(optimalPoint.x)}, {formatNumber(optimalPoint.y)})</text>
              <text x="12" y="34" className="optimal-label-subtitle">Z = {formatNumber(result.optimalValue)}</text>
            </g>

            <text x={CHART_WIDTH - PADDING.right - 86} y={PADDING.top + 16} className="chart-direction-label">Dirección de maximización</text>
            <text x={CHART_WIDTH - PADDING.right - 14} y={CHART_HEIGHT - PADDING.bottom + 30} className="chart-axis-name">X1</text>
            <text x={PADDING.left - 22} y={PADDING.top - 6} className="chart-axis-name">X2</text>
          </svg>
        </div>

        <div className="chart-side-panel">
          <div className="chart-summary-card">
            <h3>Lectura del gráfico</h3>
            <p>
              La región sombreada representa el conjunto de soluciones factibles. El punto marcado corresponde al óptimo global encontrado por el método Simplex.
            </p>
            <div className="chart-pill-grid">
              <span className="reference-pill">Óptimo ({formatNumber(optimalPoint.x)}, {formatNumber(optimalPoint.y)})</span>
              <span className="reference-pill">Z = {formatNumber(result.optimalValue)}</span>
              <span className="reference-pill">Maximización</span>
            </div>
          </div>

          <div className="chart-legend-card">
            <h3>Leyenda</h3>
            <ul className="chart-legend-list">
              {problem.constraints.map((constraint, index) => (
                <li key={`constraint-legend-${index}`}>
                  <span className="legend-swatch" style={{ backgroundColor: CONSTRAINT_COLORS[index % CONSTRAINT_COLORS.length] }} />
                  <span>{`Restricción ${index + 1}: ${formatNumber(constraint.coefficients[0])}X1 + ${formatNumber(constraint.coefficients[1])}X2 ≤ ${formatNumber(constraint.rhs)}`}</span>
                </li>
              ))}
              <li>
                <span className="legend-swatch feasible" />
                <span>Región factible</span>
              </li>
              <li>
                <span className="legend-swatch objective" />
                <span>Recta objetivo en Z óptimo</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OptimizationSpaceChart;