import { ExampleProblem } from '../simplex/simplexTypes';

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
        {examples.map((example) => (
          <article key={example.id} className="example-card">
            <h3>{example.title}</h3>
            <p>{example.description}</p>
            <p className="example-expected">{example.expectedSummary}</p>
            <div className="example-card-footer">
            <button type="button" className="button button-secondary" onClick={() => onSelect(example)}>
              Cargar ejemplo
            </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default ExampleSelector;
