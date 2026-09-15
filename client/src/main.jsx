import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ background: '#09090b', color: '#f4f4f5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', padding: 32 }}>
          <div style={{ maxWidth: 640 }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>💥</div>
            <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#f87171' }}>Erreur de rendu</h1>
            <pre style={{ background: '#18181b', padding: 16, borderRadius: 8, fontSize: 12, color: '#fca5a5', overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack}
            </pre>
            <button
              onClick={() => { localStorage.removeItem('editor-store-v2'); window.location.reload() }}
              style={{ marginTop: 16, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}
            >
              Réinitialiser le store et recharger
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
)
