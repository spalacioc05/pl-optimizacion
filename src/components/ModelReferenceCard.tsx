interface ModelReference {
  title: string;
  expectedPoint: {
    x: number;
    y: number;
  };
  axisMax: {
    x: number;
    y: number;
  };
  expectedResultLines: readonly string[];
  interpretation: string;
}

interface ModelReferenceCardProps {
  variableCount: number;
  reference?: ModelReference;
}

const clampPercent = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 50;
  }

  return Math.min(88, Math.max(12, value));
};

const ModelReferenceCard = ({ variableCount, reference }: ModelReferenceCardProps) => {
  const pointLeft = reference ? clampPercent((reference.expectedPoint.x / reference.axisMax.x) * 100) : 50;
  const pointBottom = reference ? clampPercent((reference.expectedPoint.y / reference.axisMax.y) * 100) : 50;

  return (
    <section className="panel reference-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Apoyo visual</p>
          <h2>Referencia visual del modelo</h2>
        </div>
        <div className="status-badge working">{`${variableCount} variables`}</div>
      </div>

      <div className="reference-layout">
        <div className="reference-copy">
          <p>
            Este modelo tiene {variableCount} variables. En próximos sprints se agregará el método gráfico completo para contrastar la solución algebraica con la visual.
          </p>

          {reference ? (
            <>
              <div className="reference-highlight">
                <span>Punto óptimo esperado</span>
                <strong>{`(${reference.expectedPoint.x}, ${reference.expectedPoint.y})`}</strong>
              </div>

              <div className="reference-pill-grid">
                {reference.expectedResultLines.map((item) => (
                  <span key={item} className="reference-pill">{item}</span>
                ))}
              </div>

              <p className="reference-interpretation">{reference.interpretation}</p>
            </>
          ) : (
            <div className="reference-placeholder">
              <strong>Referencia general</strong>
              <span>
                Cuando el problema tiene dos variables, esta sección servirá como apoyo visual para interpretar el punto óptimo y contrastarlo con el método gráfico.
              </span>
            </div>
          )}
        </div>

        <div className="reference-visual-card">
          <div className="reference-visual-title">Plano conceptual X1 - X2</div>
          <div className="reference-plane">
            <div className="reference-axis reference-axis-horizontal" />
            <div className="reference-axis reference-axis-vertical" />
            {reference ? (
              <div
                className="reference-point"
                style={{ left: `${pointLeft}%`, bottom: `${pointBottom}%` }}
              >
                <span>{`(${reference.expectedPoint.x}, ${reference.expectedPoint.y})`}</span>
              </div>
            ) : null}
            <span className="reference-axis-label axis-x">X1</span>
            <span className="reference-axis-label axis-y">X2</span>
          </div>
          <p className="reference-visual-note">
            {reference
              ? `Referencia del ejemplo ${reference.title}.`
              : 'Visual de apoyo conceptual, no corresponde todavía al método gráfico completo.'}
          </p>
        </div>
      </div>
    </section>
  );
};

export default ModelReferenceCard;