export const GRID_SIZE = 20
export const CANVAS_PADDING = 80
export const MIN_WIDGET_WIDTH = 100
export const MIN_WIDGET_HEIGHT = 60

export const RESIZE_HANDLE_POSITIONS = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

export const SCREEN_RESOLUTIONS = {
  'fhd': { label: 'Full HD 1080p', width: 1920, height: 1080 },
  'fhd-portrait': { label: 'Portrait FHD', width: 1080, height: 1920 },
  'pano': { label: 'Panoramique', width: 2560, height: 720 },
  'uhd': { label: 'Ultra HD 4K', width: 3840, height: 2160 },
}

export const HANDLE_STYLE = {
  nw: { top: -4, left: -4, cursor: 'nw-resize' },
  n: { top: -4, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' },
  ne: { top: -4, right: -4, cursor: 'ne-resize' },
  e: { top: '50%', right: -4, transform: 'translateY(-50%)', cursor: 'e-resize' },
  se: { bottom: -4, right: -4, cursor: 'se-resize' },
  s: { bottom: -4, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' },
  sw: { bottom: -4, left: -4, cursor: 'sw-resize' },
  w: { top: '50%', left: -4, transform: 'translateY(-50%)', cursor: 'w-resize' },
}
