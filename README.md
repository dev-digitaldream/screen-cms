# Screen Editor — Canvas-based Layout Editor for Digital Signage

A modern, drag-and-drop editor for composing dynamic layouts for TV displays. Built with React, Vite, Zustand, and Express.

## Features

✨ **13 Widget Types**
- Clock, Weather, RSS, KPI, YouTube, Ticker
- Logo, Stocks, Slides, QR Code, Image, Text, Calendar

🎨 **Real-time Editing**
- Drag & drop widgets from sidebar to canvas
- Resize with 8 handles (nw, n, ne, e, se, s, sw, w)
- Snap to grid (20px) with alignment guides
- Undo/Redo (Ctrl+Z / Ctrl+Y)

🌓 **Dark/Light Mode**
- Toggle theme with persistent storage
- Tailwind CSS 3 dark mode support

⚙️ **Configuration**
- Per-widget settings (configurable schema)
- Screen-level config (resolution, branding, refresh)
- Export to JSON for rendering

## Development

### Prerequisites
- Node.js 20+
- npm or yarn

### Setup

```bash
# Clone and setup
cd screen-editor

# Install client
cd client
npm install
npm run dev

# Install server (in another terminal)
cd server
npm install
npm start
```

**Dev URLs:**
- Client: http://localhost:5173
- Server: http://localhost:3001 (API at /api/v1)

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Delete` / `Backspace` | Remove selected widget |
| `Ctrl+D` | Duplicate widget |
| `Arrow Keys` | Nudge (+Shift for 10px) |
| `S` | Toggle snap to grid |
| `G` | Toggle grid visibility |
| `Escape` | Deselect |

## Build & Deploy

### Build

```bash
cd client && npm run build
```

Creates optimized build in `client/dist/`

### Docker

```bash
docker build -t screen-editor:latest .
docker run -p 3001:3001 -e NODE_ENV=production screen-editor:latest
```

### CapRover / Production

```bash
npm run build
export DATA_DIR=/app/data NODE_ENV=production
node server/server.js
```

## API Endpoints

### Layouts
- `GET /api/v1/screens` — List all layouts
- `GET /api/v1/screens/:slug` — Get layout
- `POST /api/v1/screens` — Create layout
- `PUT /api/v1/screens/:slug` — Update layout
- `DELETE /api/v1/screens/:slug` — Delete layout

## Architecture

### Frontend (React + Vite)
- **Stores**: Zustand (editorStore, themeStore)
- **Drag & Drop**: @dnd-kit/core
- **Styling**: Tailwind CSS 3
- **State**: Undo/redo via zundo

### Backend (Express)
- **Database**: SQLite (better-sqlite3)
- **Session**: express-session
- **Compression**: gzip
- **Security**: Helmet.js

## Project Structure

```
├── client/              # Vite + React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── stores/      # Zustand state
│   │   ├── hooks/       # Custom hooks
│   │   └── lib/         # Utilities
│   └── package.json
├── server/              # Express backend
│   ├── src/
│   │   ├── db/          # Database & schema
│   │   └── routes/      # API endpoints
│   └── package.json
└── Dockerfile           # 2-stage build
```

## Widget Config Schema

Each widget has configurable fields defined in `widgetCatalog.js`:

```js
{
  type: 'clock',
  configSchema: [
    { key: 'format', type: 'select', options: ['12h', '24h'] },
    { key: 'showDate', type: 'boolean' },
    { key: 'showSeconds', type: 'boolean' },
  ]
}
```

Supported field types:
- `text`, `number`, `textarea`
- `boolean`, `select`
- `slider`, `color`, `file`

## Performance

- Memoized widget components via `React.memo`
- Zustand selectors for granular subscriptions
- CSS Grid layout with smooth transitions
- Canvas zoom with scale transforms

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iPad/tablet friendly)

## License

MIT — See the original Screen CMS project
