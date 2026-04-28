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

export type ProfileGender = 'male' | 'female' | 'other'

export type ProfileUpdates = Partial<
  Pick<
    Profile,
    'first_name' | 'last_name' | 'date_of_birth' | 'phone_number' | 'gender' | 'avatar_url' | 'quiz_completed'
  >
>

export type AppRole = 'user' | 'mentor' | 'admin'
