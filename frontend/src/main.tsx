import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import { HashRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import './styles.css'

function App(){
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))

  useEffect(() => {
    // Log initialization
    console.log('%c=== Digital Enrollment System ===', 'color: #667eea; font-size: 14px; font-weight: bold')
    console.log('[App] Initialized')
    console.log('[App] Token exists:', !!token)
    console.log('[App] User role:', localStorage.getItem('role') || 'NOT SET')
    console.log('[App] User email:', localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}').email : 'NOT SET')
    
    function onAuthChange(){
      const newToken = localStorage.getItem('token')
      setToken(newToken)
      console.log('[App] Auth state changed - Token:', !!newToken, ', Role:', localStorage.getItem('role'))
    }
    window.addEventListener('auth-change', onAuthChange)
    window.addEventListener('storage', onAuthChange)
    return () => {
      window.removeEventListener('auth-change', onAuthChange)
      window.removeEventListener('storage', onAuthChange)
    }
  }, [token])

  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
