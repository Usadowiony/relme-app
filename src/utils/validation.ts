import type { Tag } from '../types/quiz'

export function validateTagPayload(tag: Partial<Pick<Tag, 'slug' | 'color' | 'is_scored'>>): void {
  if (tag.slug !== undefined) {
    if (!tag.slug || tag.slug.trim().length === 0) {
      throw new Error('Slug tagu nie może być pusty.')
    }
    if (tag.slug.length > 20) {
      throw new Error('Slug tagu nie może przekraczać 20 znaków.')
    }
  }
  if (tag.color !== undefined && tag.color !== null) {
    if (!/^#[0-9a-fA-F]{6}$/.test(tag.color)) {
      throw new Error('Nieprawidłowy format koloru. Wymagany format HEX (np. #FF0000).')
    }
  }
}
