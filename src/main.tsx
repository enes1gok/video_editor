import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useAppStore } from './app/store'
import { watchSystemTheme } from './app/theme/applyTheme'
import { ToastProvider } from './shared/ui'

// Re-apply the theme when the OS scheme changes while the user is on 'system'.
// (First paint is handled by /theme-boot.js; reactive changes by the store.)
watchSystemTheme(() => useAppStore.getState().theme)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
)

