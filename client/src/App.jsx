import { DndContext, DragOverlay, pointerWithin } from '@dnd-kit/core'
import { useThemeStore } from '@/stores/themeStore'
import { useEditorStore } from '@/stores/editorStore'
import { AuthProvider, useAuth } from '@/hooks/useAuth.jsx'
import TopBar from '@/components/layout/TopBar'
import BottomBar from '@/components/layout/BottomBar'
import WidgetSidebar from '@/components/layout/WidgetSidebar'
import Canvas from '@/components/canvas/Canvas'
import ConfigPanel from '@/components/config/ConfigPanel'
import TimelineEditor from '@/components/timeline/TimelineEditor'
import LoginPage from '@/components/auth/LoginPage'
import ScreensList from '@/components/screens/ScreensList'
import DevicesPanel from '@/components/screens/DevicesPanel'
import DataSourcesPanel from '@/components/screens/DataSourcesPanel'
import UsersPanel from '@/components/screens/UsersPanel'
import { useKeyboard } from '@/hooks/useKeyboard'
import { getWidgetInfo } from '@/lib/widgetCatalog'
import { useState, useEffect } from 'react'

function Editor({ onHome }) {
  const theme = useThemeStore(s => s.theme)
  const [draggedType, setDraggedType] = useState(null)

  useKeyboard()

  // Auto-load layout from server on mount
  useEffect(() => {
    const slug = useEditorStore.getState().screenConfig.slug
    if (!slug) return
    fetch(`/api/v1/screens/${slug}`, { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error('not found'); return r.json() })
      .then(layout => {
        if (layout.screenConfig || layout.widgets) {
          const store = useEditorStore.getState()
          useEditorStore.setState({
            widgets: layout.widgets || store.widgets,
            widgetOrder: layout.widgetOrder || store.widgetOrder,
            screenConfig: { ...store.screenConfig, ...(layout.screenConfig || {}) },
          })
        }
      })
      .catch(() => {})
  }, [])

  const handleDragEnd = (event) => {
    const type = draggedType
    setDraggedType(null)

    const { active, over } = event
    if (!over || over.id !== 'screen-canvas') return
    if (!active.data.current || active.data.current.source !== 'catalog') return
    if (!type) return

    const frameEl = document.getElementById('screen-frame')
    if (!frameEl) return

    const frameRect = frameEl.getBoundingClientRect()
    const zoom = useEditorStore.getState().zoom
    const info = getWidgetInfo(type)

    const pointerX = event.activatorEvent.clientX + (event.delta?.x || 0)
    const pointerY = event.activatorEvent.clientY + (event.delta?.y || 0)

    const x = (pointerX - frameRect.left) / zoom
    const y = (pointerY - frameRect.top) / zoom

    useEditorStore.getState().addWidget(type, {
      x: Math.max(0, Math.round(x)),
      y: Math.max(0, Math.round(y)),
      w: info?.defaultSize?.w,
      h: info?.defaultSize?.h,
    })
  }

  const draggedInfo = draggedType ? getWidgetInfo(draggedType) : null
  const DragIcon = draggedInfo?.icon

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={(e) => setDraggedType(e.active.data.current?.type || null)}
      onDragEnd={handleDragEnd}
    >
      <div className={theme === 'dark' ? 'dark' : ''}>
        {/* Stitch: surface #f9f9f9 base — the infinite canvas */}
        <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--surface)', color: 'var(--ink)' }}>
          <TopBar onHome={onHome} />
          <div className="flex flex-1 overflow-hidden">
            <WidgetSidebar />
            <Canvas />
            <ConfigPanel />
          </div>
          <TimelineEditor />
          <BottomBar />
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {draggedInfo ? (
          /* Stitch: float shadow + steel blue ring */
          <div
            className="flex items-center gap-2 rounded px-3 py-1.5"
            style={{
              backgroundColor: 'var(--surface-lowest)',
              border: '1.5px solid #516076',
              boxShadow: '0 8px 24px rgba(45,52,53,.10), 0 4px 8px rgba(45,52,53,.06)',
              color: 'var(--ink)',
            }}
          >
            {DragIcon && <DragIcon size={14} style={{ color: 'var(--steel)' }} />}
            <span className="text-[13px] font-medium">{draggedInfo.label}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function AuthGate() {
  const { user } = useAuth()
  const theme = useThemeStore(s => s.theme)
  const [view, setView] = useState('home') // 'home' | 'editor' | 'devices' | 'datasources' | 'users'

  const handleOpenEditor = (slug) => {
    // Load the screen into the editor store, then switch view
    fetch(`/api/v1/screens/${slug}`, { credentials: 'include' })
      .then(r => r.json())
      .then(layout => {
        const defaults = useEditorStore.getState().screenConfig
        useEditorStore.setState({
          widgets: layout.widgets || {},
          widgetOrder: layout.widgetOrder || [],
          displayToken: layout._displayToken || '',
          // Always merge with defaults so no field (e.g. timelineItems) is undefined
          screenConfig: {
            ...defaults,
            ...(layout.screenConfig || {}),
            slug,
          },
          selectedId: null,
        })
        setView('editor')
      })
      .catch(() => {
        useEditorStore.getState().updateScreenConfig({ slug })
        setView('editor')
      })
  }

  if (user === undefined) {
    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--surface)' }}>
          <div className="w-7 h-7 rounded-full animate-spin" style={{ border: '2px solid #dde4e5', borderTopColor: '#516076' }} />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <LoginPage />
      </div>
    )
  }

  if (view === 'home') {
    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <ScreensList
          onOpenEditor={handleOpenEditor}
          onOpenDevices={() => setView('devices')}
          onOpenDataSources={() => setView('datasources')}
          onOpenUsers={user?.role === 'admin' ? () => setView('users') : null}
        />
      </div>
    )
  }

  if (view === 'users') {
    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <UsersPanel onBack={() => setView('home')} />
      </div>
    )
  }

  if (view === 'devices') {
    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <DevicesPanel onBack={() => setView('home')} />
      </div>
    )
  }

  if (view === 'datasources') {
    return (
      <div className={theme === 'dark' ? 'dark' : ''} style={{ minHeight: '100vh', backgroundColor: 'var(--surface)' }}>
        <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <button onClick={() => setView('home')} className="text-sm text-zinc-400 hover:text-white">← Retour</button>
          <span className="text-zinc-600">/</span>
          <span className="text-sm font-medium text-white">Sources de données</span>
        </div>
        <DataSourcesPanel />
      </div>
    )
  }

  return <Editor onHome={() => setView('home')} />
}

function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  )
}

export default App
