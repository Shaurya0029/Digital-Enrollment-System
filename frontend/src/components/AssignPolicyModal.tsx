import React, { useState, useEffect } from 'react'

interface AssignPolicyModalProps {
  isOpen: boolean
  onClose: () => void
  dependentName: string
  currentPolicy?: string
  policies: any[]
  onAssign: (policyId: string) => Promise<void>
  isLoading?: boolean
}

export default function AssignPolicyModal({
  isOpen,
  onClose,
  dependentName,
  currentPolicy,
  policies,
  onAssign,
  isLoading
}: AssignPolicyModalProps) {
  const [selectedPolicy, setSelectedPolicy] = useState<string>(currentPolicy || '')
  const [error, setError] = useState('')

  useEffect(() => {
    setSelectedPolicy(currentPolicy || '')
    setError('')
  }, [isOpen, currentPolicy])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedPolicy) {
      setError('Please select a policy')
      return
    }

    try {
      await onAssign(selectedPolicy)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to assign policy')
    }
  }

  const selectedPolicyData = policies.find(p => p.id === selectedPolicy)

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.28)',
      zIndex: 1001
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px rgba(0,0,0,0.15)'
      }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
          <h2 style={{margin: 0, fontSize: '20px', fontWeight: '600', color: '#0f172a'}}>
            Assign Policy
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '0'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{
          background: '#f0f7ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '20px',
          fontSize: '14px',
          color: '#1e40af'
        }}>
          <strong>Dependent:</strong> {dependentName}
        </div>

        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            color: '#991b1b',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
          <div>
            <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px'}}>
              Select Policy *
            </label>
            <select
              value={selectedPolicy}
              onChange={(e) => setSelectedPolicy(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e6e9ef',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
            >
              <option value="">-- Choose a policy --</option>
              {policies && policies.map((policy: any) => (
                <option key={policy.id} value={policy.id}>
                  {policy.name || policy.policyName} - {policy.planType || 'Standard'}
                </option>
              ))}
            </select>
          </div>

          {selectedPolicyData && (
            <div style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '14px'
            }}>
              <div style={{fontWeight: '600', color: '#0f172a', marginBottom: '8px'}}>Policy Details:</div>
              <div style={{display: 'grid', gap: '8px', color: '#4b5563'}}>
                {selectedPolicyData.name && (
                  <div><strong>Name:</strong> {selectedPolicyData.name || selectedPolicyData.policyName}</div>
                )}
                {selectedPolicyData.planType && (
                  <div><strong>Plan Type:</strong> {selectedPolicyData.planType}</div>
                )}
                {selectedPolicyData.coverage && (
                  <div><strong>Coverage:</strong> {selectedPolicyData.coverage}</div>
                )}
                {selectedPolicyData.premium && (
                  <div><strong>Premium:</strong> ₹{selectedPolicyData.premium}</div>
                )}
              </div>
            </div>
          )}

          <div style={{display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px'}}>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                border: '1px solid #e6e9ef',
                borderRadius: '8px',
                background: 'white',
                color: '#0f172a',
                fontWeight: '500',
                cursor: 'pointer',
                fontSize: '14px',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedPolicy}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                background: selectedPolicy ? '#0b63ff' : '#d1d5db',
                color: 'white',
                fontWeight: '500',
                cursor: isLoading || !selectedPolicy ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              {isLoading ? 'Assigning...' : 'Assign Policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
