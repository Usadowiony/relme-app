import { useState } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle, Info } from 'lucide-react'
import { BaseModal } from './BaseModal'
import { AsyncButton } from '../buttons/Button'

// Shared confirmation popup for admin actions with consequences
// (publish, delete, load a version over the draft, overwrite …).
// Always says WHAT will happen and WHAT IT MEANS, then Tak / Nie.

export type ConfirmDialogProps = {
  open: boolean
  title: string
  subtitle?: string
  /** What is about to happen. */
  description: ReactNode
  /** Bullet list of consequences shown in a highlighted box. */
  consequences?: ReactNode[]
  confirmLabel: string
  cancelLabel?: string
  /** `danger` = irreversible / destructive (red confirm button). */
  tone?: 'default' | 'danger'
  /** May be async; while pending the button shows a loader, errors are shown in the dialog. */
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

/** Mount with `open`; the caller closes it (sets open=false) after a successful confirm. */
export function ConfirmDialog({
  open,
  title,
  subtitle = 'Potwierdź akcję',
  description,
  consequences,
  confirmLabel,
  cancelLabel = 'Anuluj',
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setIsPending(true)
    setError(null)
    try {
      await onConfirm()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Coś poszło nie tak. Spróbuj ponownie.')
    } finally {
      setIsPending(false)
    }
  }

  const handleCancel = () => {
    if (isPending) return
    setError(null)
    onCancel()
  }

  const danger = tone === 'danger'
  const Icon = danger ? AlertTriangle : Info

  return (
    <BaseModal
      isOpen={open}
      onClose={handleCancel}
      maxWidth="md"
      subtitle={subtitle}
      title={title}
      footer={
        <>
          <AsyncButton variant="cancel" onClick={handleCancel} disabled={isPending}>
            {cancelLabel}
          </AsyncButton>
          {danger ? (
            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={isPending}
              className="rounded-full bg-[#C03448] px-6 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#A82B3E] disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
            >
              {isPending ? 'Proszę czekać…' : confirmLabel}
            </button>
          ) : (
            <AsyncButton variant="dark" onClick={() => void handleConfirm()} isLoading={isPending}>
              {confirmLabel}
            </AsyncButton>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="text-[14px] leading-relaxed text-dark/80">{description}</div>

        {consequences && consequences.length > 0 && (
          <div
            className={`flex gap-3 rounded-[14px] border px-4 py-3 ${
              danger ? 'border-red-200 bg-red-50 text-[#7A2533]' : 'border-amber-200 bg-amber-50 text-amber-900'
            }`}
          >
            <Icon className="mt-0.5 size-4 shrink-0" />
            <ul className="flex flex-col gap-1 text-[13px] leading-snug">
              {consequences.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-[#7A2533]">{error}</div>
        )}
      </div>
    </BaseModal>
  )
}
