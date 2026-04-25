import type { ReactNode } from 'react'

type TopNavigationProps = {
  leftSlot?: ReactNode
  centerSlot?: ReactNode
  rightSlot?: ReactNode
  className?: string
}

function TopNavigation({
  leftSlot,
  centerSlot,
  rightSlot,
  className = '',
}: TopNavigationProps) {
  return (
    <nav className={`sticky top-0 z-20 w-full px-6 xs:px-10 py-8 ${className}`.trim()}>
      <div className="mx-auto flex w-full items-center justify-between gap-4">
        <div className="min-w-0 flex-1">{leftSlot}</div>
        <div className="shrink-0">{centerSlot}</div>
        <div className="min-w-0 flex-1 flex justify-end">{rightSlot}</div>
      </div>
    </nav>
  )
}

export default TopNavigation
