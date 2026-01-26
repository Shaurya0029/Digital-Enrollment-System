import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import EmployeeSummaryCard from '../components/EmployeeSummaryCard'
import DependentTable from '../components/DependentTable'
import AddDependentModal from '../components/AddDependentModal'
import AssignPolicyModal from '../components/AssignPolicyModal'
import api from '../api'

export default function EmployeeDependents() {
  const navigate = useNavigate()
  const [employee, setEmployee] = useState<any>(null)
  const [dependents, setDependents] = useState<any[]>([])
  const [policies, setPolicies] = useState<any[]>([])
  const [loadingEmployee, setLoadingEmployee] = useState(true)
  const [loadingDependents, setLoadingDependents] = useState(true)
  const [loadingPolicies, setLoadingPolicies] = useState(true)
  const [error, setError] = useState('')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedDependent, setSelectedDependent] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load employee data
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoadingEmployee(true)
        const data = await api.getMe()
        console.log('Employee data from api.getMe():', data)
        console.log('Employee structure:', {
          hasDirect: !!data?.id,
          hasNested: !!data?.employee?.id,
          directId: data?.id,
          nestedId: data?.employee?.id,
          employee: data?.employee,
          fullData: data
        })
        setEmployee(data)
      } catch (err: any) {
        setError('Failed to load employee data')
        console.error('Employee load error:', err)
      } finally {
        setLoadingEmployee(false)
      }
    }

    fetchEmployee()
  }, [])

  // Load dependents and policies when employee is loaded
  useEffect(() => {
    const empId = employee?.employee?.id || employee?.id
    if (!empId) return

    const fetchData = async () => {
      try {
        setLoadingDependents(true)
        setLoadingPolicies(true)

        const empIdNum = typeof empId === 'string' ? parseInt(empId, 10) : empId

        const [depData, polData] = await Promise.all([
          api.getDependents(empIdNum),
          api.getPolicies ? api.getPolicies() : Promise.resolve([])
        ])

        console.log('Dependents data:', depData)
        console.log('Policies data:', polData)
        
        setDependents(Array.isArray(depData) ? depData : depData?.data || [])
        setPolicies(Array.isArray(polData) ? polData : polData?.data || [])
      } catch (err: any) {
        console.error('Data load error:', err)
        // Don't show error if dependents haven't been added yet
        if (err.status !== 404) {
          setError('Failed to load data')
        }
      } finally {
        setLoadingDependents(false)
        setLoadingPolicies(false)
      }
    }

    fetchData()
  }, [employee?.id, employee?.employee?.id])

  const handleAddDependent = async (formData: any) => {
    const empId = employee?.employee?.id || employee?.id
    console.log('handleAddDependent called with:', { formData, empId, employee })
    
    if (!empId) {
      console.error('No employee ID found!')
      throw new Error('No employee ID - cannot create dependent')
    }

    try {
      setIsSubmitting(true)
      const empIdNum = typeof empId === 'string' ? parseInt(empId, 10) : empId
      console.log('Creating dependent with empIdNum:', empIdNum)
      
      const createRes = await api.createDependent(empIdNum, {
        ...formData,
        employeeId: empIdNum
      })
      
      console.log('Create dependent response:', createRes)

      // Refresh dependents list
      setLoadingDependents(true)
      const updated = await api.getDependents(empIdNum)
      console.log('Updated dependents list after creation:', updated)
      const depList = Array.isArray(updated) ? updated : updated?.data || []
      console.log('Parsed dependent list:', depList)
      setDependents(depList)
      setAddModalOpen(false)
    } catch (err: any) {
      console.error('Error adding dependent:', err)
      throw new Error(err.message || 'Failed to add dependent')
    } finally {
      setIsSubmitting(false)
      setLoadingDependents(false)
    }
  }

  const handleAssignPolicy = async (policyId: string) => {
    if (!selectedDependent?.id) return
    const empId = employee?.employee?.id || employee?.id
    if (!empId) return

    try {
      setIsSubmitting(true)
      const empIdNum = typeof empId === 'string' ? parseInt(empId, 10) : empId
      const depId = typeof selectedDependent.id === 'string' ? parseInt(selectedDependent.id, 10) : selectedDependent.id
      
      const assignRes = await api.assignPolicy(depId, {
        policyId,
        employeeId: empIdNum
      })
      
      console.log('Assign policy response:', assignRes)

      // Refresh dependents list
      setLoadingDependents(true)
      const updated = await api.getDependents(empIdNum)
      console.log('Updated dependents after policy assignment:', updated)
      const depList = Array.isArray(updated) ? updated : updated?.data || []
      setDependents(depList)
      setAssignModalOpen(false)
      setSelectedDependent(null)
    } catch (err: any) {
      console.error('Error assigning policy:', err)
      throw new Error(err.message || 'Failed to assign policy')
    } finally {
      setIsSubmitting(false)
      setLoadingDependents(false)
    }
  }

  const handleDeleteDependent = async (dependentId: string) => {
    if (!window.confirm('Are you sure you want to delete this dependent? This action cannot be undone.')) {
      return
    }

    const empId = employee?.employee?.id || employee?.id
    if (!empId) return

    try {
      setIsSubmitting(true)
      const empIdNum = typeof empId === 'string' ? parseInt(empId, 10) : empId
      const depIdNum = typeof dependentId === 'string' ? parseInt(dependentId, 10) : dependentId
      
      await api.deleteDependent(depIdNum, empIdNum)

      // Refresh dependents list
      setLoadingDependents(true)
      const updated = await api.getDependents(empIdNum)
      setDependents(Array.isArray(updated) ? updated : updated?.data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to delete dependent')
    } finally {
      setIsSubmitting(false)
      setLoadingDependents(false)
    }
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
        <span style={{fontWeight: '500', color: '#0f172a'}}>Dependents</span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Left Column - Employee Summary */}
        <div>
          <EmployeeSummaryCard
            employee={employee}
            isLoading={loadingEmployee}
          />
        </div>

        {/* Right Column - Dependents Management */}
        <div style={{minHeight: 'fit-content'}}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '600',
                color: '#0f172a'
              }}>
                Dependents {dependents.length > 0 && `(${dependents.length})`}
              </h2>
              <button
                onClick={() => setAddModalOpen(true)}
                style={{
                  padding: '8px 16px',
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
                + Add Dependent
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px',
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

            {/* Dependents List */}
            <DependentTable
              dependents={dependents}
              isLoading={loadingDependents}
              onAssignPolicy={(dependent) => {
                setSelectedDependent(dependent)
                setAssignModalOpen(true)
              }}
              onDelete={handleDeleteDependent}
              onView={(dependent) => {
                // Could be expanded to show a view modal
                console.log('View dependent:', dependent)
              }}
            />
          </div>

          {/* Quick Stats */}
          {!loadingDependents && dependents.length > 0 && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '13px',
              color: '#6b7280'
            }}>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                <div>
                  <div style={{fontWeight: '500', color: '#0f172a', marginBottom: '4px'}}>Total Dependents</div>
                  <div style={{fontSize: '20px', fontWeight: '600', color: '#0b63ff'}}>{dependents.length}</div>
                </div>
                <div>
                  <div style={{fontWeight: '500', color: '#0f172a', marginBottom: '4px'}}>With Policy</div>
                  <div style={{fontSize: '20px', fontWeight: '600', color: '#10b981'}}>
                    {dependents.filter(d => d.policyId || d.policy).length}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddDependentModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddDependent}
        isLoading={isSubmitting}
      />

      {selectedDependent && (
        <AssignPolicyModal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          dependentName={selectedDependent.name}
          currentPolicy={selectedDependent.policyId}
          policies={policies}
          onAssign={handleAssignPolicy}
          isLoading={isSubmitting}
        />
      )}
    </div>
  )
}
