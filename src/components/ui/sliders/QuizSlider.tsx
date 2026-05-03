import { useRef, useLayoutEffect, useState } from 'react'
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion'
import type { Answer } from '../../../types/quiz'

type Props = {
  answers: Answer[]
  valueIndex: number
  onChangeIndex: (idx: number) => void
}

export default function QuizSlider({ answers, valueIndex, onChangeIndex }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const thumbRef = useRef<HTMLDivElement | null>(null)
  const x = useMotionValue(0)
  const controls = useAnimation()
  const [width, setWidth] = useState(0)

  // Nasłuchiwanie na zmiany wymiarów okna i startowa pozycja
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setWidth(rect.width)

    // Ustawienie suwaka na prawidłowej pozycji przy renderze
    const px = (valueIndex / Math.max(1, answers.length - 1)) * rect.width
    controls.set({ x: px })
    x.set(px)
  }, [containerRef, answers.length, valueIndex, controls, x])

  // Płynne wypełnianie paska postępu
  const fillWidth = useTransform(x, (v) => {
    if (width === 0) return '0%'
    const pct = Math.max(0, Math.min(1, v / width)) * 100
    return `${pct}%`
  })

  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

  return (
    <div className="w-full">
      <div ref={containerRef} className="relative w-full h-8 flex items-center">
        {/* Tło paska */}
        <div className="absolute left-0 right-0 h-4.5 bg-[#E5E9EB] rounded-full overflow-hidden" />

        {/* Aktywne wypełnienie paska */}
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-4.5 bg-primary rounded-full"
          style={{ width: fillWidth }}
        />

        {/* Draggable Thumb (Kółko suwaka) */}
        <motion.div
          ref={thumbRef}
          animate={controls}
          className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 md:-ml-[14px] w-7.5 h-7.5 bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.15)] flex items-center justify-center z-20 touch-none cursor-grab active:cursor-grabbing"
          style={{ x }}
          drag="x"
          dragElastic={0}
          dragConstraints={containerRef}
          onDrag={(_, info) => {
            const px = info.point.x - (containerRef.current?.getBoundingClientRect().left || 0)
            const clamped = clamp(px, 0, width)
            x.set(clamped)
          }}
          onDragEnd={async (_, info) => {
            const px = info.point.x - (containerRef.current?.getBoundingClientRect().left || 0)
            const clamped = clamp(px, 0, width)
            const pct = width > 0 ? clamped / width : 0
            const idx = Math.round(pct * Math.max(0, answers.length - 1))

            const targetPx = (idx / Math.max(1, answers.length - 1)) * width
            await controls.start({ x: targetPx, transition: { type: 'spring', stiffness: 400, damping: 30 } })
            x.set(targetPx)
            onChangeIndex(idx)
          }}
        >
          <div className="w-[17px] h-[17px] md:w-3 md:h-3 rounded-full bg-[#3A5A60]" />
        </motion.div>

        {/* Niewidoczne strefy kliknięcia */}
        <div className="absolute inset-0 z-10 flex items-center">
          {answers.map((a, i) => (
            <button
              key={a.id}
              onClick={() => {
                const targetPx = (i / Math.max(1, answers.length - 1)) * width
                controls.start({ x: targetPx, transition: { type: 'spring', stiffness: 400, damping: 30 } })
                x.set(targetPx)
                onChangeIndex(i)
              }}
              className="flex-1 h-full bg-transparent"
              aria-label={`Wybierz krok ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}