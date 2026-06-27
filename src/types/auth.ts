export type Profile = {
  id: string
  first_name: string | null
  last_name: string | null
  date_of_birth: string | null
  gender: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type ProfileGender = 'male' | 'female' | 'other'

export type ProfileUpdates = Partial<
  Pick<
    Profile,
    'first_name' | 'last_name' | 'date_of_birth' | 'gender' | 'avatar_url'
  >
>

export type AppRole = 'user' | 'mentor' | 'admin'
