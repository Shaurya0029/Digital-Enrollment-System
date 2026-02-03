import React from 'react'

interface DependentTableProps {
  dependents: any[]
  isLoading?: boolean
  onEdit?: (dependent: any) => void
  onDelete?: (dependentId: string) => void
  onAssignPolicy?: (dependent: any) => void
  onView?: (dependent: any) => void
  onUploadDocument?: (dependentId: string, file: File) => void
}

export default function DependentTable({
  dependents,
  isLoading,
  onEdit,
  onDelete,
  onAssignPolicy,
  onView,
  onUploadDocument
}: DependentTableProps) {
  if (isLoading) {
    return (
      <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: '80px',
              background: '#f3f4f6',
              borderRadius: '8px',
              animation: 'pulse 2s infinite'
            }}
          />
        ))}
      </div>
    )
  }

  if (!dependents || dependents.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        background: '#f9fafb',
        borderRadius: '8px',
        border: '1px dashed #e5e7eb'
      }}>
        <div style={{fontSize: '40px', marginBottom: '12px'}}>👥</div>
        <h3 style={{margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#0f172a'}}>
          No Dependents Added Yet
        </h3>
        <p style={{margin: '0', fontSize: '14px', color: '#6b7280'}}>
          Start by adding your first dependent to manage their policies and information.
        </p>
      </div>
    )
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
      {dependents.map((dependent: any) => (
        <div
          key={dependent.id}
          style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#0b63ff'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(11, 99, 255, 0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <div style={{flex: 1}}>
              <h4 style={{
                margin: '0 0 4px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#0f172a'
              }}>
                {dependent.name}
              </h4>
              <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '8px'}}>
                <div style={{fontSize: '13px', color: '#6b7280'}}>
                  <span style={{fontWeight: '500'}}>Relationship:</span> {dependent.relation || dependent.relationship || 'N/A'}
                </div>
                {dependent.dob && (
                  <div style={{fontSize: '13px', color: '#6b7280'}}>
                    <span style={{fontWeight: '500'}}>DOB:</span> {new Date(dependent.dob).toLocaleDateString()}
                  </div>
                )}
                {dependent.gender && (
                  <div style={{fontSize: '13px', color: '#6b7280'}}>
                    <span style={{fontWeight: '500'}}>Gender:</span> {dependent.gender}
                  </div>
                )}
              </div>

              {(dependent.policyId || dependent.policy) && (
                <div style={{
                  marginTop: '12px',
                  padding: '8px 12px',
                  background: '#dbeafe',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#1e40af'
                }}>
                  <strong>Policy:</strong> {dependent.policy?.name || dependent.policy || 'Assigned'}
                </div>
              )}

              {onUploadDocument && (
                <div style={{marginTop: '12px'}}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: '#6b7280',
                    cursor: 'pointer',
                    padding: '8px 12px',
                    background: '#f3f4f6',
                    borderRadius: '6px',
                    border: '1px dashed #d1d5db',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e5e7eb'
                    e.currentTarget.style.borderColor = '#0b63ff'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f3f4f6'
                    e.currentTarget.style.borderColor = '#d1d5db'
                  }}
                  >
                    <span>📄</span>
                    <span>Upload Document</span>
                    <input
                      type="file"
                      style={{display: 'none'}}
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          onUploadDocument(dependent.id, e.target.files[0])
                        }
                      }}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                  </label>
                </div>
              )}
            </div>

            <div style={{display: 'flex', gap: '6px', marginLeft: '12px'}}>
              {onView && (
                <button
                  onClick={() => onView(dependent)}
                  title="View Details"
                  style={{
                    padding: '6px 8px',
                    background: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#0f172a',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e5e7eb'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f3f4f6'
                  }}
                >
                  👁️
                </button>
              )}

              {onAssignPolicy && (
                <button
                  onClick={() => onAssignPolicy(dependent)}
                  title="Assign Policy"
                  style={{
                    padding: '6px 8px',
                    background: '#dbeafe',
                    border: '1px solid #93c5fd',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#1e40af',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#bfdbfe'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#dbeafe'
                  }}
                >
                  🎯 Assign
                </button>
              )}

              {onEdit && (
                <button
                  onClick={() => onEdit(dependent)}
                  title="Edit"
                  style={{
                    padding: '6px 8px',
                    background: '#fef3c7',
                    border: '1px solid #fde68a',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#92400e',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fcd34d'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fef3c7'
                  }}
                >
                  ✏️
                </button>
              )}

              {onDelete && (
                <button
                  onClick={() => onDelete(dependent.id)}
                  title="Delete"
                  style={{
                    padding: '6px 8px',
                    background: '#fee2e2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#991b1b',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fca5a5'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fee2e2'
                  }}
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
