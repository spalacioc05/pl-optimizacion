import { ExampleProblem } from '../simplex/simplexTypes';
import { formatConstraint, formatObjectiveFunction } from '../simplex/simplexUtils';

const toDisplayMath = (value: string): string => value.replace(/<=/g, '≤').replace(/>=/g, '≥');

interface ExampleSelectorProps {
  examples: ExampleProblem[];
  onSelect: (example: ExampleProblem) => void;
}

const ExampleSelector = ({ examples, onSelect }: ExampleSelectorProps) => {
  return (
    <section className="panel examples-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Pruebas rápidas</p>
          <h2>Ejemplos precargados</h2>
        </div>
        <p className="panel-copy">Carga un caso de referencia y revisa el comportamiento tablero por tablero.</p>
      </div>

      <div className="examples-grid">
        {examples.map((example) => {
          const modelLines = [
            toDisplayMath(formatObjectiveFunction(example.problem)),
            ...example.problem.constraints.map((constraint) => toDisplayMath(formatConstraint(constraint))),
            'X1, X2 ≥ 0',
          ];

          return (
            <article key={example.id} className="example-card">
              <div className="example-card-top">
                <div>
                  <h3>{example.title}</h3>
                  <p>{example.description}</p>
                </div>
                <span className="example-problem-tag">
                  {`${example.problem.objectiveCoefficients.length} variables · ${example.problem.constraints.length} restricciones`}
                </span>
              </div>
              <div className="example-model-preview">
                {modelLines.map((line) => (
                  <p key={`${example.id}-${line}`}>{line}</p>
                ))}
              </div>
              <p className="example-expected">{example.expectedSummary}</p>
              <div className="example-card-footer">
                <button type="button" className="button button-secondary" onClick={() => onSelect(example)}>
                  Cargar ejemplo
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default ExampleSelector;
