import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import { ToastContext } from '../../context/toastContext'

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)

  const dismissToast = useCallback(() => {
    window.clearTimeout(timer.current)
    setToast(null)
  }, [])

  const showToast = useCallback((message, type = 'success') => {
    window.clearTimeout(timer.current)
    setToast({ message, type })
    timer.current = window.setTimeout(() => setToast(null), 4200)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return <ToastContext.Provider value={{ showToast, dismissToast }}>
    {children}
    {toast && <div className={`toast-message ${toast.type === 'error' ? 'toast-message-error' : ''}`} role={toast.type === 'error' ? 'alert' : 'status'}>
      {toast.type === 'error' ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
      <span>{toast.message}</span>
      <button aria-label="Dismiss notification" onClick={dismissToast}><X size={15} /></button>
    </div>}
  </ToastContext.Provider>
}
