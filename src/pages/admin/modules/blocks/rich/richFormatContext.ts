import { createContext, useContext } from 'react'

// contentEditable ignores <fieldset disabled>, so rich fields read the
// editor's read-only state from here.
export const EditorReadOnlyContext = createContext(false)

export function useEditorReadOnly(): boolean {
  return useContext(EditorReadOnlyContext)
}
