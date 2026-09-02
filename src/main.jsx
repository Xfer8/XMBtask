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

  const [{ default: App }, { AuthProvider }] = await Promise.all([
    import('./App.jsx'),
    import('./contexts/AuthContext.jsx'),
  ])

  root.render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>,
  )
}

renderApp()
