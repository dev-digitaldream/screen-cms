import { useState } from 'react'
import { useEditorStore } from '@/stores/editorStore'

const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1'
const opts = { credentials: 'include' }

export function useScreenAPI() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const store = useEditorStore()

  const saveLayout = async () => {
    try {
      setLoading(true)
      setError(null)

      // Save raw store format so the display renderer can read it directly
      const s = useEditorStore.getState()
      const layout = {
        screenConfig: s.screenConfig,
        widgets: s.widgets,
        widgetOrder: s.widgetOrder,
      }
      const slug = s.screenConfig.slug

      // Try PUT first; if 404 auto-create
      let response = await fetch(`${API_BASE}/screens/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        ...opts,
        body: JSON.stringify({ layout }),
      })

      if (response.status === 404) {
        response = await fetch(`${API_BASE}/screens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          ...opts,
          body: JSON.stringify({ slug, name: store.screenConfig.name, layout }),
        })
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || `API error: ${response.status}`)
      }

      return await response.json()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const loadLayout = async (slug) => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${API_BASE}/screens/${slug}`, opts)
      if (!response.ok) throw new Error(`Layout not found: ${slug}`)
      return await response.json()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { saveLayout, loadLayout, loading, error }
}
