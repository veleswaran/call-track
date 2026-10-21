export function generateCsv(rows: Record<string, any>[], headers?: { key: string; label: string }[]): string {
  if (rows.length === 0) return '';

  const columns = headers || Object.keys(rows[0]).map((key) => ({ key, label: key }));
  const headerLine = columns.map((col) => `"${col.label.replace(/"/g, '""')}"`).join(',');

  const bodyLines = rows.map((row) => {
    return columns
      .map((col) => {
        let val = row[col.key];
        if (val === null || val === undefined) {
          return '""';
        }
        if (val instanceof Date) {
          val = val.toISOString();
        } else if (typeof val === 'object') {
          val = JSON.stringify(val);
        } else {
          val = String(val);
        }
        return `"${val.replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  return [headerLine, ...bodyLines].join('\n');
}
