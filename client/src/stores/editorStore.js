import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { temporal } from 'zundo'
import { persist } from 'zustand/middleware'
import { WIDGET_CATALOG } from '@/lib/widgetCatalog'

function getWidgetDefaults(type) {
  const catalog = WIDGET_CATALOG.find(w => w.type === type)
  return {
    w: catalog?.defaultSize?.w ?? 300,
    h: catalog?.defaultSize?.h ?? 200,
    config: catalog?.defaultConfig ? { ...catalog.defaultConfig } : {},
  }
}

export const useEditorStore = create(
  persist(
    temporal(
      immer((set, get) => ({
        // Canvas state (NOT in temporal — excluded via partialize)
        zoom: 0.5,
        panOffset: { x: 0, y: 0 },

        // Display token (set when editor opens, not persisted)
        displayToken: '',

        // Screen config
        screenConfig: {
          slug: '',
          name: 'Nouvel écran',
          resolution: 'fhd',
          backgroundColor: '#0a0a0e',
          theme: 'dark',
          timezone: import.meta.env.VITE_DEFAULT_TIMEZONE || 'Europe/Paris',
          refreshInterval: 300,
          brandName: '',
          accentColor: '#6366F1',
          // Timeline
          timelineEnabled: false,
          timelineItems: [],
        },

        // Widgets
        widgets: {},
        widgetOrder: [],

        // Selection
        selectedId: null,

        // UI
        configPanelOpen: true,

        // Canvas settings
        snapEnabled: true,
        gridVisible: true,

        // --- ACTIONS ---

        addWidget: (type, position) => set(state => {
          const id = Math.random().toString(36).substr(2, 9)
          const defaults = getWidgetDefaults(type)

          state.widgets[id] = {
            id,
            type,
            x: position.x ?? 100,
            y: position.y ?? 100,
            w: position.w ?? defaults.w,
            h: position.h ?? defaults.h,
            config: { ...defaults.config },
            locked: false,
            visible: true,
          }
          state.widgetOrder.push(id)
          state.selectedId = id
        }),

        updateWidget: (id, changes) => set(state => {
          if (state.widgets[id]) {
            Object.assign(state.widgets[id], changes)
          }
        }),

        moveWidget: (id, x, y) => set(state => {
          if (state.widgets[id]) {
            state.widgets[id].x = x
            state.widgets[id].y = y
          }
        }),

        resizeWidget: (id, w, h) => set(state => {
          if (state.widgets[id]) {
            state.widgets[id].w = w
            state.widgets[id].h = h
          }
        }),

        removeWidget: (id) => set(state => {
          delete state.widgets[id]
          state.widgetOrder = state.widgetOrder.filter(wid => wid !== id)
          if (state.selectedId === id) {
            state.selectedId = null
          }
        }),

        selectWidget: (id) => set(state => {
          state.selectedId = id
        }),

        deselect: () => set(state => {
          state.selectedId = null
        }),

        updateWidgetConfig: (id, changes) => set(state => {
          if (state.widgets[id]) {
            Object.assign(state.widgets[id].config, changes)
          }
        }),

        updateScreenConfig: (changes) => set(state => {
          Object.assign(state.screenConfig, changes)
        }),

        duplicateWidget: (id) => set(state => {
          const src = state.widgets[id]
          if (!src) return

          const newId = Math.random().toString(36).substr(2, 9)
          state.widgets[newId] = {
            ...JSON.parse(JSON.stringify(src)),
            id: newId,
            x: src.x + 20,
            y: src.y + 20,
          }
          state.widgetOrder.push(newId)
          state.selectedId = newId
        }),

        reorderWidget: (id, direction) => set(state => {
          const idx = state.widgetOrder.indexOf(id)
          if (idx < 0) return

          if (direction === 'up' && idx < state.widgetOrder.length - 1) {
            [state.widgetOrder[idx], state.widgetOrder[idx + 1]] =
            [state.widgetOrder[idx + 1], state.widgetOrder[idx]]
          } else if (direction === 'down' && idx > 0) {
            [state.widgetOrder[idx], state.widgetOrder[idx - 1]] =
            [state.widgetOrder[idx - 1], state.widgetOrder[idx]]
          }
        }),

        setZoom: (z) => set(state => {
          state.zoom = Math.max(0.1, Math.min(3, z))
        }),

        setPanOffset: (offset) => set(state => {
          state.panOffset = offset
        }),

        toggleSnapToGrid: () => set(state => {
          state.snapEnabled = !state.snapEnabled
        }),

        toggleGridVisible: () => set(state => {
          state.gridVisible = !state.gridVisible
        }),

        setConfigPanelOpen: (open) => set(state => {
          state.configPanelOpen = open
        }),

        // Timeline actions
        addTimelineItem: (item) => set(state => {
          const id = Math.random().toString(36).substr(2, 9)
          if (!state.screenConfig.timelineItems) state.screenConfig.timelineItems = []
          state.screenConfig.timelineItems.push({ id, ...item })
        }),

        removeTimelineItem: (id) => set(state => {
          state.screenConfig.timelineItems = (state.screenConfig.timelineItems || []).filter(i => i.id !== id)
        }),

        updateTimelineItem: (id, changes) => set(state => {
          const item = (state.screenConfig.timelineItems || []).find(i => i.id === id)
          if (item) Object.assign(item, changes)
        }),

        reorderTimelineItems: (items) => set(state => {
          state.screenConfig.timelineItems = items
        }),

        toggleTimeline: () => set(state => {
          state.screenConfig.timelineEnabled = !state.screenConfig.timelineEnabled
        }),
      })),
      // --- Temporal (undo/redo) options ---
      {
        partialize: (state) => ({
          widgets: state.widgets,
          widgetOrder: state.widgetOrder,
          screenConfig: state.screenConfig,
        }),
        limit: 50,
      }
    ),
    // --- Persist (localStorage) options ---
    {
      name: 'editor-store-v3', // bumped: removed old scheduleEnabled/scheduleOn/scheduleOff/scheduleDays
      partialize: (state) => ({
        widgets: state.widgets,
        widgetOrder: state.widgetOrder,
        screenConfig: state.screenConfig,
      }),
      // Deep-merge screenConfig so new fields aren't wiped by old stored state
      merge: (persisted, current) => ({
        ...current,
        ...persisted,
        screenConfig: {
          ...current.screenConfig,
          ...(persisted.screenConfig || {}),
        },
      }),
    }
  )
)
