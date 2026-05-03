import { useState, useEffect } from 'react'
import type { Question, Tag, QuestionType, AnswerPayload } from '../../../../types/quiz'

type UseQuestionFormProps = {
  isOpen: boolean
  initialData?: Question | null
  availableTags: Tag[]
  onSave: (payload: { content: string, question_type: QuestionType, media_url?: string }, answers: AnswerPayload[]) => Promise<void> | void
}

export function useQuestionForm({ isOpen, initialData, availableTags, onSave }: UseQuestionFormProps) {
  const [content, setContent] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [questionType, setQuestionType] = useState<QuestionType>('single')
  const [answers, setAnswers] = useState<AnswerPayload[]>([])
  const [error, setError] = useState('')
  const [answerErrors, setAnswerErrors] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Scale specific state
  const [scaleLabels, setScaleLabels] = useState({ start: '', end: '' })

  // Tag selection inline list state - allows multiple to be open
  const [openTagDropdownIdxs, setOpenTagDropdownIdxs] = useState<number[]>([])

  useEffect(() => {
    if (isOpen) {
      setContent(initialData?.content || '')
      const media = initialData?.media_assets as any
      setMediaUrl(media?.file_url || '')
      setQuestionType(initialData?.question_type || 'single')

      let initialOpenIdxs: number[] = []

      if (initialData?.question_type === 'scale') {
        if (initialData?.answers && initialData.answers.length > 0) {
          const sortedAnswers = [...initialData.answers].sort((a, b) => {
            try {
              const va = JSON.parse(a.content).value || 0
              const vb = JSON.parse(b.content).value || 0
              return va - vb
            } catch { return 0 }
          })

          let labelsFound = false
          for (const ans of sortedAnswers) {
            try {
              const parsed = JSON.parse(ans.content)
              if (parsed.start !== undefined) {
                setScaleLabels({
                  start: parsed.start || '',
                  end: parsed.end || ''
                })
                labelsFound = true
                break
              }
            } catch { /* skip */ }
          }
          if (!labelsFound) {
            setScaleLabels({ start: '', end: '' })
          }

          const mappedAnswers = sortedAnswers.map((a, idx) => {
            const tags = a.answer_tags?.map(at => ({
              tag_id: at.tag_id,
              points: at.points || 0
            })) || []

            if (tags.length > 0) initialOpenIdxs.push(idx)
            return { id: a.id, content: a.content, tags }
          })
          setAnswers(mappedAnswers)
        }
      } else {
        if (initialData?.answers && initialData.answers.length > 0) {
          const mappedAnswers = initialData.answers.map((a, idx) => {
            const tags = a.answer_tags?.map(at => ({
              tag_id: at.tag_id,
              points: at.points || 0
            })) || []

            if (tags.length > 0) initialOpenIdxs.push(idx)
            return { id: a.id, content: a.content, tags }
          })
          setAnswers(mappedAnswers)
        } else {
          setAnswers([{ content: '', tags: [] }])
        }
        setScaleLabels({ start: '', end: '' })
      }

      setError('')
      setAnswerErrors([])
      setOpenTagDropdownIdxs(initialOpenIdxs)
    }
  }, [isOpen, initialData])

  useEffect(() => {
    if (!isOpen) return
    if (questionType === 'scale') {
      const hasDbAnswers = answers.length === 10 && answers.some(a => 'id' in a && a.id)
      if (answers.length !== 10 && !hasDbAnswers) {
        const newAnswers = Array.from({ length: 10 }).map((_, i) => ({
          content: JSON.stringify({ value: i + 1 }),
          tags: []
        }))
        setAnswers(newAnswers)
        setAnswerErrors(Array(10).fill(''))
      }
    } else {
      if (answers.length === 10 && answers.every((a) => a.content.includes('"value":'))) {
        setAnswers([{ content: '', tags: [] }])
        setAnswerErrors([''])
      }
    }
  }, [questionType, isOpen])

  const handleAddAnswer = () => {
    if (questionType === 'scale') return
    setAnswers([...answers, { content: '', tags: [] }])
    setAnswerErrors([...answerErrors, ''])
  }

  const handleRemoveAnswer = (idx: number) => {
    if (questionType === 'scale') return
    if (answers.length <= 1) return
    const newAnswers = [...answers]
    newAnswers.splice(idx, 1)
    setAnswers(newAnswers)

    const newErrors = [...answerErrors]
    newErrors.splice(idx, 1)
    setAnswerErrors(newErrors)

    setOpenTagDropdownIdxs(prev => {
      return prev.map(i => (i > idx ? i - 1 : i)).filter(i => i !== idx)
    })
  }

  const handleAnswerContentChange = (idx: number, val: string) => {
    const newAnswers = [...answers]
    newAnswers[idx].content = val
    setAnswers(newAnswers)

    if (answerErrors[idx]) {
      const newErrors = [...answerErrors]
      newErrors[idx] = ''
      setAnswerErrors(newErrors)
    }
  }

  const toggleDropdown = (idx: number) => {
    setOpenTagDropdownIdxs(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    )
  }

  const toggleTagForAnswer = (ansIdx: number, tagId: string) => {
    const newAnswers = [...answers]
    const currentTags = newAnswers[ansIdx].tags
    const exists = currentTags.find(t => t.tag_id === tagId)
    if (exists) {
      newAnswers[ansIdx].tags = currentTags.filter(t => t.tag_id !== tagId)
    } else {
      newAnswers[ansIdx].tags = [...currentTags, { tag_id: tagId, points: 0 }]
    }
    setAnswers(newAnswers)

    if (answerErrors[ansIdx]) {
      const newErrors = [...answerErrors]
      newErrors[ansIdx] = ''
      setAnswerErrors(newErrors)
    }
  }

  const updateTagPointsForAnswer = (ansIdx: number, tagId: string, points: number) => {
    const newAnswers = [...answers]
    const tag = newAnswers[ansIdx].tags.find(t => t.tag_id === tagId)
    if (tag) {
      tag.points = points
    }
    setAnswers(newAnswers)

    if (answerErrors[ansIdx]) {
      const newErrors = [...answerErrors]
      newErrors[ansIdx] = ''
      setAnswerErrors(newErrors)
    }
  }

  const handleSave = async () => {
    let isValid = true
    const newAnswerErrors = Array(answers.length).fill('')

    if (!content.trim()) {
      setError('Treść pytania nie może być pusta.')
      isValid = false
    }

    if (questionType === 'scale') {
      if (!scaleLabels.start.trim() || !scaleLabels.end.trim()) {
        setError('Wszystkie etykiety skali (początek, koniec) muszą być uzupełnione.')
        isValid = false
      }
    } else {
      if (answers.length < 2) {
        setError('Pytanie jednokrotnego i wielokrotnego wyboru musi mieć minimum 2 odpowiedzi.')
        isValid = false
      }
    }

    answers.forEach((ans, idx) => {
      if (questionType !== 'scale' && !ans.content.trim()) {
        newAnswerErrors[idx] = 'Odpowiedź nie może być pusta.'
        isValid = false
      }

      const invalidScoredTags = ans.tags.filter(tagObj => {
        const t = availableTags.find(x => x.id === tagObj.tag_id)
        if (t && t.is_scored && (tagObj.points === undefined || tagObj.points <= 0)) {
          return true
        }
        return false
      })

      if (invalidScoredTags.length > 0) {
        newAnswerErrors[idx] = 'Punktowane oznaczenia muszą mieć wartość większą od 0.'
        isValid = false
        if (!openTagDropdownIdxs.includes(idx)) {
          setOpenTagDropdownIdxs(prev => [...prev, idx])
        }
      }
    })

    setAnswerErrors(newAnswerErrors)

    if (!isValid) return

    const answersToSave = answers.map((ans, i) => {
      if (questionType === 'scale') {
        if (i === 0) {
          return { ...ans, content: JSON.stringify({ value: 1, start: scaleLabels.start, end: scaleLabels.end }) }
        } else {
          return { ...ans, content: JSON.stringify({ value: i + 1 }) }
        }
      }
      return ans
    })

    try {
      setIsSaving(true)
      await onSave(
        { content, question_type: questionType, media_url: mediaUrl || undefined },
        answersToSave
      )
    } finally {
      setIsSaving(false)
    }
  }

  return {
    content,
    setContent,
    mediaUrl,
    setMediaUrl,
    questionType,
    setQuestionType,
    answers,
    error,
    setError,
    answerErrors,
    isSaving,
    scaleLabels,
    setScaleLabels,
    openTagDropdownIdxs,
    handleAddAnswer,
    handleRemoveAnswer,
    handleAnswerContentChange,
    toggleDropdown,
    toggleTagForAnswer,
    updateTagPointsForAnswer,
    handleSave
  }
}
