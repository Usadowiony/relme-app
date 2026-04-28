import { useState, useEffect } from 'react'
import { getQuestions, getTags, getQuizPaths } from '../api/quiz.api'
import type { Question, Tag, QuizPath } from '../types/quiz'

export function useQuizData() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [paths, setPaths] = useState<QuizPath[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [qData, tData, pData] = await Promise.all([
        getQuestions(),
        getTags(),
        getQuizPaths()
      ])
      setQuestions(qData)
      setTags(tData)
      setPaths(pData)
    } catch (err: any) {
      console.error('Failed to fetch quiz data', err)
      setError(err.message || 'Nie udało się pobrać danych quizu.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return {
    questions,
    tags,
    paths,
    isLoading,
    error,
    refetch: fetchData
  }
}
