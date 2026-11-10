import React from 'react';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  variant?: 'telemetry-mono' | 'manifest-standard';
  isRowAlert?: (row: T) => boolean;
  onRowClick?: (row: T) => void;
  className?: string;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  variant = 'telemetry-mono',
  isRowAlert,
  onRowClick,
  className = '',
  emptyMessage = 'Tidak ada data tercatat',
}: DataTableProps<T>) {
  const isMono = variant === 'telemetry-mono';

  return (
    <div className={`w-full overflow-x-auto select-none ${className}`}>
      <table
        className={`w-full text-left ${
          isMono
            ? 'font-mono-code text-mono-code text-[11px]'
            : 'font-body-sm text-body-sm'
        }`}
      >
        <thead>
          <tr
            className={
              isMono
                ? 'bg-surface-container-low text-on-surface-variant'
                : 'bg-surface-container text-on-surface-variant font-label-md text-label-md'
            }
          >
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`py-space-xs px-space-xs font-semibold whitespace-nowrap ${
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left'
                } ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y-0">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-space-md text-center text-on-surface-variant"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => {
              const alert = isRowAlert ? isRowAlert(row) : false;
              const rowKey = keyExtractor(row, rowIdx);

              return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${
                    alert
                      ? 'bg-error-container/20 hover:bg-error-container/30 text-error'
                      : 'hover:bg-surface-container-low text-on-surface'
                  }`}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={`py-space-xs px-space-xs whitespace-nowrap ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      } ${col.className || ''}`}
                    >
                      {col.cell
                        ? col.cell(row, rowIdx)
                        : col.accessorKey
                        ? String(row[col.accessorKey] ?? '')
                        : null}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

