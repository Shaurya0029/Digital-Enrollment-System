import React from 'react'

interface Employee {
  id: number
  userId: number
  name?: string
  email?: string
  user?: { name: string; email: string }
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

interface EmployeeQuickDetailsProps {
  isOpen: boolean
  employee: Employee | null
  onClose: () => void
}

export default function EmployeeQuickDetails({
  isOpen,
  employee,
  onClose,
}: EmployeeQuickDetailsProps) {
  if (!isOpen || !employee) return null

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  // Use the enriched name/email if available, otherwise fall back to user data
  const displayName = (employee as any).name || employee.user?.name || `ID ${employee.id}`
  const displayEmail = (employee as any).email || employee.email || ''

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 40,
        }}
      />

      {/* Side Drawer */}
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          height: '100vh',
          width: '400px',
          backgroundColor: 'white',
          boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.15)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
            Employee Details
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              color: '#6b7280',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {/* Profile Section */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 600,
                margin: '0 auto 12px',
              }}
            >
              {getInitials(displayName)}
            </div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#1f2937' }}>
              {displayName}
            </h4>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>
              {displayEmail}
            </p>
          </div>

          {/* Details Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
              }}
            >
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                }}
              >
                Employee ID
              </label>
              <p style={{ margin: '4px 0 0 0', color: '#1f2937', fontWeight: 500 }}>
                {employee.id}
              </p>
            </div>

            <div
              style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
              }}
            >
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                }}
              >
                Department
              </label>
              <p style={{ margin: '4px 0 0 0', color: '#1f2937', fontWeight: 500 }}>
                —
              </p>
            </div>

            <div
              style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
              }}
            >
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                }}
              >
                Employment Type
              </label>
              <p style={{ margin: '4px 0 0 0', color: '#1f2937', fontWeight: 500 }}>
                —
              </p>
            </div>

            <div
              style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
              }}
            >
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                }}
              >
                Assigned Policy
              </label>
              {employee.policies && employee.policies.length > 0 ? (
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {employee.policies.map((pol: any) => (
                    <span
                      key={pol.id}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                    >
                      {pol.policy?.name || 'N/A'}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ margin: '4px 0 0 0', color: '#1f2937', fontWeight: 500 }}>
                  None assigned
                </p>
              )}
            </div>

            <div
              style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
              }}
            >
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                }}
              >
                Phone
              </label>
              <p style={{ margin: '4px 0 0 0', color: '#1f2937', fontWeight: 500 }}>
                {employee.phone || '—'}
              </p>
            </div>

            <div
              style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
              }}
            >
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                }}
              >
                Date of Birth
              </label>
              <p style={{ margin: '4px 0 0 0', color: '#1f2937', fontWeight: 500 }}>
                {employee.dob
                  ? new Date(employee.dob).toLocaleDateString()
                  : '—'}
              </p>
            </div>

            {employee.address && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                }}
              >
                <label
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                  }}
                >
                  Address
                </label>
                <p style={{ margin: '4px 0 0 0', color: '#1f2937', fontWeight: 500 }}>
                  {employee.address}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
          }}
        >
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              color: '#1f2937',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              ;(e.target as HTMLButtonElement).style.backgroundColor = '#e5e7eb'
            }}
            onMouseLeave={(e) => {
              ;(e.target as HTMLButtonElement).style.backgroundColor = '#f3f4f6'
            }}
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  )
}
