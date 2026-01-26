import React from 'react'

interface EmployeeSummaryCardProps {
  employee: any
  isLoading?: boolean
}

export default function EmployeeSummaryCard({ employee, isLoading }: EmployeeSummaryCardProps) {
  if (isLoading) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e6e9ef',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        padding: '20px',
        display: 'grid',
        gridTemplateColumns: '80px 1fr',
        gap: '16px',
        alignItems: 'start'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '8px',
          background: '#e6e9ef',
          animation: 'pulse 2s infinite'
        }}></div>
        <div style={{display: 'flex', flexDirection: 'column', gap: '8px', flex: 1}}>
          <div style={{height: '20px', background: '#e6e9ef', borderRadius: '4px', width: '40%', animation: 'pulse 2s infinite'}}></div>
          <div style={{height: '16px', background: '#e6e9ef', borderRadius: '4px', width: '50%', animation: 'pulse 2s infinite'}}></div>
          <div style={{height: '16px', background: '#e6e9ef', borderRadius: '4px', width: '60%', animation: 'pulse 2s infinite'}}></div>
        </div>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
      </div>
    )
  }

  if (!employee) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e6e9ef',
        padding: '20px',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        Employee information unavailable
      </div>
    )
  }

  const initials = (employee.user?.name || employee.name || '--')
    .split(' ')
    .map((s: string) => s[0])
    .slice(0, 2)
    .join('')

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e6e9ef',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      padding: '20px',
      display: 'grid',
      gridTemplateColumns: '80px 1fr',
      gap: '16px',
      alignItems: 'start'
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '8px',
        background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        fontWeight: '600',
        flexShrink: 0
      }}>
        {initials}
      </div>

      <div>
        <h2 style={{
          margin: '0 0 8px 0',
          fontSize: '18px',
          fontWeight: '600',
          color: '#0f172a'
        }}>
          {employee.user?.name || employee.name}
        </h2>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px'}}>
          <div>
            <div style={{fontSize: '12px', color: '#6b7280', fontWeight: '500', marginBottom: '2px'}}>Employee ID</div>
            <div style={{fontSize: '14px', fontWeight: '600', color: '#0f172a'}}>
              {employee.externalId || employee.id}
            </div>
          </div>

          <div>
            <div style={{fontSize: '12px', color: '#6b7280', fontWeight: '500', marginBottom: '2px'}}>Email</div>
            <div style={{fontSize: '14px', color: '#0f172a'}}>
              {employee.user?.email || employee.email || '—'}
            </div>
          </div>

          {employee.designation && (
            <div>
              <div style={{fontSize: '12px', color: '#6b7280', fontWeight: '500', marginBottom: '2px'}}>Designation</div>
              <div style={{fontSize: '14px', color: '#0f172a'}}>
                {employee.designation}
              </div>
            </div>
          )}

          {employee.policy?.name && (
            <div>
              <div style={{fontSize: '12px', color: '#6b7280', fontWeight: '500', marginBottom: '2px'}}>Primary Policy</div>
              <div style={{fontSize: '14px', color: '#0f172a'}}>
                {employee.policy.name}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
