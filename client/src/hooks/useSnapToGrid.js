import { GRID_SIZE } from '@/lib/constants'

export function snapToGrid(value) {
  return Math.round(value / GRID_SIZE) * GRID_SIZE
}

export function computeGuides(widget, allWidgets) {
  const guides = []
  const threshold = 4

  allWidgets.forEach(other => {
    if (other.id === widget.id) return

    // Vertical guides
    if (Math.abs(widget.x - (other.x + other.w)) < threshold) {
      guides.push({ type: 'vertical', x: widget.x })
    }
    if (Math.abs((widget.x + widget.w) - other.x) < threshold) {
      guides.push({ type: 'vertical', x: widget.x + widget.w })
    }
    if (Math.abs(widget.x + widget.w / 2 - (other.x + other.w / 2)) < threshold) {
      guides.push({ type: 'vertical-center', x: widget.x + widget.w / 2 })
    }

    // Horizontal guides
    if (Math.abs(widget.y - (other.y + other.h)) < threshold) {
      guides.push({ type: 'horizontal', y: widget.y })
    }
    if (Math.abs((widget.y + widget.h) - other.y) < threshold) {
      guides.push({ type: 'horizontal', y: widget.y + widget.h })
    }
    if (Math.abs(widget.y + widget.h / 2 - (other.y + other.h / 2)) < threshold) {
      guides.push({ type: 'horizontal-center', y: widget.y + widget.h / 2 })
    }
  })

  return guides
}
