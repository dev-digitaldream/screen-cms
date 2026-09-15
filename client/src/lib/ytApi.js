// Shared YouTube IFrame API loader — singleton, safe to import from multiple components

let _loaded = false
let _ready = false
const _queue = []

function _onReady() {
  _ready = true
  _queue.splice(0).forEach(cb => cb())
}

export function onYTReady(cb) {
  if (_ready && window.YT?.Player) { cb(); return }
  _queue.push(cb)
  if (!_loaded) {
    _loaded = true
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      if (prev) prev()
      _onReady()
    }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
  }
}
