/** Key-order independent JSON (jsonb from the DB reorders object keys). */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.keys(value as Record<string, unknown>)
      .sort()
      .map(k => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`)
    return `{${entries.join(',')}}`
  }
  return JSON.stringify(value)
}

/** Deep equality of JSON-like values, ignoring object key order. */
export function jsonEqual(a: unknown, b: unknown): boolean {
  return a === b || stableStringify(a) === stableStringify(b)
}
