export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatShortDate(dateString: string | null | undefined): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'short'
  })
}

export function normalizeSlug(text: string): string {
  return text.trim().replace(/\s+/g, '-').toLowerCase()
}
