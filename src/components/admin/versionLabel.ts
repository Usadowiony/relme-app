// Types + helpers for the shared VersionControlModal (kept apart from the
// component file so React Fast Refresh works).

export type VersionStatus = 'saved' | 'live' | 'archived'

/** What the modal needs to know about one saved version. */
export type VersionRowData = {
  id: string
  number: number
  name: string
  createdAt: string
  publishedAt: string | null
  status: VersionStatus
  /** e.g. "12 widoków", "40 pytań" */
  summary: string
  /** Problems that block publishing (empty = complete). */
  issues: string[]
}

export const versionLabel = (v: Pick<VersionRowData, 'number' | 'name'>) => `v${v.number} „${v.name}”`

export function pluralPl(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one
  const mod10 = n % 10
  const mod100 = n % 100
  return mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? few : many
}
