import { useState } from 'react'
import { Trash2 } from 'lucide-react'

type TagType = {
  id: number
  name: string
  paths: { label: string; pts: string }[]
  color: string
}

function TagCard({ tag }: { tag: TagType }) {
  const [isActive, setIsActive] = useState(true)

  return (
    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray/20 flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-lg font-semibold text-dark font-manrope">{tag.name}</h3>
        <button className="text-[#D15F5F] opacity-90 hover:opacity-100 transition-opacity cursor-pointer mt-1">
          <Trash2 className="size-[18px]" />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-2 mb-8">
        {tag.paths.map((p, i) => (
          <div key={i} className="text-[13px] text-dark/60 font-medium">
            Ścieżka {p.label}: <span className="font-bold text-dark/70">{p.pts} pkt</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-gray/30 pt-4 mt-auto">
        <div className={`cursor-pointer size-6 rounded-full ${tag.color}`} />
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold tracking-widest text-dark/50 uppercase">Punktowane</span>
          <div
            onClick={() => setIsActive(!isActive)}
            className={`w-[36px] h-[20px] rounded-full flex items-center px-0.5 cursor-pointer transition-colors ${isActive ? 'bg-secondary' : 'bg-dark/30'}`}
          >
            <div className={`size-[16px] bg-white rounded-full transition-transform ${isActive ? 'translate-x-[16px]' : 'translate-x-0'}`} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function TagsTab() {
  const mockTags: TagType[] = [
    { id: 1, name: 'poznaci-siebie', paths: [{ label: 'Małżeństwo', pts: '+45' }, { label: 'Rodzina', pts: '+20' }], color: 'bg-[#405663]' },
    { id: 2, name: 'poznaci-kogos', paths: [{ label: 'Po rozstaniu', pts: '+30' }, { label: 'Samotność', pts: '+15' }], color: 'bg-[#7E8D96]' },
    { id: 3, name: 'pielegnowac-relacje', paths: [{ label: 'Po rozstaniu', pts: '+30' }, { label: 'Samotność', pts: '+15' }], color: 'bg-[#76A8D0]' },
    { id: 4, name: 'bezp-styl', paths: [{ label: 'Małżeństwo', pts: '+45' }, { label: 'Rodzina', pts: '+20' }], color: 'bg-[#8A6A5A]' },
    { id: 5, name: 'lek-styl', paths: [{ label: 'Po rozstaniu', pts: '+30' }, { label: 'Samotność', pts: '+15' }], color: 'bg-[#E3967C]' },
    { id: 6, name: 'unik-styl', paths: [{ label: 'Po rozstaniu', pts: '+30' }, { label: 'Samotność', pts: '+15' }], color: 'bg-[#A39A96]' },
    { id: 7, name: 'singiel', paths: [{ label: 'Małżeństwo', pts: '+45' }, { label: 'Rodzina', pts: '+20' }], color: 'bg-[#89A167]' },
    { id: 8, name: 'trudn-rel', paths: [{ label: 'Po rozstaniu', pts: '+30' }, { label: 'Samotność', pts: '+15' }], color: 'bg-[#A6BD6A]' },
    { id: 9, name: 'stabil-rel', paths: [{ label: 'Po rozstaniu', pts: '+30' }, { label: 'Samotność', pts: '+15' }], color: 'bg-[#556942]' },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
      {mockTags.map((tag) => (
        <TagCard key={tag.id} tag={tag} />
      ))}
    </div>
  )
}
