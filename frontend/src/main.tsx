import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import './styles.css'

function App(){
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))

  useEffect(() => {
    function onAuthChange(){
      setToken(localStorage.getItem('token'))
    }
    window.addEventListener('auth-change', onAuthChange)
    window.addEventListener('storage', onAuthChange)
    return () => {
      window.removeEventListener('auth-change', onAuthChange)
      window.removeEventListener('storage', onAuthChange)
    }
  }, [])

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
