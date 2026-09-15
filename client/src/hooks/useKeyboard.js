import { useEffect } from 'react'
import { useEditorStore } from '@/stores/editorStore'

export function useKeyboard() {
  useEffect(() => {
    function handleKeyDown(e) {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        if (e.key === 'Escape') e.target.blur()
        return
      }

      const store = useEditorStore.getState()
      const temporal = useEditorStore.temporal

      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        temporal?.getState()?.undo()
        return
      }

      // Redo
      if (((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) ||
          ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault()
        temporal?.getState()?.redo()
        return
      }

      // Save — Ctrl+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        // Will be handled by TopBar save button — just prevent browser default
        return
      }

      // Delete
      if ((e.key === 'Delete' || e.key === 'Backspace') && store.selectedId) {
        e.preventDefault()
        store.removeWidget(store.selectedId)
        return
      }

      // Escape
      if (e.key === 'Escape') {
        store.deselect()
        return
      }

      // Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && store.selectedId) {
        e.preventDefault()
        store.duplicateWidget(store.selectedId)
        return
      }

      // Arrow nudge
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && store.selectedId) {
        e.preventDefault()
        const widget = store.widgets[store.selectedId]
        if (!widget) return

        const delta = e.shiftKey ? 10 : 1
        let x = widget.x
        let y = widget.y

        if (e.key === 'ArrowUp') y -= delta
        if (e.key === 'ArrowDown') y += delta
        if (e.key === 'ArrowLeft') x -= delta
        if (e.key === 'ArrowRight') x += delta

        store.moveWidget(store.selectedId, x, y)
        return
      }

      // Toggle snap
      if (e.key === 's' && !e.ctrlKey && !e.metaKey) {
        store.toggleSnapToGrid()
        return
      }

      // Toggle grid
      if (e.key === 'g' && !e.ctrlKey && !e.metaKey) {
        store.toggleGridVisible()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
