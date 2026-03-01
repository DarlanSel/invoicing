function toCamel(s) {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

export function rowToObject(row) {
  if (!row) return null;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    const key = toCamel(k);
    // Convert SQLite integer booleans
    if (k === 'is_active') {
      out[key] = v === 1;
    } else {
      out[key] = v;
    }
  }
  return out;
}

export function rowsToArray(rows) {
  return rows.map(rowToObject);
}
