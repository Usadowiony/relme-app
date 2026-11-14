import type { KnowledgeElement, KnowledgeViewConfig } from '../../../../../types/modules'
import { CALLOUT_TITLES } from '../../../../../utils/moduleFlow'
import { richToPlain } from '../../../../../utils/richText'
import { ELEMENT_META } from './theme'

// Timeline card: the first elements as "Label: text", one per line.

const MAX_ROWS = 4

function describe(el: KnowledgeElement): string {
  switch (el.type) {
    case 'heading':
    case 'paragraph':
    case 'image-text':
    case 'section-title':
      return richToPlain(el.text)
    case 'list':
      return el.items.map(richToPlain).filter(s => s.trim()).join(' · ')
    case 'steps':
      return el.steps.map(s => s.title.trim()).filter(Boolean).join(' → ')
    case 'callout':
      return `${CALLOUT_TITLES[el.variant]}: ${richToPlain(el.text)}`
    case 'chat-example':
      return el.reply
  }
}

function rowLabel(el: KnowledgeElement): string {
  return el.type === 'heading' ? `H${el.level}` : ELEMENT_META[el.type].label
}

export function KnowledgeViewSummary({ config, color }: { config: KnowledgeViewConfig; color: string }) {
  const { elements } = config
  if (elements.length === 0) return <p className="text-[13px] text-dark/50">Pusty widok — brak elementów.</p>
  const hidden = elements.length - MAX_ROWS

  return (
    <div className="flex min-w-0 flex-col gap-1">
      {elements.slice(0, MAX_ROWS).map(el => (
        <p key={el.id} className="truncate text-[13px] leading-snug text-dark">
          <span className="font-medium" style={{ color }}>{rowLabel(el)}: </span>
          {describe(el).replace(/\s+/g, ' ').trim() || '—'}
        </p>
      ))}
      {hidden > 0 && <p className="text-[11px] text-dark/50">+{hidden} {hidden === 1 ? 'element' : hidden < 5 ? 'elementy' : 'elementów'} więcej</p>}
    </div>
  )
}
