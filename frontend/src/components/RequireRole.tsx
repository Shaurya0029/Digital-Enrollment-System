import React from 'react'
import { Navigate } from 'react-router-dom'

type Props = {
  role: 'HR' | 'EMPLOYEE'
  userRole?: string | null
  children: React.ReactNode
}

export default function RequireRole({ role, userRole, children }: Props){
  // Check for token in localStorage
  const token = localStorage.getItem('token')
  
  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // Get current role from prop or localStorage
  const current = (userRole ?? localStorage.getItem('role') ?? '').toUpperCase()
  const required = String(role || '').toUpperCase()
  
  // If role mismatch, redirect to unauthorized
  if (!current || !current.startsWith(required)) {
    return <Navigate to="/unauthorized" replace />
  }
  
  // Access granted
  return <>{children}</>
}
