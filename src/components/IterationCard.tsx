import { SimplexIteration } from '../simplex/simplexTypes';
import SimplexTable from './SimplexTable';
import { formatNumber } from '../simplex/simplexUtils';

interface IterationCardProps {
  iteration: SimplexIteration;
}

const IterationCard = ({ iteration }: IterationCardProps) => {
  const positiveRatios = iteration.ratios
    .filter((ratio) => ratio.value !== null)
    .map((ratio) => ratio.value as number);
  const minimumRatio = positiveRatios.length > 0 ? Math.min(...positiveRatios) : null;

  return (
    <article className="panel iteration-card">
      <div className="iteration-header">
        <div>
          <p className="eyebrow">Iteración {iteration.iterationNumber}</p>
          <h3>{iteration.statusLabel}</h3>
        </div>
        <div className="iteration-header-side">
          <div className="iteration-number-chip">#{iteration.iterationNumber}</div>
          <div className={`status-badge ${iteration.isOptimal ? 'optimal' : 'working'}`}>
            {iteration.isOptimal ? 'Óptima' : 'En proceso'}
          </div>
        </div>
      </div>

      <div className="iteration-chip-grid">
        <div className="meta-item iteration-chip-item">
          <span>Variable que entra</span>
          <strong>{iteration.enteringVariable ?? 'No aplica'}</strong>
        </div>
        <div className="meta-item iteration-chip-item">
          <span>Variable que sale</span>
          <strong>{iteration.leavingVariable ?? 'No aplica'}</strong>
        </div>
        <div className="meta-item iteration-chip-item">
          <span>Columna pivote</span>
          <strong>{iteration.pivotColumnIndex !== undefined ? iteration.tableau.headers[iteration.pivotColumnIndex] : 'No aplica'}</strong>
        </div>
        <div className="meta-item iteration-chip-item">
          <span>Fila pivote</span>
          <strong>{iteration.pivotRowIndex !== undefined ? iteration.tableau.basicVariables[iteration.pivotRowIndex] : 'No aplica'}</strong>
        </div>
        <div className="meta-item iteration-chip-item pivot-chip-item">
          <span>Elemento pivote</span>
          <strong>{iteration.pivotValue !== undefined ? formatNumber(iteration.pivotValue) : 'No aplica'}</strong>
        </div>
      </div>

      <SimplexTable
        tableau={iteration.tableau}
        iteration={{
          pivotColumnIndex: iteration.pivotColumnIndex,
          pivotRowIndex: iteration.pivotRowIndex,
          ratios: iteration.ratios,
        }}
      />

      <div className="iteration-details-grid">
        <section className="detail-block ratio-block">
          <h4>Razones calculadas</h4>
          <ul>
            {iteration.ratios.map((ratio) => (
              <li
                key={`${iteration.iterationNumber}-${ratio.basicVariable}`}
                className={[
                  'ratio-item',
                  ratio.value !== null && minimumRatio !== null && Math.abs(ratio.value - minimumRatio) < 1e-9
                    ? 'selected-ratio-item'
                    : '',
                  iteration.leavingVariable === ratio.basicVariable ? 'leaving-ratio-item' : '',
                ].join(' ').trim() || undefined}
              >
                <strong>{`${ratio.basicVariable}:`}</strong>
                <span>{ratio.expression}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="detail-block technical-block">
          <h4>Operaciones de renglón</h4>
          {iteration.rowOperations.length > 0 ? (
            <ul className="operation-list">
              {iteration.rowOperations.map((operation) => (
                <li key={`${iteration.iterationNumber}-${operation}`} className="operation-line">{operation}</li>
              ))}
            </ul>
          ) : (
            <p>No se realizaron operaciones de renglón en esta etapa.</p>
          )}
        </section>
      </div>

      <section className="detail-block explanation-block reading-block">
        <h4>Explicación de la iteración</h4>
        <ul className="explanation-list">
          {iteration.explanation.map((item) => (
            <li key={`${iteration.iterationNumber}-${item}`} className="explanation-step">{item}</li>
          ))}
        </ul>
      </section>
    </article>
  );
};

export default IterationCard;
