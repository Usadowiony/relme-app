import { supabase } from './supabase'
import type { Module, ModuleFlowData } from '../types/modules'
import { assertValidFlowStructure, normalizeFlow, validateFlowContent } from '../utils/moduleFlow'

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

function toModule(row: Record<string, unknown>): Module {
  return { ...(row as Module), flow_data: normalizeFlow(row.flow_data) }
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

  if (error) throw new Error('Nie udało się pobrać modułów.')
  return (data ?? []).map(toModule)
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
  return toModule(data)
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
  return toModule(data)
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

/** Usuwa moduł (lista pokazuje przycisk tylko dla draftów). */
export async function deleteModule(id: string): Promise<void> {
  await assertAdminRole()

  const { error } = await supabase
    .from('modules')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// =============================================
// FLOW + STATUS — RPC
// =============================================

/** Atomowy zapis listy widoków. Tylko draft. Szkic może mieć niepełną treść,
 * ale struktura musi być poprawna. */
export async function saveModuleFlow(
  moduleId: string,
  flowData: ModuleFlowData
): Promise<void> {
  await assertAdminRole()
  assertValidFlowStructure(flowData)

  const { error } = await supabase.rpc('save_module_flow_rpc', {
    p_module_id: moduleId,
    p_flow_data: flowData,
  })

  if (error) throw new Error(error.message ?? 'Nie udało się zapisać modułu.')
}

/** Publikacja: draft → published. Nie wpływa na inne moduły.
 * Wymaga kompletnej treści wszystkich widoków. */
export async function publishModule(moduleId: string, flowData: ModuleFlowData): Promise<void> {
  await assertAdminRole()
  assertValidFlowStructure(flowData)

  if (flowData.views.length === 0) {
    throw new Error('Moduł musi mieć co najmniej jeden widok.')
  }
  const issues = validateFlowContent(flowData)
  if (issues.length > 0) {
    const views = issues.map(i => `#${i.viewIndex + 1}`).join(', ')
    throw new Error(`Uzupełnij widoki: ${views}.`)
  }

  const { error } = await supabase.rpc('publish_module_rpc', { p_module_id: moduleId })
  if (error) throw new Error(error.message ?? 'Nie udało się opublikować modułu.')
}

async function setModuleStatus(moduleId: string, status: 'draft' | 'archived'): Promise<void> {
  await assertAdminRole()

  const { error } = await supabase.rpc('set_module_status_rpc', {
    p_module_id: moduleId,
    p_status: status,
  })
  if (error) throw new Error(error.message ?? 'Nie udało się zmienić statusu modułu.')
}

/** Wycofanie publikacji: published → draft (moduł znika u użytkowników, można edytować). */
export function unpublishModule(moduleId: string): Promise<void> {
  return setModuleStatus(moduleId, 'draft')
}

/** Archiwizacja: draft | published → archived. */
export function archiveModule(moduleId: string): Promise<void> {
  return setModuleStatus(moduleId, 'archived')
}
