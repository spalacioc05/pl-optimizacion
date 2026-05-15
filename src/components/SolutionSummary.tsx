import { SimplexResult } from '../simplex/simplexTypes';
import { formatNumber } from '../simplex/simplexUtils';

interface SolutionSummaryProps {
  result: SimplexResult;
  interpretation?: string;
}

const SolutionSummary = ({ result, interpretation }: SolutionSummaryProps) => {
  const statusLabel = result.status === 'optimal'
    ? 'Óptima'
    : result.status === 'unbounded'
      ? 'No acotado'
      : 'Error';

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
        </article>

        <article className="solution-card">
          <h3>Variables de decisión</h3>
          <div className="solution-pill-grid">
            {Object.entries(result.decisionVariables).map(([name, value]) => (
              <div key={name} className="solution-value-pill">{`${name} = ${formatNumber(value)}`}</div>
            ))}
          </div>
        </article>

        <article className="solution-card">
          <h3>Variables de holgura</h3>
          <div className="solution-pill-grid">
            {Object.entries(result.slackVariables).map(([name, value]) => (
              <div key={name} className="solution-value-pill slack-pill">{`${name} = ${formatNumber(value)}`}</div>
            ))}
          </div>
        </article>
      </div>

      <div className="interpretation-box">
        <h3>Interpretación</h3>
        <p>{interpretation ?? result.message}</p>
      </div>
    </section>
  );
};

export default SolutionSummary;
