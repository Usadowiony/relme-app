import type { ReactNode } from 'react'
import { UserRound } from 'lucide-react'
import type { MessengerAvatar } from '../../../../../types/modules'
import { AVATARS } from './theme'

/** Static avatar placeholder (real graphics come from the media library later). */
export function AvatarCircle({ avatar }: { avatar: MessengerAvatar | null }) {
  const style = AVATARS[avatar ?? 'female']
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: style.bg, color: style.color }}>
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
