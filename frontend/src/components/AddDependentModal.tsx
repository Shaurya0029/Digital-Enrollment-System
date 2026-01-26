import React, { useState } from 'react'

interface AddDependentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  isLoading?: boolean
}

export default function AddDependentModal({ isOpen, onClose, onSubmit, isLoading }: AddDependentModalProps) {
  const [form, setForm] = useState({
    name: '',
    relation: 'spouse',
    dob: '',
    gender: 'male',
    contact: ''
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError('Name is required')
      return
    }
    if (!form.dob) {
      setError('Date of birth is required')
      return
    }
    if (!form.relation) {
      setError('Relationship is required')
      return
    }

    try {
      console.log('Submitting dependent form:', form)
      await onSubmit(form)
      setForm({ name: '', relation: 'spouse', dob: '', gender: 'male', contact: '' })
      onClose()
    } catch (err: any) {
      console.error('Form submission error:', err)
      setError(err.message || 'Failed to add dependent')
    }
  }

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
          <h2 style={{margin: 0, fontSize: '20px', fontWeight: '600', color: '#0f172a'}}>Add Dependent</h2>
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
            <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '6px'}}>
              Full Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              placeholder="Enter dependent's full name"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e6e9ef',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div>
            <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '6px'}}>
              Relationship *
            </label>
            <select
              value={form.relation}
              onChange={(e) => setForm({...form, relation: e.target.value})}
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
              <option value="spouse">Spouse</option>
              <option value="child">Child</option>
              <option value="son">Son</option>
              <option value="daughter">Daughter</option>
              <option value="parent">Parent</option>
              <option value="sibling">Sibling</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '6px'}}>
              Date of Birth *
            </label>
            <input
              type="date"
              value={form.dob}
              onChange={(e) => setForm({...form, dob: e.target.value})}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e6e9ef',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div>
            <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '6px'}}>
              Gender
            </label>
            <select
              value={form.gender}
              onChange={(e) => setForm({...form, gender: e.target.value})}
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
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '6px'}}>
              Contact (Optional)
            </label>
            <input
              type="tel"
              value={form.contact}
              onChange={(e) => setForm({...form, contact: e.target.value})}
              placeholder="Phone number"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e6e9ef',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
            />
          </div>

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
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                background: '#0b63ff',
                color: 'white',
                fontWeight: '500',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              {isLoading ? 'Adding...' : 'Add Dependent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
