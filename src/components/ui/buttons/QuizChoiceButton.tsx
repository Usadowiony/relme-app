import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'

type Props = {
  isSelected: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}

export default function QuizChoiceButton({ isSelected, onClick, children, className = '' }: Props) {
  return (
    <div className="relative w-full">
      <div
        className={`absolute inset-0 rounded-[12px] md:rounded-[16px] translate-y-[4px] transition-colors duration-300 z-0 ${isSelected ? 'bg-[#216371]' : 'bg-[#E0E0E0]'
          }`}
      />

      <motion.button
        whileTap={{ y: 4 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        onClick={onClick}
        className={`md:cursor-pointer relative z-10 w-full flex items-center pt-3 p-2.5 2xs:pt-3.5 2xs:p-3 2sm:pt-4 2sm:pb-3.5 2sm:px-4 rounded-[12px] md:rounded-[16px] text-left outline-none transition-colors duration-300 ${isSelected
          ? 'bg-[#2B6A73] text-white border-1 border-inset border-[#216371]'
          : 'bg-[#F0F2F4] text-dark border-1 border-inset border-[#E0E0E0] hover:bg-[#EEF0F2]'
          } ${className}`}
      >
        <div
          className={`flex-shrink-0 w-6 h-6 3xl:w-7 3xl:h-7 rounded-full mr-4 flex items-center justify-center transition-colors duration-300 ${isSelected ? 'border-2  border-[#558C9B] bg-[#558C9B]' : 'bg-[#E4E7E9] border-2 border-white/50 '
            }`}
        >
          <AnimatePresence>
            {isSelected && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: 0.1, duration: 0.15, type: 'spring', stiffness: 220 }}
                className="w-[14px] h-[14px] 2sm:w-[16px] 2sm:h-[16px] md:w-4 md:h-4 rounded-full flex items-center justify-center"
              >
                <Check className="w-3 h-3 xs:w-3.5 xs:h-3.5 md:w-3 md:h-3 text-white" strokeWidth={4.5} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <span className="font-semibold text-[12px] 2xs:text-[13px] xs:text-[14px] 2sm:text-[15px] 3xl:text-[16px] leading-snug">{children}</span>
      </motion.button>
    </div>
  )
}
