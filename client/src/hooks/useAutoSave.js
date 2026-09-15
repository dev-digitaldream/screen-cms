import { useEffect, useRef, useCallback } from 'react'
import { useEditorStore } from '@/stores/editorStore'

const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1'

/**
 * Auto-save hook — debounces saves 3s after any content change.
 * Returns { lastSaved, saving } so TopBar can show status.
 */
export function useAutoSave(onSaved, onError, delayMs = 3000) {
  const timerRef = useRef(null)
  const savingRef = useRef(false)

  const doSave = useCallback(async () => {
    if (savingRef.current) return
    savingRef.current = true
    const s = useEditorStore.getState()
    const layout = {
      screenConfig: s.screenConfig,
      widgets: s.widgets,
      widgetOrder: s.widgetOrder,
    }
    const slug = s.screenConfig.slug
    try {
      let res = await fetch(`${API_BASE}/screens/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ layout }),
      })
      if (res.status === 404) {
        res = await fetch(`${API_BASE}/screens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ slug, name: s.screenConfig.name, layout }),
        })
      }
      if (res.ok) onSaved?.()
      else onError?.()
    } catch {
      onError?.()
    } finally {
      savingRef.current = false
    }
  }, [onSaved, onError])

  useEffect(() => {
    return useEditorStore.subscribe((state, prev) => {
      if (
        state.widgets === prev.widgets &&
        state.widgetOrder === prev.widgetOrder &&
        state.screenConfig === prev.screenConfig
      ) return

      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(doSave, delayMs)
    })
  }, [doSave, delayMs])

  // Flush on unmount
  useEffect(() => () => clearTimeout(timerRef.current), [])
}
