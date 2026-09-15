/**
 * Export the current editor state to the same JSON format that the
 * auto-save hook sends to the server (and that DisplayApp reads back).
 */
export function exportToJSON(state) {
  const { widgets, widgetOrder, screenConfig } = state
  return {
    screenConfig,
    widgets,
    widgetOrder,
    _exportedAt: new Date().toISOString(),
  }
}

export function downloadJSON(data, filename = 'layout.json') {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
