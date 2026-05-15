import { SimplexIteration, SimplexTableau } from '../simplex/simplexTypes';
import { formatNumber } from '../simplex/simplexUtils';

interface SimplexTableProps {
  tableau: SimplexTableau;
  iteration?: Pick<SimplexIteration, 'pivotColumnIndex' | 'pivotRowIndex' | 'ratios'>;
}

const SimplexTable = ({ tableau, iteration }: SimplexTableProps) => {
  const rhsIndex = tableau.headers.length - 1;

  return (
    <div className="table-wrapper">
      <table className="simplex-table">
        <thead>
          <tr>
            <th className="table-side-header">VB</th>
            {tableau.headers.map((header, columnIndex) => (
              <th
                key={header}
                className={[
                  iteration?.pivotColumnIndex === columnIndex ? 'pivot-column-header' : '',
                  columnIndex === rhsIndex ? 'rhs-header' : '',
                ].join(' ').trim() || undefined}
              >
                {header}
              </th>
            ))}
            <th className="ratio-header">Razón</th>
          </tr>
        </thead>
        <tbody>
          {tableau.rows.map((row, rowIndex) => (
            <tr key={`${tableau.basicVariables[rowIndex]}-${rowIndex}`} className={rowIndex === 0 ? 'z-row' : undefined}>
              <th className={[
                'table-side-cell',
                iteration?.pivotRowIndex === rowIndex ? 'pivot-row-label' : '',
              ].join(' ').trim()}>
                {tableau.basicVariables[rowIndex]}
              </th>
              {row.map((value, columnIndex) => {
                const isPivotColumn = iteration?.pivotColumnIndex === columnIndex;
                const isPivotRow = iteration?.pivotRowIndex === rowIndex;
                const isPivotElement = isPivotColumn && isPivotRow;

                return (
                  <td
                    key={`${tableau.basicVariables[rowIndex]}-${tableau.headers[columnIndex]}`}
                    className={[
                      isPivotColumn ? 'pivot-column-cell' : '',
                      isPivotRow ? 'pivot-row-cell' : '',
                      isPivotElement ? 'pivot-element-cell' : '',
                      columnIndex === rhsIndex ? 'rhs-cell' : '',
                    ].join(' ').trim() || undefined}
                  >
                    {formatNumber(value)}
                  </td>
                );
              })}
              <td className="ratio-cell">
                {rowIndex === 0
                  ? '-'
                  : iteration?.ratios?.[rowIndex - 1]?.value === null
                    ? '-'
                    : formatNumber(iteration?.ratios?.[rowIndex - 1]?.value ?? 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SimplexTable;
