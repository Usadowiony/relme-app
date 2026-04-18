import { supabase } from '../lib/supabaseClient'

export type Profile = {
  id: string
  first_name: string | null
  last_name: string | null
  date_of_birth: string | null
  phone_number: string | null
  gender: string | null
  avatar_url: string | null
  quiz_completed: boolean
  created_at: string
  updated_at: string
}

export type ProfileUpdates = Partial<
  Pick<
    Profile,
    'first_name' | 'last_name' | 'date_of_birth' | 'phone_number' | 'gender' | 'avatar_url' | 'quiz_completed'
  >
>

const RETRY_DELAYS_MS = [500, 1000, 2000] as const
const TOTAL_ATTEMPTS = RETRY_DELAYS_MS.length + 1

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export async function getMyProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error(userError?.message ?? 'Nie można pobrać aktualnego użytkownika.')
  }

  let lastErrorMessage = 'Profil nie został przygotowany na czas.'

  for (let attempt = 0; attempt < TOTAL_ATTEMPTS; attempt += 1) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, date_of_birth, phone_number, gender, avatar_url, quiz_completed, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle<Profile>()

    if (data) {
      return data
    }

    if (error) {
      lastErrorMessage = error.message
    }

    if (attempt < RETRY_DELAYS_MS.length) {
      await wait(RETRY_DELAYS_MS[attempt])
    }
  }

  throw new Error(lastErrorMessage)
}

export async function updateMyProfile(updates: ProfileUpdates) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error(userError?.message ?? 'Nie można pobrać aktualnego użytkownika.')
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select('id, first_name, last_name, date_of_birth, phone_number, gender, avatar_url, quiz_completed, created_at, updated_at')
    .single<Profile>()

  if (error) {
    throw new Error(error.message)
  }

  return data
}
