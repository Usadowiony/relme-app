import { Pencil, Trash2, Plus, Split } from 'lucide-react'

export function LayoutTab() {
  return (
    <div className="flex flex-col items-center mt-8 pb-20 relative">
      {/* Central line */}
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-gray/30 -z-10" />

      {/* Question Card */}
      <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray/20 w-full max-w-2xl xl:max-w-3xl relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="bg-primary-2/25 text-black text-[10px] font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full">
            Pytanie 1
          </div>
          <div className="flex items-center gap-3">
            <button className="text-primary-2 opacity-90 hover:opacity-100 transition-opacity cursor-pointer">
              <Pencil className="size-[18px]" />
            </button>
            <button className="text-[#D15F5F] opacity-90 hover:opacity-100 transition-opacity cursor-pointer">
              <Trash2 className="size-[18px]" />
            </button>
          </div>
        </div>

        <h3 className="text-[18px] xl:text-[20px] font-semibold text-dark mb-6 font-manrope">
          Jak opisał/a byś swoją obecną relację?
        </h3>

        <div className="flex flex-col gap-3">
          <div className="border border-gray/50 rounded-[16px] p-4 flex items-center justify-between bg-white hover:bg-neutral transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="size-[28px] xl:size-[32px] rounded-full bg-primary-2/25 text-black font-bold text-xs xl:text-sm flex items-center justify-center">
                A
              </div>
              <span className="text-[13px] xl:text-[15px] font-medium text-dark">Jestem w stabilnej relacji</span>
            </div>
            <div className="text-[13px] text-dark/50 font-medium">
              → Ścieżka: <span className="text-dark/70 font-semibold">Harmonia</span>
            </div>
          </div>

          <div className="border border-gray/50 rounded-[16px] p-4 flex items-center justify-between bg-white hover:bg-neutral transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="size-[28px] xl:size-[32px] rounded-full bg-primary-2/25 text-black font-bold text-xs xl:text-sm flex items-center justify-center">
                B
              </div>
              <span className="text-[13px] xl:text-[15px] font-medium text-dark">Przechodzimy trudny moment</span>
            </div>
            <div className="text-[13px] text-dark/50 font-medium">
              → Ścieżka: <span className="text-dark/70 font-semibold">Emocje</span>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Line */}
      <div className="w-px h-10 bg-gray/30" />

      {/* Path Block */}
      <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray/20 w-full max-w-2xl xl:max-w-3xl relative z-10 text-center">
        <div className="flex items-center justify-center gap-2 text-[11px] font-bold tracking-widest text-dark/50 uppercase mb-6">
          <Split className="size-[12px]" />
          Ścieżka Harmonia
        </div>

        <button className="w-full py-4 rounded-[12px] bg-neutral text-dark/50 hover:text-dark hover:bg-gray/20 transition-colors font-bold text-[11px] tracking-widest uppercase cursor-pointer border border-dashed border-gray">
          + Dodaj zagnieżdżone pytanie
        </button>
      </div>

      {/* Add New Question Button */}
      <div className="mt-12 bg-white size-[60px] rounded-full shadow-sm border border-gray/30 flex items-center justify-center cursor-pointer hover:bg-neutral transition-colors z-10 relative">
        <Plus className="size-6 text-dark/70" />
      </div>
      <div className="mt-4 text-[10px] font-bold tracking-widest text-dark/50 uppercase">
        Nowe Pytanie
      </div>
    </div>
  )
}
