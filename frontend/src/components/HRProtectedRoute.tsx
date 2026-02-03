import React, { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

type Role = 'HR' | 'EMPLOYEE'

function normalizeRole(raw?: string | null): Role | '' {
  if (!raw) return ''
  const u = String(raw).toUpperCase().trim()
  if (u === 'HR' || u.startsWith('HR')) return 'HR'
  if (u === 'EMPLOYEE' || u.startsWith('EMP')) return 'EMPLOYEE'
  return ''
}

export default function HRProtectedRoute() {
  const location = useLocation()
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [role, setRole] = useState<Role | ''>(normalizeRole(localStorage.getItem('role')))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log('[HRProtectedRoute] Route:', location.pathname)
    console.log('[HRProtectedRoute] Token exists:', !!token)
    console.log('[HRProtectedRoute] Role:', role || 'NOT SET')
    console.log('[HRProtectedRoute] Raw role from localStorage:', localStorage.getItem('role'))
    
    // Listen for auth changes
    function handleAuthChange() {
      const newToken = localStorage.getItem('token')
      const newRole = normalizeRole(localStorage.getItem('role'))
      setToken(newToken)
      setRole(newRole)
      console.log('[HRProtectedRoute] Auth changed - Token:', !!newToken, ', Role:', newRole)
    }

    window.addEventListener('auth-change', handleAuthChange)
    setIsLoading(false)
    
    return () => window.removeEventListener('auth-change', handleAuthChange)
  }, [location.pathname, token, role])

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        Loading authentication...
      </div>
    )
  }

  // If no token, redirect to login
  if (!token) {
    console.warn('[HRProtectedRoute] ❌ ACCESS DENIED - No token found')
    console.warn('[HRProtectedRoute] Redirecting to /login from:', location.pathname)
    return <Navigate to="/login" replace />
  }

  // If user is not HR, redirect to unauthorized
  if (role !== 'HR') {
    console.warn('[HRProtectedRoute] ❌ ACCESS DENIED - Insufficient permissions', {
      path: location.pathname,
      storedRole: localStorage.getItem('role'),
      normalizedRole: role,
      requiredRole: 'HR'
    })
    return <Navigate to="/unauthorized" replace />
  }

  // User is authenticated and has HR role - render nested routes
  console.log('[HRProtectedRoute] ✅ ACCESS GRANTED - HR user accessing:', location.pathname)
  return <Outlet />
}
