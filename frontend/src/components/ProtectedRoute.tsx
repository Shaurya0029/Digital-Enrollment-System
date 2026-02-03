import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

type Role = 'HR' | 'EMPLOYEE'

interface ProtectedRouteProps {
  allowedRoles: Role[]
  children: React.ReactElement
}

function normalizeRole(raw?: string | null): Role | '' {
  if (!raw) return ''
  const u = String(raw).toUpperCase().trim()
  if (u === 'HR' || u.startsWith('HR')) return 'HR'
  if (u === 'EMPLOYEE' || u.startsWith('EMP')) return 'EMPLOYEE'
  return ''
}

export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps){
  const location = useLocation()
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [role, setRole] = useState<Role | ''>(normalizeRole(localStorage.getItem('role')))

  useEffect(() => {
    console.log('[ProtectedRoute] Checking access:', {
      path: location.pathname,
      token: !!token,
      userRole: role || 'NOT SET',
      rawRole: localStorage.getItem('role'),
      allowedRoles: allowedRoles
    })
    
    // Listen for auth changes
    function handleAuthChange() {
      const newToken = localStorage.getItem('token')
      const newRole = normalizeRole(localStorage.getItem('role'))
      setToken(newToken)
      setRole(newRole)
      console.log('[ProtectedRoute] Auth changed:', {
        path: location.pathname,
        token: !!newToken,
        role: newRole
      })
    }

    window.addEventListener('auth-change', handleAuthChange)
    return () => window.removeEventListener('auth-change', handleAuthChange)
  }, [location.pathname, token, role, allowedRoles])

  if (!token) {
    console.warn('[ProtectedRoute] ❌ ACCESS DENIED - No token found')
    console.warn('[ProtectedRoute] Redirecting to /login from:', location.pathname)
    return <Navigate to="/login" replace />
  }

  if (role === '' || !allowedRoles.includes(role as Role)) {
    console.warn('[ProtectedRoute] ❌ ACCESS DENIED - Role check failed:', { 
      path: location.pathname,
      storedRole: localStorage.getItem('role'), 
      normalizedRole: role, 
      allowedRoles: allowedRoles,
      token: token ? 'present' : 'missing'
    })
    console.warn('[ProtectedRoute] Redirecting to /unauthorized from:', location.pathname)
    return <Navigate to="/unauthorized" replace />
  }

  console.log('[ProtectedRoute] ✅ ACCESS GRANTED:', {
    path: location.pathname,
    userRole: role,
    allowedRoles: allowedRoles
  })
  return children
}
