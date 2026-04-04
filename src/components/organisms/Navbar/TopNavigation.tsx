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
    <header className={`sticky top-0 ${className}`.trim()}>
      <div className="w-full">
        <div>{leftSlot}</div>
        <div>{centerSlot}</div>
        <div>{rightSlot}</div>
      </div>
    </header>
  )
}

export default TopNavigation
