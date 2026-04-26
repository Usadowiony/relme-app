import { Pencil, Trash2 } from 'lucide-react'

export function QuestionsTab() {
  const mockQuestions = [
    {
      id: '1',
      number: '01',
      type: 'POJEDYŃCZEGO WYBORU',
      text: 'Jak opisałbyś swój obecny stan emocjonalny?',
      options: ['Spokojny', 'Zaniepokojony', 'Zestresowany', 'Neutralny'],
      color: 'bg-[#DDE9F4]',
    },
    {
      id: '2',
      number: '02',
      type: 'WIELOKROTNEGO WYBORU',
      text: 'W jakich obszarach szukasz wsparcia?',
      options: ['Relacje międzyludzkie', 'Kariera zawodowa', 'Poczucie własnej wartości', '+2 inne'],
      color: 'bg-[#F8E2D7]',
    },
    {
      id: '3',
      number: '03',
      type: 'SKALA',
      text: 'Jak często odczuwasz samotność w ciągu ostatniego tygodnia?',
      options: [],
      isScale: true,
      color: 'bg-[#DDE9F4]',
    },
  ]

  return (
    <div className="flex flex-col gap-6 mt-8">
      {mockQuestions.map((q) => (
        <div key={q.id} className="bg-white rounded-[20px] p-8 shadow-soft relative flex gap-8">
          {/* Timeline / Number line mock */}
          <div className="absolute left-[54px] top-[90px] bottom-[-24px] w-px bg-gray/30 last:hidden" />

          {/* Number Bubble */}
          <div className="flex-shrink-0 z-10">
            <div className={`size-[44px] rounded-full flex items-center justify-center font-manrope font-bold text-lg text-dark ${q.color}`}>
              {q.number}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 pt-1">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] lg:text-[11px] font-bold tracking-widest text-dark/50 uppercase">
                {q.type}
              </span>
              <div className="flex items-center gap-4">
                <button className="text-primary-2 opacity-90 hover:opacity-100 transition-opacity cursor-pointer">
                  <Pencil className="size-[18px]" />
                </button>
                <button className="text-[#D15F5F] opacity-90 hover:opacity-100 transition-opacity cursor-pointer">
                  <Trash2 className="size-[18px]" />
                </button>
              </div>
            </div>

            <h3 className="text-[16px] lg:text-[18px] xl:text-[20px] font-semibold text-dark mb-6 font-manrope">
              {q.text}
            </h3>

            {q.isScale ? (
              <div className="mt-8 px-2">
                <div className="relative h-2 w-full">
                  <div className="h-full w-full bg-[#EAEAEA] rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-1/2 rounded-full" />
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-5 bg-white border-[4px] border-primary rounded-full shadow-sm" />
                </div>
                <div className="relative h-4 mt-3 text-[9px] xl:text-[10px] font-bold tracking-widest text-dark/50 uppercase">
                  <span className="absolute left-0">Nigdy</span>
                  <span className="absolute left-1/2 -translate-x-1/2">Czasami</span>
                  <span className="absolute right-0">Bardzo często</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt, idx) => (
                  <div key={idx} className="bg-[#F1F3F5] text-dark/70 text-[11px] lg:text-[12px] xl:text-[13px] font-medium px-4 py-2 rounded-full">
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
