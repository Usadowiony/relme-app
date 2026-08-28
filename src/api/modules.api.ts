import { supabase } from './supabase'
import type { Module, ModuleFlowData } from '../types/modules'

// --- Asercja autoryzacyjna (defense-in-depth) ---
// Odpytuje tabelę user_roles zamiast user_metadata,
// ponieważ user_metadata jest edytowalne z klienta (updateUser).
async function assertAdminRole(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Brak zalogowanego użytkownika.')

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (roleData?.role !== 'admin') {
    throw new Error('Brak uprawnień administratora.')
  }
}

// =============================================
// MODULES CRUD
// =============================================

/** Pobiera listę wszystkich modułów (admin: all, user: published only — RLS). */
export async function getModules(): Promise<Module[]> {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching modules:', error.message)
    return []
  }
  return (data ?? []) as Module[]
}

/** Pobiera pojedynczy moduł z pełnym flow_data. */
export async function getModuleById(id: string): Promise<Module | null> {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw new Error('Błąd podczas pobierania modułu.')
  }
  return data as Module
}

/** Tworzy nowy moduł ze statusem draft. */
export async function createModule(title: string, description?: string): Promise<Module> {
  await assertAdminRole()

  if (!title || title.trim().length === 0) {
    throw new Error('Tytuł modułu nie może być pusty.')
  }

  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('modules')
    .insert({
      title: title.trim(),
      description: description?.trim() ?? null,
      created_by: user?.id ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data as Module
}

/** Aktualizuje metadane modułu (tytuł, opis). Tylko draft. */
export async function updateModule(
  id: string,
  updates: { title?: string; description?: string | null }
): Promise<void> {
  await assertAdminRole()

  const { error } = await supabase
    .from('modules')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'draft')

  if (error) throw error
}

/** Usuwa moduł. Tylko draft (RPC nie pozwoli na inne statusy). */
export async function deleteModule(id: string): Promise<void> {
  await assertAdminRole()

  const { error } = await supabase
    .from('modules')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// =============================================
// FLOW (GRAPH) OPERATIONS — RPC
// =============================================

/** Atomowy zapis grafu flow_data. Tylko dla modułów w statusie draft.
 * PERFORMANCE NOTE: Przy każdym wywołaniu przesyłany jest cały graf JSONB.
 * MVP-akceptowalne. Przyszła optymalizacja: JSON Patch (zapis różnicowy).
 */
export async function saveModuleFlow(
  moduleId: string,
  flowData: ModuleFlowData
): Promise<void> {
  await assertAdminRole()

  const { error } = await supabase.rpc('save_module_flow_rpc', {
    p_module_id: moduleId,
    p_flow_data: flowData,
  })

  if (error) {
    console.error('Error saving module flow:', error)
    throw new Error(error.message ?? 'Nie udało się zapisać grafu modułu.')
  }
}

/** Atomowa publikacja modułu: draft → published, poprzedni published → archived. */
export async function publishModule(moduleId: string): Promise<void> {
  await assertAdminRole()

  const { error } = await supabase.rpc('publish_module_rpc', {
    p_module_id: moduleId,
  })

  if (error) {
    console.error('Error publishing module:', error)
    throw new Error(error.message ?? 'Nie udało się opublikować modułu.')
  }
}

// =============================================
// DRAFT MANAGEMENT (localStorage)
// =============================================

const MODULE_DRAFT_KEY_PREFIX = 'relme_module_draft_'

function getDraftKey(moduleId: string): string {
  return `${MODULE_DRAFT_KEY_PREFIX}${moduleId}`
}

export function saveModuleDraftToLocal(moduleId: string, flowData: ModuleFlowData): void {
  const draft = {
    moduleId,
    flowData,
    lastModified: new Date().toISOString(),
  }
  localStorage.setItem(getDraftKey(moduleId), JSON.stringify(draft))
}

export function loadModuleDraftFromLocal(moduleId: string): ModuleFlowData | null {
  const data = localStorage.getItem(getDraftKey(moduleId))
  if (!data) return null
  try {
    const parsed = JSON.parse(data)
    return parsed.flowData ?? null
  } catch {
    return null
  }
}

export function clearModuleLocalDraft(moduleId: string): void {
  localStorage.removeItem(getDraftKey(moduleId))
}
