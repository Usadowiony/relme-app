import type { ReactNode } from 'react'
import { UserRound } from 'lucide-react'

/**
 * Neutral avatar placeholder. The real character is chosen by the mobile app
 * from the user's gender (and real graphics come from the media library later).
 */
export function AvatarCircle() {
  return (
    <div
      title="Postać rozmówcy dobiera aplikacja na podstawie płci użytkownika"
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E6EAEC] text-[#7A868C]"
    >
      <UserRound className="size-[18px]" />
    </div>
  )
}

/** Outer "phone screen" frame with the white chat card, shared by messenger editor views. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="w-full rounded-[18px] border border-dark/25 bg-[#F4F4F4] p-3 sm:p-4">
      <div className="rounded-[16px] border border-gray/40 bg-white px-4 py-5 shadow-sm sm:px-5">{children}</div>
    </div>
  )
}
