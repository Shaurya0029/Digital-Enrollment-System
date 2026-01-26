import React from 'react'
import { Navigate } from 'react-router-dom'

type Props = {
  role: 'HR' | 'EMPLOYEE'
  userRole?: string | null
  children: React.ReactNode
}

export default function RequireRole({ role, userRole, children }: Props){
  // prefer explicit prop; fallback to localStorage for apps without context
  const current = (userRole ?? localStorage.getItem('role') ?? '').toUpperCase()
  const required = String(role || '').toUpperCase()
  if (!current || !current.startsWith(required)){
    return <Navigate to="/unauthorized" replace />
  }
  return <>{children}</>
}
