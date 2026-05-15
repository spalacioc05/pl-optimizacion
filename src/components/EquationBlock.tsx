interface EquationBlockProps {
  title: string;
  description: string;
  lines: string[];
  badge?: string;
}

const EquationBlock = ({ title, description, lines, badge }: EquationBlockProps) => {
  return (
    <div className="equation-block">
      <div className="equation-block-header">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        {badge ? <span className="status-badge working">{badge}</span> : null}
      </div>
      <div className="equation-line-list">
        {lines.map((line) => (
          <p key={line} className="equation-line">{line}</p>
        ))}
      </div>
    </div>
  );
};

export default EquationBlock;