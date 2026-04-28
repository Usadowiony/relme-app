
export function BackgroundGradient() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-neutral">
      {/* Primary 1 70% */}
      <div
        className="absolute w-[800px] h-[800px] rounded-full bg-primary/70 blur-[160px] opacity-10"
        style={{ top: '-20%', left: '-10%' }}
      />

      {/* Primary 2 20% */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full bg-primary-2/20 blur-[130px] opacity-20"
        style={{ bottom: '-10%', right: '-5%' }}
      />

      {/* Secondary 70% */}
      <div
        className="absolute w-[700px] h-[700px] rounded-full bg-secondary/70 blur-[130px] opacity-8"
        style={{ top: '40%', left: '25%' }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-50 bg-gradient-to-b from-neutral to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-50 bg-gradient-to-t from-neutral to-transparent" />
    </div>
  )
}

export default BackgroundGradient
