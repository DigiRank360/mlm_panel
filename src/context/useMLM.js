import { useContext } from 'react'
import { MLMContext } from './mlmContextStore'

export function useMLM() {
  const context = useContext(MLMContext)
  if (!context) throw new Error('useMLM must be used within an MLMProvider')
  return context
}