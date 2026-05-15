import { SimplexResult } from '../simplex/simplexTypes';
import { formatNumber } from '../simplex/simplexUtils';

interface SolutionSummaryProps {
  result: SimplexResult;
  interpretation?: string;
}

const SolutionSummary = ({ result, interpretation }: SolutionSummaryProps) => {
  const orderedDecisionVariables = Object.entries(result.decisionVariables)
    .sort(([left], [right]) => left.localeCompare(right, 'es'));
  const orderedSlackVariables = Object.entries(result.slackVariables)
    .sort(([left], [right]) => left.localeCompare(right, 'es'));
  const statusLabel = result.status === 'optimal'
    ? 'Óptima'
    : result.status === 'unbounded'
      ? 'No acotado'
      : 'Error';
  const optimalPoint = result.decisionVariables.X1 !== undefined && result.decisionVariables.X2 !== undefined
    ? `(${formatNumber(result.decisionVariables.X1)}, ${formatNumber(result.decisionVariables.X2)})`
    : null;

  return (
    <section className="panel solution-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Resultado final</p>
          <h2>Solución óptima</h2>
        </div>
        <div className={`status-badge ${result.status === 'optimal' ? 'optimal' : 'warning'}`}>{statusLabel}</div>
      </div>

      <div className="solution-grid">
        <article className="solution-card accent-card solution-hero-card">
          <span>Valor óptimo</span>
          <strong className="optimal-z-value">Z = {formatNumber(result.optimalValue)}</strong>
          {optimalPoint ? <p className="solution-hero-note">{`Punto óptimo ${optimalPoint}`}</p> : null}
        </article>

        <article className="solution-card">
          <h3>Variables de decisión</h3>
          <div className="solution-pill-grid">
            {orderedDecisionVariables.map(([name, value]) => (
              <div key={name} className="solution-value-pill">{`${name} = ${formatNumber(value)}`}</div>
            ))}
          </div>
        </article>

        <article className="solution-card">
          <h3>Variables de holgura</h3>
          <div className="solution-pill-grid">
            {orderedSlackVariables.map(([name, value]) => (
              <div key={name} className="solution-value-pill slack-pill">{`${name} = ${formatNumber(value)}`}</div>
            ))}
          </div>
        </article>

        {optimalPoint ? (
          <article className="solution-card solution-note-card">
            <h3>Clasificación del óptimo</h3>
            <div className="solution-pill-grid">
              <div className="solution-value-pill">{`Punto óptimo ${optimalPoint}`}</div>
              <div className="solution-value-pill success-pill">Máximo global en la región factible</div>
            </div>
          </article>
        ) : null}
      </div>

      <div className="interpretation-box">
        <h3>Interpretación</h3>
        <p>{interpretation ?? result.message}</p>
      </div>
    </section>
  );
};

export default SolutionSummary;
