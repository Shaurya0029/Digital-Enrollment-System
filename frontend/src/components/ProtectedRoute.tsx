import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

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
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [role, setRole] = useState<Role | ''>(normalizeRole(localStorage.getItem('role')))

  useEffect(() => {
    // Listen for auth changes
    function handleAuthChange() {
      setToken(localStorage.getItem('token'))
      setRole(normalizeRole(localStorage.getItem('role')))
    }

    window.addEventListener('auth-change', handleAuthChange)
    return () => window.removeEventListener('auth-change', handleAuthChange)
  }, [])

  if (!token) {
    console.log('No token found, redirecting to login')
    return <Navigate to="/login" replace />
  }

  if (role === '' || !allowedRoles.includes(role as Role)) {
    console.log('Role check failed:', { 
      storedRole: localStorage.getItem('role'), 
      normalizedRole: role, 
      allowedRoles,
      token: token ? 'present' : 'missing'
    })
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
