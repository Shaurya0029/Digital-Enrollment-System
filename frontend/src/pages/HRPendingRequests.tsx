import { useState, useEffect } from 'react'
import { Check, X, Clock, AlertCircle, Loader, FileText, Users, Heart } from 'lucide-react'
import api from '../api'
import RequireRole from '../components/RequireRole'

interface PendingRequest {
  id: string | number
  employeeId: number
  employeeName: string
  employeeEmail: string
  requestType: 'enrollment' | 'dependent' | 'approval'
  details: string
  submittedDate: string
  status: 'pending' | 'approved' | 'rejected'
  metadata?: any
}

interface KPIStats {
  totalPending: number
  pendingEnrollments: number
  pendingDependents: number
  pendingApprovals: number
}

export default function HRPendingRequests() {
  const [requests, setRequests] = useState<PendingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<'all' | 'enrollment' | 'dependent' | 'approval'>('all')
  const [selectedForApproval, setSelectedForApproval] = useState<Set<string | number>>(new Set())
  const [rejectingId, setRejectingId] = useState<number | string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [stats, setStats] = useState<KPIStats>({
    totalPending: 0,
    pendingEnrollments: 0,
    pendingDependents: 0,
    pendingApprovals: 0
  })

  // Load pending requests from backend
  async function loadPendingRequests() {
    try {
      setLoading(true)
      setError(null)

      // Fetch employees and dependents
      const employeesRes = await api.hrListEmployees().catch(() => [])
      const dependentsRes = await api.getDependents().catch(() => [])

      const employees = Array.isArray(employeesRes) ? employeesRes : employeesRes?.data || []
      const dependents = Array.isArray(dependentsRes) ? dependentsRes : dependentsRes?.data || []

      const pendingRequests: PendingRequest[] = []

      // Add pending employee enrollments (those without policies or incomplete profiles)
      employees.forEach((emp: any) => {
        // Check if employee has incomplete profile (missing dob, address, etc.)
        if (!emp.dob || !emp.address || emp.enrollmentStatus === 'PENDING') {
          pendingRequests.push({
            id: `enroll-${emp.id}`,
            employeeId: emp.id,
            employeeName: emp.user?.name || emp.name || `Employee ${emp.id}`,
            employeeEmail: emp.user?.email || emp.email || 'N/A',
            requestType: 'enrollment',
            details: 'Complete Insurance Enrollment',
            submittedDate: emp.createdAt || new Date().toISOString().split('T')[0],
            status: 'pending',
            metadata: { employeeId: emp.id, userId: emp.userId }
          })
        }
      })

      // Add pending dependents (those with pending status or without assigned policies)
      dependents.forEach((dep: any) => {
        if (dep.status === 'pending' || !dep.policyId) {
          pendingRequests.push({
            id: `dep-${dep.id}`,
            employeeId: dep.employeeId,
            employeeName: employees.find((e: any) => e.id === dep.employeeId)?.user?.name || 
                         employees.find((e: any) => e.id === dep.employeeId)?.name || 'Unknown',
            employeeEmail: employees.find((e: any) => e.id === dep.employeeId)?.user?.email || 
                          employees.find((e: any) => e.id === dep.employeeId)?.email || 'N/A',
            requestType: 'dependent',
            details: `Dependent: ${dep.name} (${dep.relationship || 'Family Member'})`,
            submittedDate: dep.createdAt || new Date().toISOString().split('T')[0],
            status: 'pending',
            metadata: { dependentId: dep.id, dependentName: dep.name, relationship: dep.relationship }
          })
        }
      })

      // Calculate stats
      const stats: KPIStats = {
        totalPending: pendingRequests.length,
        pendingEnrollments: pendingRequests.filter(r => r.requestType === 'enrollment').length,
        pendingDependents: pendingRequests.filter(r => r.requestType === 'dependent').length,
        pendingApprovals: pendingRequests.filter(r => r.requestType === 'approval').length
      }

      setRequests(pendingRequests)
      setStats(stats)
    } catch (err: any) {
      console.error('Error loading pending requests:', err)
      setError('Failed to load pending requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPendingRequests()
  }, [])

  const filteredRequests = requests.filter(r => 
    activeFilter === 'all' ? r.status === 'pending' : r.requestType === activeFilter && r.status === 'pending'
  )

  const toggleSelectRequest = (id: number | string) => {
    const newSelected = new Set(selectedForApproval)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedForApproval(newSelected)
  }

  const handleApproveRequest = async (id: number | string) => {
    try {
      setIsProcessing(true)
      const idStr = String(id)
      const [type, actualId] = idStr.split('-')

      if (type === 'enroll') {
        // Approve employee enrollment
        await api.hrUpdateEmployee(Number(actualId), { enrollmentStatus: 'APPROVED' })
      } else if (type === 'dep') {
        // Approve dependent - set status to active and activate
        await api.updateDependent(Number(actualId), { status: 'active' })
      }

      // Update local state - remove from pending
      setRequests(requests.filter(r => r.id !== id))

      // Remove from selected
      const newSelected = new Set(selectedForApproval)
      newSelected.delete(id)
      setSelectedForApproval(newSelected)

      // Recalculate stats
      const updatedRequests = requests.filter(r => r.id !== id)
      const newStats: KPIStats = {
        totalPending: updatedRequests.length,
        pendingEnrollments: updatedRequests.filter(r => r.requestType === 'enrollment').length,
        pendingDependents: updatedRequests.filter(r => r.requestType === 'dependent').length,
        pendingApprovals: updatedRequests.filter(r => r.requestType === 'approval').length
      }
      setStats(newStats)

    } catch (err: any) {
      setError(err.message || 'Failed to approve request')
      console.error('Approve error:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRejectRequest = async (id: number | string) => {
    if (!rejectReason.trim()) {
      setError('Please provide a rejection reason')
      return
    }

    try {
      setIsProcessing(true)
      const idStr = String(id)
      const [type, actualId] = idStr.split('-')

      if (type === 'enroll') {
        // Reject employee enrollment
        await api.hrUpdateEmployee(Number(actualId), { 
          enrollmentStatus: 'REJECTED',
          rejectionReason: rejectReason
        })
      } else if (type === 'dep') {
        // Reject dependent - set status to inactive
        await api.updateDependent(Number(actualId), { 
          status: 'inactive',
          rejectionReason: rejectReason
        })
      }

      // Update local state - remove from pending
      setRequests(requests.filter(r => r.id !== id))

      // Remove from selected
      const newSelected = new Set(selectedForApproval)
      newSelected.delete(id)
      setSelectedForApproval(newSelected)

      // Recalculate stats
      const updatedRequests = requests.filter(r => r.id !== id)
      const newStats: KPIStats = {
        totalPending: updatedRequests.length,
        pendingEnrollments: updatedRequests.filter(r => r.requestType === 'enrollment').length,
        pendingDependents: updatedRequests.filter(r => r.requestType === 'dependent').length,
        pendingApprovals: updatedRequests.filter(r => r.requestType === 'approval').length
      }
      setStats(newStats)

      setRejectingId(null)
      setRejectReason('')
    } catch (err: any) {
      setError(err.message || 'Failed to reject request')
      console.error('Reject error:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const approveAllSelected = async () => {
    try {
      setIsProcessing(true)
      const selectedArray = Array.from(selectedForApproval)
      
      for (const id of selectedArray) {
        await handleApproveRequest(id)
      }

      setSelectedForApproval(new Set())
    } catch (err: any) {
      setError(`Error approving requests: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const getRequestTypeIcon = (type: string) => {
    switch(type) {
      case 'enrollment': return <FileText size={16} />
      case 'dependent': return <Heart size={16} />
      case 'approval': return <Users size={16} />
      default: return <AlertCircle size={16} />
    }
  }

  const getRequestTypeColor = (type: string) => {
    switch(type) {
      case 'enrollment': return { bg: '#3b82f6', text: '#1e40af' }
      case 'dependent': return { bg: '#8b5cf6', text: '#5b21b6' }
      case 'approval': return { bg: '#f59e0b', text: '#92400e' }
      default: return { bg: '#6b7280', text: '#1f2937' }
    }
  }

  const getDaysAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    return days === 0 ? 'Today' : `${days} day${days > 1 ? 's' : ''} ago`
  }

  return (
    <RequireRole role="HR">
      <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
          color: '#fff',
          padding: '32px 24px'
        }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '700', margin: '0 0 8px 0' }}>
              Pending Requests
            </h1>
            <p style={{ fontSize: '16px', opacity: 0.9, margin: 0 }}>
              Review and process pending enrollments, dependents, and approvals
            </p>
          </div>
        </div>

        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              {error}
            </div>
          )}

          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <Clock size={20} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Total Pending</span>
              </div>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>{stats.totalPending}</p>
            </div>

            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#dbeafe', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} style={{ color: '#0284c7' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Enrollments</span>
              </div>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>{stats.pendingEnrollments}</p>
            </div>

            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#ede9fe', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Heart size={20} style={{ color: '#7c3aed' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Dependents</span>
              </div>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>{stats.pendingDependents}</p>
            </div>

            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#fef3c7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertCircle size={20} style={{ color: '#f59e0b' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Approvals</span>
              </div>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>{stats.pendingApprovals}</p>
            </div>
          </div>

          {/* Filter Tabs & Bulk Actions */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            marginBottom: '24px',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(['all', 'enrollment', 'dependent', 'approval'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: activeFilter === tab ? '#6366f1' : '#f3f4f6',
                    color: activeFilter === tab ? '#fff' : '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab === 'all' ? 'All' : tab === 'enrollment' ? 'Enrollments' : tab === 'dependent' ? 'Dependents' : 'Approvals'}
                </button>
              ))}
            </div>

            {selectedForApproval.size > 0 && (
              <button
                onClick={approveAllSelected}
                disabled={isProcessing}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.5 : 1
                }}
              >
                {isProcessing ? 'Processing...' : `Approve All (${selectedForApproval.size})`}
              </button>
            )}
          </div>

          {/* Requests Table */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            {filteredRequests.length === 0 ? (
              <div style={{
                padding: '48px 24px',
                textAlign: 'center'
              }}>
                <AlertCircle size={48} style={{ margin: '0 auto 16px', color: '#d1d5db' }} />
                <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
                  No pending requests at this time
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <tr>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#6b7280',
                        textTransform: 'uppercase'
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedForApproval.size === filteredRequests.length && filteredRequests.length > 0}
                          onChange={() => {
                            if (selectedForApproval.size === filteredRequests.length) {
                              setSelectedForApproval(new Set())
                            } else {
                              setSelectedForApproval(new Set(filteredRequests.map(r => r.id)))
                            }
                          }}
                        />
                      </th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#6b7280',
                        textTransform: 'uppercase'
                      }}>Employee</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#6b7280',
                        textTransform: 'uppercase'
                      }}>Request Type</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#6b7280',
                        textTransform: 'uppercase'
                      }}>Details</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#6b7280',
                        textTransform: 'uppercase'
                      }}>Submitted</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#6b7280',
                        textTransform: 'uppercase'
                      }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request, idx) => (
                      <tr
                        key={request.id}
                        style={{
                          borderBottom: '1px solid #e5e7eb',
                          backgroundColor: selectedForApproval.has(request.id as any) ? '#f0f9ff' : 'transparent',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={selectedForApproval.has(request.id as any)}
                            onChange={() => toggleSelectRequest(request.id)}
                          />
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0 }}>
                              {request.employeeName}
                            </p>
                            <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
                              {request.employeeEmail}
                            </p>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            backgroundColor: `${getRequestTypeColor(request.requestType).bg}`,
                            color: getRequestTypeColor(request.requestType).text,
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {getRequestTypeIcon(request.requestType)}
                            {request.requestType === 'enrollment' ? 'Enrollment' : request.requestType === 'dependent' ? 'Dependent' : 'Approval'}
                          </div>
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>
                          {request.details}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                          {getDaysAgo(request.submittedDate)}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleApproveRequest(request.id)}
                              disabled={isProcessing}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                backgroundColor: '#d1fae5',
                                color: '#065f46',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                opacity: isProcessing ? 0.5 : 1,
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={e => {
                                if (!isProcessing) e.currentTarget.style.backgroundColor = '#a7f3d0'
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor = '#d1fae5'
                              }}
                            >
                              <Check size={16} />
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectingId(request.id)}
                              disabled={isProcessing}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                opacity: isProcessing ? 0.5 : 1,
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={e => {
                                if (!isProcessing) e.currentTarget.style.backgroundColor = '#fecaca'
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor = '#fee2e2'
                              }}
                            >
                              <X size={16} />
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Rejection Modal */}
        {rejectingId !== null && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50
            }}
            onClick={e => {
              if (e.target === e.currentTarget) setRejectingId(null)
            }}
          >
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '24px',
                width: '90%',
                maxWidth: '400px'
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: '0 0 16px 0' }}>
                Reject Request
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                Please provide a reason for rejection:
              </p>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  marginBottom: '16px'
                }}
                rows={4}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    setRejectingId(null)
                    setRejectReason('')
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRejectRequest(rejectingId)}
                  disabled={isProcessing || !rejectReason.trim()}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isProcessing || !rejectReason.trim() ? 'not-allowed' : 'pointer',
                    opacity: isProcessing || !rejectReason.trim() ? 0.5 : 1,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    if (!isProcessing && rejectReason.trim()) e.currentTarget.style.backgroundColor = '#dc2626'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = '#ef4444'
                  }}
                >
                  {isProcessing ? 'Processing...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireRole>
  )
}
