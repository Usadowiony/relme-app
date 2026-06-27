import { supabase } from './supabase'

import type { Profile, ProfileUpdates } from '../types/auth'

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
      .select('id, first_name, last_name, date_of_birth, gender, avatar_url, created_at, updated_at')
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
  if (updates.first_name !== undefined) {
    if (!updates.first_name || updates.first_name.trim().length < 2) throw new Error('Imię musi mieć co najmniej 2 znaki.');
    if (updates.first_name.length > 60) throw new Error('Imię nie może przekraczać 60 znaków.');
  }
  if (updates.last_name !== undefined) {
    if (!updates.last_name || updates.last_name.trim().length < 2) throw new Error('Nazwisko musi mieć co najmniej 2 znaki.');
    if (updates.last_name.length > 60) throw new Error('Nazwisko nie może przekraczać 60 znaków.');
  }
  if (updates.date_of_birth !== undefined && updates.date_of_birth !== null) {
    const dob = new Date(updates.date_of_birth);
    if (isNaN(dob.getTime())) throw new Error('Nieprawidłowy format daty urodzenia.');
    const age = new Date().getFullYear() - dob.getFullYear();
    const isAdult = age > 18 || (age === 18 && new Date() >= new Date(dob.getFullYear() + 18, dob.getMonth(), dob.getDate()));
    if (!isAdult) throw new Error('Musisz mieć ukończone 18 lat.');
  }

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
    .select('id, first_name, last_name, date_of_birth, gender, avatar_url, created_at, updated_at')
    .single<Profile>()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

function toNormalizedText(value: string | null) {
  return value?.trim() ?? ''
}

export function isProfileOnboardingComplete(profile: Profile) {
  const hasFirstName = toNormalizedText(profile.first_name).length > 0
  const hasLastName = toNormalizedText(profile.last_name).length > 0
  const hasGender = toNormalizedText(profile.gender).length > 0
  const hasDateOfBirth = Boolean(profile.date_of_birth)

  return hasFirstName && hasLastName && hasGender && hasDateOfBirth
}

/** Pobiera status ukończenia quizu z osobnej tabeli user_quiz_status */
export async function getQuizCompleted(): Promise<boolean> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) return false

  const { data } = await supabase
    .from('user_quiz_status')
    .select('quiz_completed')
    .eq('user_id', user.id)
    .maybeSingle()

  return data?.quiz_completed ?? false
}
