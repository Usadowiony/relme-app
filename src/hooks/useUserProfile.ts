import { useEffect, useState } from 'react'
import { supabase } from '../api/supabase'
import { getMyProfile, type Profile } from '../api/profile.api'

export type AppRole = 'user' | 'mentor' | 'admin'

export function useUserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [role, setRole] = useState<AppRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const [profileData, roleData] = await Promise.all([
          getMyProfile().catch(() => null),
          supabase.from('user_roles').select('role').eq('user_id', user.id).single()
        ])

        if (!isMounted) return

        if (profileData) {
          setProfile(profileData)
        }
        
        if (roleData.data) {
          setRole(roleData.data.role as AppRole)
        } else {
          setRole('user') // default fallback
        }

      } catch (err) {
        console.error('Failed to load profile data', err)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      isMounted = false
    }
  }, [])

  return { profile, role, isLoading }
}
