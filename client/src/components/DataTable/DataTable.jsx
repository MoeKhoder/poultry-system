import "./DataTable.css";

export function Table({ columns, rows, renderRow, footer }) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>{renderRow(row)}</tr>
          ))}
        </tbody>
        {footer && <tfoot>{footer}</tfoot>}
      </table>
    </div>
  );
}

export function Td({ children, className = "", dir }) {
  return (
    <td className={className} dir={dir}>
      {children}
    </td>
  );
}
