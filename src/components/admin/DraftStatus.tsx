import { useState } from 'react'
import { Check, CircleAlert, Loader2, RefreshCw } from 'lucide-react'
import type { SaveStatus } from '../../hooks/useDraftAutosave'
import { ConfirmDialog } from '../ui/popups/ConfirmDialog'

// Draft autosave UI shared by the module editor and the quiz panel.

/** Small "Zapisano / Zapisywanie… / Błąd / Konflikt" indicator for the header. */
export function SaveIndicator({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  if (status === 'conflict') {
    return (
      <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#B26B00]">
        <CircleAlert className="size-4" /> Konflikt — zmiany niezapisane
      </span>
    )
  }
  if (status === 'error') {
    return (
      <button type="button" onClick={onRetry} className="flex items-center gap-1.5 text-[12px] font-medium text-[#C03448] cursor-pointer hover:underline">
        <CircleAlert className="size-4" /> Błąd zapisu — ponów
      </button>
    )
  }
  if (status === 'saving' || status === 'pending') {
    return (
      <span className="flex items-center gap-1.5 text-[12px] text-dark/50">
        <Loader2 className="size-4 animate-spin" /> Zapisywanie…
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1.5 text-[12px] text-dark/50">
      <Check className="size-4" /> Zapisano
    </span>
  )
}

type DraftConflictNoticeProps = {
  /** e.g. "Ten moduł" / "Układ quizu" */
  subject: string
  onOverwrite: () => Promise<void>
}

/**
 * Bar shown when the draft was saved elsewhere meanwhile: reload the newest
 * state, or keep what is on screen (with a confirmation of what gets lost).
 */
export function DraftConflictNotice({ subject, onOverwrite }: DraftConflictNoticeProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-amber-200 bg-amber-50 px-5 py-4 text-[14px] text-amber-900">
        <span>
          {subject} został zmieniony w innym oknie lub przez inną osobę. Twoje ostatnie zmiany <b>nie zostały zapisane</b>.
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-dark shadow-sm hover:bg-neutral cursor-pointer"
          >
            <RefreshCw className="size-4" /> Wczytaj aktualny stan
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="rounded-full px-4 py-2 text-[13px] font-semibold text-[#A82B3E] hover:bg-red-50 cursor-pointer"
          >
            Zachowaj moje zmiany…
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        tone="danger"
        title="Zachować Twoje zmiany?"
        description="Szkic został w międzyczasie zapisany w innym oknie lub przez inną osobę. Możesz nadpisać go tym, co widzisz teraz na ekranie."
        consequences={[
          'Zmiany zapisane w innym oknie lub przez inną osobę zostaną utracone.',
          'Zapisane wersje i wersja live się nie zmienią.',
        ]}
        confirmLabel="Tak, nadpisz szkic"
        onConfirm={async () => {
          await onOverwrite()
          setConfirmOpen(false)
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}
