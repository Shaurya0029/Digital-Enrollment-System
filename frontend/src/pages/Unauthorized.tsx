import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Lock, ArrowLeft, Home } from 'lucide-react'

export default function Unauthorized(){
  const navigate = useNavigate()
  const location = useLocation()
  const userRole = localStorage.getItem('role')
  const token = localStorage.getItem('token')

  useEffect(() => {
    console.log('[Unauthorized Page] User attempted access:')
    console.log('[Unauthorized Page] Path:', location.pathname)
    console.log('[Unauthorized Page] Came from:', location.state?.from?.pathname || 'unknown')
    console.log('[Unauthorized Page] User role:', userRole || 'NOT SET')
    console.log('[Unauthorized Page] Token exists:', !!token)
  }, [location, userRole, token])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '24px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '48px 32px',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)'
      }}>
        {/* Lock Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <Lock size={40} color="white" />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#111827',
          margin: '0 0 12px 0'
        }}>
          Access Denied
        </h1>

        {/* Description */}
        <p style={{
          fontSize: '16px',
          color: '#6b7280',
          margin: '0 0 24px 0',
          lineHeight: '1.6'
        }}>
          You don't have permission to access this page.
        </p>

        {/* Debug Information */}
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          fontSize: '14px',
          color: '#991b1b',
          textAlign: 'left'
        }}>
          <div style={{ marginBottom: '8px', fontWeight: '600' }}>❌ Access Issue:</div>
          <div style={{ lineHeight: '1.6' }}>
            <p style={{ margin: '4px 0' }}>
              <strong>Your Role:</strong> {userRole ? userRole.toUpperCase() : 'NOT SET'}
            </p>
            <p style={{ margin: '4px 0' }}>
              <strong>Logged In:</strong> {token ? '✅ Yes' : '❌ No (Please login)'}
            </p>
            <p style={{ margin: '4px 0' }}>
              <strong>Issue:</strong> {!token ? 'You are not logged in' : userRole === 'EMPLOYEE' ? 'Employees cannot access HR features' : 'Insufficient permissions'}
            </p>
          </div>
        </div>

        {/* Details */}
        <div style={{
          background: '#f3f4f6',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '32px',
          fontSize: '14px',
          color: '#6b7280',
          textAlign: 'left'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
            Why you see this:
          </p>
          <ul style={{
            margin: '8px 0 0 0',
            paddingLeft: '20px'
          }}>
            <li style={{ marginBottom: '4px' }}>You're trying to access an HR-only page as an Employee</li>
            <li style={{ marginBottom: '4px' }}>Your user role doesn't match the required permissions</li>
            <li style={{ marginBottom: '4px' }}>Your session may have expired</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          flexDirection: 'column'
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 10px 15px rgba(102, 126, 234, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <ArrowLeft size={18} />
            Go Back
          </button>

          <button
            onClick={() => {
              const dashboardPath = userRole === 'HR' ? '/hr/dashboard' : '/employee/dashboard'
              navigate(dashboardPath)
            }}
            style={{
              padding: '12px 24px',
              background: '#f3f4f6',
              color: '#111827',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e5e7eb'
              e.currentTarget.style.borderColor = '#d1d5db'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f3f4f6'
              e.currentTarget.style.borderColor = '#e5e7eb'
            }}
          >
            <Home size={18} />
            Go to Dashboard
          </button>
        </div>

        {/* Footer */}
        <p style={{
          fontSize: '12px',
          color: '#9ca3af',
          margin: '24px 0 0 0',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '24px'
        }}>
          If you believe this is a mistake, please contact your administrator.
        </p>
      </div>
    </div>
  )
}
