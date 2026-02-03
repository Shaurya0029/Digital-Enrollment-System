import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import RequireRole from '../components/RequireRole'
import api from '../api'

function EmployeeProfileContent() {
  const navigate = useNavigate()
  const [employee, setEmployee] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<any>({})

  // Load employee data
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true)
        const data = await api.getMe()
        console.log('Employee profile data:', data)
        setEmployee(data)
        // Initialize form data with employee info
        setFormData({
          firstName: data?.firstName || data?.user?.firstName || '',
          lastName: data?.lastName || data?.user?.lastName || '',
          phone: data?.phone || '',
          address: data?.address || '',
          city: data?.city || '',
          state: data?.state || '',
          zipCode: data?.zipCode || '',
          maritalStatus: data?.maritalStatus || '',
          dateOfBirth: data?.dateOfBirth ? data.dateOfBirth.split('T')[0] : ''
        })
      } catch (err: any) {
        setError('Failed to load employee profile')
        console.error('Profile load error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEmployee()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev: any) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    try {
      setIsSubmitting(true)
      setError('')
      setSuccessMessage('')

      // Validate required fields
      if (!formData.firstName || !formData.lastName) {
        setError('First name and last name are required')
        return
      }

      // Get employee ID
      const empId = employee?.employee?.id || employee?.id
      if (!empId) {
        setError('Employee ID not found')
        return
      }

      // Update employee
      const updateRes = await api.updateEmployee(empId, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        maritalStatus: formData.maritalStatus,
        dateOfBirth: formData.dateOfBirth || null
      })

      console.log('Update response:', updateRes)

      // Refresh employee data
      const updatedEmployee = await api.getMe()
      setEmployee(updatedEmployee)
      
      setSuccessMessage('Profile updated successfully!')
      setEditing(false)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err: any) {
      console.error('Error updating profile:', err)
      setError(err.message || 'Failed to update profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    // Reset form data to current employee info
    setFormData({
      firstName: employee?.firstName || employee?.user?.firstName || '',
      lastName: employee?.lastName || employee?.user?.lastName || '',
      phone: employee?.phone || '',
      address: employee?.address || '',
      city: employee?.city || '',
      state: employee?.state || '',
      zipCode: employee?.zipCode || '',
      maritalStatus: employee?.maritalStatus || '',
      dateOfBirth: employee?.dateOfBirth ? employee.dateOfBirth.split('T')[0] : ''
    })
    setEditing(false)
    setError('')
    setSuccessMessage('')
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: '24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{fontSize: '16px', color: '#6b7280'}}>Loading profile...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '24px'
    }}>
      {/* Breadcrumb */}
      <div style={{marginBottom: '24px', fontSize: '14px', color: '#6b7280'}}>
        <button
          onClick={() => navigate('/employee/dashboard')}
          style={{
            background: 'none',
            border: 'none',
            color: '#0b63ff',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Dashboard
        </button>
        <span style={{margin: '0 8px'}}>/</span>
        <span style={{fontWeight: '500', color: '#0f172a'}}>Profile</span>
      </div>

      <div style={{
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        {/* Header Card */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <div>
              <h1 style={{
                margin: '0 0 8px 0',
                fontSize: '28px',
                fontWeight: '700',
                color: '#0f172a'
              }}>
                My Profile
              </h1>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: '#6b7280'
              }}>
                Manage your personal information
              </p>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #0b63ff, #0284c7)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(11, 99, 255, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(11, 99, 255, 0.3)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(11, 99, 255, 0.2)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Success Message */}
          {successMessage && (
            <div style={{
              background: '#d1fae5',
              border: '1px solid #a7f3d0',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px',
              color: '#065f46',
              fontSize: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>✓ {successMessage}</span>
              <button
                onClick={() => setSuccessMessage('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#065f46',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px',
              color: '#991b1b',
              fontSize: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{error}</span>
              <button
                onClick={() => setError('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#991b1b',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Read-Only Section */}
          {!editing && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              marginBottom: '24px'
            }}>
              {/* Account Information */}
              <div style={{
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{
                  margin: '0 0 16px 0',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase'
                }}>
                  Account Information
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                  <div>
                    <div style={{fontSize: '12px', color: '#6b7280', marginBottom: '4px'}}>Email</div>
                    <div style={{fontSize: '14px', color: '#0f172a', fontWeight: '500'}}>
                      {employee?.user?.email || employee?.email || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize: '12px', color: '#6b7280', marginBottom: '4px'}}>Employee ID</div>
                    <div style={{fontSize: '14px', color: '#0f172a', fontWeight: '500'}}>
                      {employee?.employee?.id || employee?.id || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize: '12px', color: '#6b7280', marginBottom: '4px'}}>Department</div>
                    <div style={{fontSize: '14px', color: '#0f172a', fontWeight: '500'}}>
                      {employee?.department || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div style={{
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{
                  margin: '0 0 16px 0',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase'
                }}>
                  Personal Information
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                  <div>
                    <div style={{fontSize: '12px', color: '#6b7280', marginBottom: '4px'}}>Full Name</div>
                    <div style={{fontSize: '14px', color: '#0f172a', fontWeight: '500'}}>
                      {formData.firstName} {formData.lastName}
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize: '12px', color: '#6b7280', marginBottom: '4px'}}>Phone</div>
                    <div style={{fontSize: '14px', color: '#0f172a', fontWeight: '500'}}>
                      {formData.phone || 'Not provided'}
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize: '12px', color: '#6b7280', marginBottom: '4px'}}>Date of Birth</div>
                    <div style={{fontSize: '14px', color: '#0f172a', fontWeight: '500'}}>
                      {formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString() : 'Not provided'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Form */}
          {editing && (
            <form onSubmit={(e) => { e.preventDefault(); handleSave() }} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px'
            }}>
              {/* Personal Information Fields */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0b63ff'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0b63ff'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0b63ff'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0b63ff'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Marital Status
                </label>
                <select
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0b63ff'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                >
                  <option value="">Select Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>

              {/* Address Fields */}
              <div style={{gridColumn: '1 / -1'}}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0b63ff'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0b63ff'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0b63ff'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Zip Code
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0b63ff'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>

              {/* Action Buttons */}
              <div style={{gridColumn: '1 / -1', display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px'}}>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  style={{
                    padding: '10px 20px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s',
                    opacity: isSubmitting ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.background = '#e5e7eb')}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s',
                    opacity: isSubmitting ? 0.7 : 1,
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                  }}
                  onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.boxShadow = '0 8px 16px rgba(16, 185, 129, 0.3)')}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.2)'}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Display Address when not editing */}
          {!editing && (
            <div style={{
              padding: '16px',
              background: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                margin: '0 0 16px 0',
                fontSize: '14px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase'
              }}>
                Address
              </h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                <div>
                  <div style={{fontSize: '12px', color: '#6b7280', marginBottom: '4px'}}>Street Address</div>
                  <div style={{fontSize: '14px', color: '#0f172a', fontWeight: '500'}}>
                    {formData.address || 'Not provided'}
                  </div>
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px'}}>
                  <div>
                    <div style={{fontSize: '12px', color: '#6b7280', marginBottom: '4px'}}>City</div>
                    <div style={{fontSize: '14px', color: '#0f172a', fontWeight: '500'}}>
                      {formData.city || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize: '12px', color: '#6b7280', marginBottom: '4px'}}>State</div>
                    <div style={{fontSize: '14px', color: '#0f172a', fontWeight: '500'}}>
                      {formData.state || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize: '12px', color: '#6b7280', marginBottom: '4px'}}>Zip Code</div>
                    <div style={{fontSize: '14px', color: '#0f172a', fontWeight: '500'}}>
                      {formData.zipCode || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function EmployeeProfile() {
  return (
    <RequireRole role="EMPLOYEE">
      <EmployeeProfileContent />
    </RequireRole>
  )
}
