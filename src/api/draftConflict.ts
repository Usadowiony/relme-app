// Shared by every autosaved draft (modules, quiz layout): the DB raises
// SQLSTATE RL409 when a save carries a stale revision.

const CONFLICT_CODE = 'RL409'

/** Thrown when the draft changed since the editor loaded it (other tab / other admin). */
export class DraftConflictError extends Error {
  constructor(subject = 'Szkic') {
    super(`${subject} został zmieniony w innym oknie lub przez inną osobę.`)
    this.name = 'DraftConflictError'
  }
}

/** Maps a Supabase RPC error to DraftConflictError or a plain Error with a Polish message. */
export function rpcError(error: { code?: string; message?: string }, fallback: string): Error {
  if (error.code === CONFLICT_CODE) return new DraftConflictError()
  return new Error(error.message || fallback)
}
