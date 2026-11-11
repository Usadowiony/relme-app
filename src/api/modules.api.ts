import { supabase } from './supabase'
import type {
  Module,
  ModuleDraft,
  ModuleEditorData,
  ModuleFlowData,
  ModuleListItem,
  ModuleVersion,
} from '../types/modules'
import { assertValidFlowStructure, normalizeFlow, validateFlowContent } from '../utils/moduleFlow'
import { rpcError } from './draftConflict'

// ============================================================
// Modules API — versioning model (T5.2)
// Drafts and versions are written only through admin-checked RPCs; the DB
// also enforces: immutable versions, no deleting anything that was published.
// ============================================================

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


function toDraft(row: Record<string, unknown>): ModuleDraft {
  return { ...(row as ModuleDraft), flow_data: normalizeFlow(row.flow_data) }
}

function toVersion(row: Record<string, unknown>): ModuleVersion {
  return { ...(row as ModuleVersion), flow_data: normalizeFlow(row.flow_data) }
}

// =============================================
// MODULES
// =============================================

/** Lista modułów dla panelu: liczba widoków w szkicu + informacja o wersji live. */
export async function getModules(): Promise<ModuleListItem[]> {
  const [modulesRes, draftsRes] = await Promise.all([
    supabase.from('modules').select('*').order('created_at', { ascending: false }),
    supabase.from('module_drafts').select('module_id, flow_data'),
  ])
  if (modulesRes.error) throw new Error('Nie udało się pobrać modułów.')
  if (draftsRes.error) throw new Error('Nie udało się pobrać szkiców modułów.')

  const modules = (modulesRes.data ?? []) as Module[]
  const liveIds = modules.map(m => m.live_version_id).filter((id): id is string => id !== null)

  const liveRes = liveIds.length
    ? await supabase.from('module_versions').select('id, version_number, name').in('id', liveIds)
    : { data: [], error: null }
  if (liveRes.error) throw new Error('Nie udało się pobrać wersji modułów.')

  const viewCount = new Map(
    (draftsRes.data ?? []).map(d => [d.module_id as string, normalizeFlow(d.flow_data).views.length])
  )
  const liveById = new Map((liveRes.data ?? []).map(v => [v.id as string, v as ModuleListItem['live_version']]))

  return modules.map(m => ({
    ...m,
    draft_view_count: viewCount.get(m.id) ?? 0,
    live_version: m.live_version_id ? liveById.get(m.live_version_id) ?? null : null,
  }))
}

/** Moduł + szkic do edytora. null = moduł nie istnieje. */
export async function getModuleEditorData(id: string): Promise<ModuleEditorData | null> {
  const [moduleRes, draftRes] = await Promise.all([
    supabase.from('modules').select('*').eq('id', id).maybeSingle(),
    supabase.from('module_drafts').select('*').eq('module_id', id).maybeSingle(),
  ])
  if (moduleRes.error || draftRes.error) throw new Error('Błąd podczas pobierania modułu.')
  if (!moduleRes.data || !draftRes.data) return null

  return { module: moduleRes.data as Module, draft: toDraft(draftRes.data) }
}

/** Tworzy nowy moduł (pusty szkic tworzy trigger w bazie). */
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
      description: description?.trim() || null,
      created_by: user?.id ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data as Module
}

/** Aktualizuje metadane modułu (tytuł, opis). */
export async function updateModule(
  id: string,
  updates: { title?: string; description?: string | null }
): Promise<void> {
  await assertAdminRole()

  const { error } = await supabase
    .from('modules')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

/** Usuwa moduł. Baza blokuje usunięcie modułu, który był kiedykolwiek opublikowany. */
export async function deleteModule(id: string): Promise<void> {
  await assertAdminRole()

  const { error } = await supabase.from('modules').delete().eq('id', id)
  if (error) throw new Error(error.message || 'Nie udało się usunąć modułu.')
}

// =============================================
// DRAFT
// =============================================

/**
 * Zapis szkicu z kontrolą rewizji. Zwraca nową rewizję.
 * Rzuca DraftConflictError, gdy szkic zmienił się w międzyczasie.
 */
export async function saveModuleDraft(
  moduleId: string,
  flowData: ModuleFlowData,
  expectedRevision: number
): Promise<number> {
  assertValidFlowStructure(flowData)

  const { data, error } = await supabase.rpc('save_module_draft_rpc', {
    p_module_id: moduleId,
    p_flow_data: flowData,
    p_expected_revision: expectedRevision,
  })
  if (error) throw rpcError(error, 'Nie udało się zapisać modułu.')
  return data as number
}

/** Aktualny stan szkicu w bazie (np. do rozwiązania konfliktu). */
export async function getModuleDraft(moduleId: string): Promise<ModuleDraft> {
  const { data, error } = await supabase.from('module_drafts').select('*').eq('module_id', moduleId).single()
  if (error) throw new Error('Nie udało się pobrać szkicu modułu.')
  return toDraft(data)
}

// =============================================
// VERSIONS
// =============================================

/** Wszystkie wersje modułu, od najnowszej. */
export async function getModuleVersions(moduleId: string): Promise<ModuleVersion[]> {
  const { data, error } = await supabase
    .from('module_versions')
    .select('*')
    .eq('module_id', moduleId)
    .order('version_number', { ascending: false })

  if (error) throw new Error('Nie udało się pobrać wersji modułu.')
  return (data ?? []).map(toVersion)
}

/**
 * Zapisuje aktualny szkic jako nową, nazwaną wersję (także niekompletny).
 * `expectedRevision` gwarantuje, że zapisuje się dokładnie to, co widzi admin.
 */
export async function createModuleVersion(moduleId: string, name: string, expectedRevision: number): Promise<string> {
  const trimmed = name.trim()
  if (trimmed.length === 0 || trimmed.length > 60) {
    throw new Error('Nazwa wersji musi mieć od 1 do 60 znaków.')
  }

  const { data, error } = await supabase.rpc('create_module_version_rpc', {
    p_module_id: moduleId,
    p_name: trimmed,
    p_expected_revision: expectedRevision,
  })
  if (error) throw rpcError(error, 'Nie udało się zapisać wersji.')
  return data as string
}

/** Publikuje wersję (zastępuje dotychczasową wersję live). Wymaga kompletnej treści. */
export async function publishModuleVersion(version: ModuleVersion): Promise<void> {
  if (version.flow_data.views.length === 0) {
    throw new Error('Nie można opublikować wersji bez widoków.')
  }
  const issues = validateFlowContent(version.flow_data)
  if (issues.length > 0) {
    const views = issues.map(i => `#${i.viewIndex + 1}`).join(', ')
    throw new Error(`Wersja jest niekompletna. Uzupełnij widoki: ${views}.`)
  }

  const { error } = await supabase.rpc('publish_module_version_rpc', { p_version_id: version.id })
  if (error) throw rpcError(error, 'Nie udało się opublikować wersji.')
}

/** Usuwa wersję, która nigdy nie była opublikowana (baza blokuje pozostałe). */
export async function deleteModuleVersion(versionId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_module_version_rpc', { p_version_id: versionId })
  if (error) throw rpcError(error, 'Nie udało się usunąć wersji.')
}
