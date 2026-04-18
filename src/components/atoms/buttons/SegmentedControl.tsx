import type { ReactNode } from 'react'

type SegmentedOption = {
  value: string
  label: ReactNode
  disabled?: boolean
}

type SegmentedDistribution = 'fixed' | 'equal'

type SegmentedControlProps = {
  options: SegmentedOption[]
  value: string
  onChange: (value: string) => void
  className?: string
  fullWidth?: boolean
  distribution?: SegmentedDistribution
  itemWidth?: number
  ariaLabel?: string
}

export function SegmentedControl({
  options,
  value,
  onChange,
  className = '',
  fullWidth = false,
  distribution = 'fixed',
  itemWidth = 190,
  ariaLabel = 'Segmented control',
}: SegmentedControlProps) {
  const activeIndex = options.findIndex((option) => option.value === value)
  const selectedIndex = activeIndex >= 0 ? activeIndex : 0
  const segmentCount = options.length > 0 ? options.length : 1

  const indicatorStyle =
    distribution === 'equal'
      ? {
          width: `${100 / segmentCount}%`,
          transform: `translateX(${selectedIndex * 100}%)`,
        }
      : {
          width: `${itemWidth}px`,
          transform: `translateX(${selectedIndex * itemWidth}px)`,
        }

  return (
    <div
      className={`relative inline-flex rounded-full bg-[#D9DEE2]/30 p-[6px] sm:p-[4px] ${fullWidth && distribution === 'equal' ? 'w-full' : 'w-auto'} ${className}`.trim()}
      role="tablist"
      aria-label={ariaLabel}
    >
      <div className="pointer-events-none absolute inset-[6px]">
        <div
          className="h-full rounded-full bg-white transition-transform duration-300 ease-out"
          style={indicatorStyle}
        />
      </div>

      {options.map((option) => {
        const isActive = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={[
              'relative z-10 rounded-full px-7 2xs:px-8 py-3 2xs:py-4 font-inter text-[11px] 2xs:text-[12px] sm:text-[14px] font-semibold text-center transition-colors duration-200',
              distribution === 'equal' ? 'flex-1' : '',
              isActive ? 'text-black' : 'text-black/75 hover:text-black',
              option.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
            ].join(' ')}
            style={distribution === 'fixed' ? { width: `${itemWidth}px` } : undefined}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export default SegmentedControl