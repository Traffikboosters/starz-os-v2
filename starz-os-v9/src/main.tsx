import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import { ThemeProvider } from './contexts/ThemeContext'
import { SupabaseAuthProvider } from '@/lib/supabase/auth'
import { Toaster } from '@/components/ui/sonner'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <SupabaseAuthProvider>
        <ThemeProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#12121A',
                border: '1px solid rgba(148,163,184,0.15)',
                color: '#F8FAFC',
              },
            }}
          />
        </ThemeProvider>
      </SupabaseAuthProvider>
    </HashRouter>
  </StrictMode>,
)
