import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const root = createRoot(document.getElementById('root'))

async function renderApp() {
  if (import.meta.env.MODE === 'prototype') {
    const { default: PrototypeApp } = await import('./prototype/PrototypeApp.jsx')
    root.render(
      <StrictMode>
        <PrototypeApp />
      </StrictMode>,
    )
    return
  }

  const { AuthProvider } = await import('./contexts/AuthContext.jsx')

  if (import.meta.env.MODE === 'demo') {
    const { default: App } = await import('./App.jsx')
    root.render(
      <StrictMode>
        <AuthProvider>
          <App />
        </AuthProvider>
      </StrictMode>,
    )
    return
  }

  const { default: LiveTimerApp } = await import('./live/LiveTimerApp.jsx')

  root.render(
    <StrictMode>
      <AuthProvider>
        <LiveTimerApp />
      </AuthProvider>
    </StrictMode>,
  )
}

renderApp()
