import React from 'react'

interface Employee {
  id: number
  userId: number
  name: string
  email: string
  phone?: string
  dob?: string
  gender?: string
  address?: string
  maritalStatus?: string
  externalId?: string
  createdAt?: string
  updatedAt?: string
  dependents?: any[]
  policies?: any[]
}

interface EmployeeListProps {
  employees: Employee[]
  isLoading?: boolean
  maxRows?: number
  onViewAll?: () => void
  onQuickAction?: (employee: Employee) => void
}

export default function EmployeeList({
  employees,
  isLoading = false,
  maxRows = 5,
  onViewAll,
  onQuickAction,
}: EmployeeListProps) {
  const displayEmployees = employees.slice(0, maxRows)

  if (isLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" style={{ margin: '0 auto' }}></div>
      </div>
    )
  }

  if (employees.length === 0) {
    return (
      <div
        style={{
          padding: '24px',
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: '14px',
        }}
      >
        No employees yet
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {displayEmployees.map((emp) => (
        <div
          key={emp.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {getInitials(emp.name)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#1f2937', fontWeight: 500, fontSize: '14px' }}>
                {emp.name}
              </div>
              <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '2px' }}>
                {emp.email}
              </div>
            </div>
          </div>
          <button
            onClick={() => onQuickAction?.(emp)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '4px 8px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => {
              ;(e.target as HTMLButtonElement).style.color = '#3b82f6'
            }}
            onMouseLeave={(e) => {
              ;(e.target as HTMLButtonElement).style.color = '#9ca3af'
            }}
          >
            ›
          </button>
        </div>
      ))}

      {employees.length > maxRows && (
        <button
          onClick={onViewAll}
          style={{
            marginTop: '8px',
            padding: '8px 12px',
            backgroundColor: '#f3f4f6',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            color: '#3b82f6',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = '#e5e7eb'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f3f4f6'
          }}
        >
          View All ({employees.length - maxRows} more)
        </button>
      )}
    </div>
  )
}
