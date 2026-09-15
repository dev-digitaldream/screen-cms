import { useState, useCallback } from 'react'

export function useMediaLibrary() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/uploads', { credentials: 'include' })
      if (!res.ok) throw new Error('Erreur chargement')
      setAssets(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const upload = useCallback(async (file) => {
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/v1/uploads', { method: 'POST', body: form, credentials: 'include' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Erreur ${res.status}`)
      }
      const asset = await res.json()
      setAssets(prev => [asset, ...prev])
      return asset
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setUploading(false)
    }
  }, [])

  const remove = useCallback(async (id) => {
    try {
      await fetch(`/api/v1/uploads/${id}`, { method: 'DELETE', credentials: 'include' })
      setAssets(prev => prev.filter(a => a.id !== id))
    } catch (e) {
      setError(e.message)
    }
  }, [])

  return { assets, loading, uploading, error, refresh, upload, remove }
}
