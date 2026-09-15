# Quick Start Guide

## 1. Install dependencies

```bash
npm run install-all
# or manually:
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
```

## 2. Start development servers

```bash
npm run dev
```

This starts:
- **Client** (Vite dev server): http://localhost:5173
- **Server** (Express API): http://localhost:3001

## 3. Open browser

Open http://localhost:5173 in your browser.

## 4. Test the editor

1. **Drag a widget**: Drag "Clock" from the left sidebar onto the white canvas
2. **Resize**: Click the widget, then drag one of the 8 handles around it
3. **Configure**: With widget selected, use the right panel to edit config
4. **Undo/Redo**: Press Ctrl+Z or Ctrl+Y
5. **Save**: Click the Save button (arrow up) to save to the backend
6. **Export**: Click the Export button to download JSON locally

## 5. Test keyboard shortcuts

- `S` — Toggle snap-to-grid
- `G` — Toggle grid visibility
- `Delete` — Remove selected widget
- `Ctrl+D` — Duplicate widget
- Arrow keys — Move widget (+Shift = 10px)

## Troubleshooting

### Port already in use
```bash
# Change port in server/server.js or set env var
PORT=3002 npm run start
```

### Module not found errors
```bash
# Clear node_modules and reinstall
rm -rf client/node_modules server/node_modules
npm run install-all
```

### Tailwind styles not loading
```bash
# Rebuild Tailwind
cd client && npx tailwindcss rebuild
```

## Build for production

```bash
npm run build
cd server && npm start  # NODE_ENV=production
```

Or with Docker:
```bash
docker build -t screen-editor:latest .
docker run -p 3001:3001 screen-editor:latest
```
