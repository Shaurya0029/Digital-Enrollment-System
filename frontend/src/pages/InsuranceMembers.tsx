import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import RequireRole from '../components/RequireRole'
import ConfirmDialog from '../components/ConfirmDialog'
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  Shield,
  Loader
} from 'lucide-react'

interface Dependent {
  id: number
  name: string
  relationship: string
  dob?: string
  gender?: string
  status: 'pending' | 'active' | 'inactive'
  policyId?: number
  employeeId: number
  createdAt?: string
  updatedAt?: string
}

interface Policy {
  id: number
  name: string
  policyNumber: string
  status?: string
}

interface Employee {
  id: number
  name: string
  email: string
  dependents?: Dependent[]
}

interface KPIMetrics {
  totalMembers: number
  activeMembers: number
  pendingMembers: number
  inactiveMembers: number
}

export default function InsuranceMembers() {
  const navigate = useNavigate()
  const [members, setMembers] = useState<Dependent[]>([])
  const [policies, setPolicies] = useState<Policy[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>('all')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [deactivateConfirm, setDeactivateConfirm] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Dependent | null>(null)
  const [formData, setFormData] = useState({ name: '', relationship: 'spouse', employeeId: '', dob: '' })
  const [assignData, setAssignData] = useState({ policyId: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [kpis, setKpis] = useState<KPIMetrics>({ totalMembers: 0, activeMembers: 0, pendingMembers: 0, inactiveMembers: 0 })

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [deps, pols, emps] = await Promise.all([
        api.getDependents(),
        api.getPolicies(),
        api.hrListEmployees()
      ])

      const dependentsList = Array.isArray(deps) ? deps : deps?.data || []
      const policiesList = Array.isArray(pols) ? pols : pols?.data || []
      const employeesList = Array.isArray(emps) ? emps : emps?.data || []

      setMembers(dependentsList)
      setPolicies(policiesList)
      setEmployees(employeesList)

      // Calculate KPIs
      const kpiData: KPIMetrics = {
        totalMembers: dependentsList.length,
        activeMembers: dependentsList.filter((m: Dependent) => m.status === 'active').length,
        pendingMembers: dependentsList.filter((m: Dependent) => m.status === 'pending').length,
        inactiveMembers: dependentsList.filter((m: Dependent) => m.status === 'inactive').length
      }
      setKpis(kpiData)
    } catch (err: any) {
      setError(err.message || 'Failed to load members')
      console.error('Load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter
    return matchesSearch && matchesStatus
  })

  async function handleAddMember() {
    if (!formData.name.trim() || !formData.employeeId) {
      setError('Please fill in all required fields')
      return
    }

    setIsSaving(true)
    setError('')
    try {
      const payload = {
        name: formData.name,
        relationship: formData.relationship,
        dob: formData.dob || undefined,
        employeeId: parseInt(formData.employeeId),
        status: 'pending'
      }
      
      const result = await api.createDependent(parseInt(formData.employeeId), payload)
      
      setMembers([...members, result])
      setKpis({
        ...kpis,
        totalMembers: kpis.totalMembers + 1,
        pendingMembers: kpis.pendingMembers + 1
      })
      setAddModalOpen(false)
      setFormData({ name: '', relationship: 'spouse', employeeId: '', dob: '' })
    } catch (err: any) {
      setError(err.message || 'Failed to add member')
      console.error('Add member error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleActivateMember(member: Dependent) {
    setIsSaving(true)
    setError('')
    try {
      await api.updateDependent(member.id, { status: 'active' })
      
      const updated = members.map(m => 
        m.id === member.id ? { ...m, status: 'active' as const } : m
      )
      setMembers(updated)
      setKpis({
        totalMembers: kpis.totalMembers,
        activeMembers: updated.filter((m: Dependent) => m.status === 'active').length,
        pendingMembers: updated.filter((m: Dependent) => m.status === 'pending').length,
        inactiveMembers: updated.filter((m: Dependent) => m.status === 'inactive').length
      })
    } catch (err: any) {
      setError(err.message || 'Failed to activate member')
      console.error('Activate error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeactivateMember() {
    if (!selectedMember) return
    
    setIsSaving(true)
    setError('')
    try {
      await api.updateDependent(selectedMember.id, { status: 'inactive' })
      
      const updated = members.map(m => 
        m.id === selectedMember.id ? { ...m, status: 'inactive' as const } : m
      )
      setMembers(updated)
      setKpis({
        totalMembers: kpis.totalMembers,
        activeMembers: updated.filter((m: Dependent) => m.status === 'active').length,
        pendingMembers: updated.filter((m: Dependent) => m.status === 'pending').length,
        inactiveMembers: updated.filter((m: Dependent) => m.status === 'inactive').length
      })
      setDeactivateConfirm(false)
      setSelectedMember(null)
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate member')
      console.error('Deactivate error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleAssignPolicy() {
    if (!selectedMember || !assignData.policyId) {
      setError('Please select a policy')
      return
    }

    setIsSaving(true)
    setError('')
    try {
      await api.assignPolicy(selectedMember.id, { policyId: parseInt(assignData.policyId) })
      
      const updated = members.map(m => 
        m.id === selectedMember.id ? { ...m, policyId: parseInt(assignData.policyId) } : m
      )
      setMembers(updated)
      setAssignModalOpen(false)
      setSelectedMember(null)
      setAssignData({ policyId: '' })
    } catch (err: any) {
      setError(err.message || 'Failed to assign policy')
      console.error('Assign policy error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return { bg: '#d1fae5', text: '#065f46', icon: <CheckCircle size={14} /> }
      case 'pending':
        return { bg: '#fef3c7', text: '#92400e', icon: <Clock size={14} /> }
      case 'inactive':
        return { bg: '#fee2e2', text: '#7f1d1d', icon: <XCircle size={14} /> }
      default:
        return { bg: '#f3f4f6', text: '#374151', icon: null }
    }
  }

  const getEmployeeName = (empId: number) => {
    return employees.find(e => e.id === empId)?.name || 'Unknown'
  }

  const getPolicyName = (policyId?: number) => {
    return policies.find(p => p.id === policyId)?.name || 'Not assigned'
  }

  return (
    <RequireRole role="HR">
      <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        {loading && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50
          }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
              <Loader size={40} style={{ margin: '0 auto 16px', animation: 'spin 1s linear infinite', color: '#6366f1' }} />
              <p style={{ color: '#6b7280', margin: 0 }}>Loading members...</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
          color: '#fff',
          padding: '32px 24px',
          borderBottom: 'none'
        }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: '700', margin: '0 0 8px 0' }}>Insurance Members</h1>
              <p style={{ fontSize: '16px', opacity: 0.9, margin: 0 }}>Manage employee dependents and their insurance coverage</p>
            </div>
            <button
              onClick={() => setAddModalOpen(true)}
              style={{
                padding: '10px 16px',
                backgroundColor: '#fff',
                color: '#6366f1',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.opacity = '0.9'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              <Plus size={18} />
              Add Member
            </button>
          </div>
        </div>

        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '24px',
              color: '#7f1d1d',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {/* Total Members */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#e0e7ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={20} style={{ color: '#6366f1' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Total Members</span>
              </div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>{kpis.totalMembers}</p>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '8px 0 0 0' }}>All dependents</p>
            </div>

            {/* Active Members */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#d1fae5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={20} style={{ color: '#10b981' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Active Members</span>
              </div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>{kpis.activeMembers}</p>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '8px 0 0 0' }}>Coverage active</p>
            </div>

            {/* Pending Members */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#fef3c7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={20} style={{ color: '#f59e0b' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Pending Members</span>
              </div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>{kpis.pendingMembers}</p>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '8px 0 0 0' }}>Awaiting activation</p>
            </div>

            {/* Inactive Members */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#fee2e2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <XCircle size={20} style={{ color: '#ef4444' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Inactive Members</span>
              </div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>{kpis.inactiveMembers}</p>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '8px 0 0 0' }}>Deactivated</p>
            </div>
          </div>

          {/* Filters and Search */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #e5e7eb',
            marginBottom: '24px',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f3f4f6', borderRadius: '8px', paddingLeft: '12px' }}>
              <Search size={16} style={{ color: '#6b7280' }} />
              <input
                type="text"
                placeholder="Search members by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  backgroundColor: 'transparent',
                  padding: '8px 0',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f3f4f6', borderRadius: '8px', paddingLeft: '12px' }}>
              <Filter size={16} style={{ color: '#6b7280' }} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  padding: '8px 12px',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <button
              onClick={loadData}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#e5e7eb'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#f3f4f6'
              }}
            >
              Refresh
            </button>
          </div>

          {/* Members Table */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            {filteredMembers.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7280' }}>
                <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p style={{ fontSize: '14px', fontWeight: '500' }}>
                  {members.length === 0 ? 'No members yet. Click "Add Member" to get started.' : 'No members match your filters.'}
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Name</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Relationship</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Employee</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Policy</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => {
                      const statusBadge = getStatusBadge(member.status)
                      return (
                        <tr key={member.id} style={{ borderBottom: '1px solid #e5e7eb', transition: 'all 0.2s' }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = '#f9fafb'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', fontWeight: '500' }}>{member.name}</td>
                          <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280', textTransform: 'capitalize' }}>{member.relationship}</td>
                          <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>{getEmployeeName(member.employeeId)}</td>
                          <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>{getPolicyName(member.policyId)}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: statusBadge.bg,
                              color: statusBadge.text,
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              textTransform: 'capitalize'
                            }}>
                              {statusBadge.icon}
                              {member.status}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {member.status === 'pending' && (
                                <button
                                  onClick={() => handleActivateMember(member)}
                                  style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#d1fae5',
                                    color: '#065f46',
                                    border: '1px solid #a7f3d0',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.backgroundColor = '#a7f3d0'
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor = '#d1fae5'
                                  }}
                                  disabled={isSaving}
                                >
                                  Activate
                                </button>
                              )}
                              {member.status === 'active' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedMember(member)
                                      setAssignModalOpen(true)
                                    }}
                                    style={{
                                      padding: '6px 12px',
                                      backgroundColor: '#e0e7ff',
                                      color: '#4f46e5',
                                      border: '1px solid #c7d2fe',
                                      borderRadius: '6px',
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => {
                                      e.currentTarget.style.backgroundColor = '#c7d2fe'
                                    }}
                                    onMouseLeave={e => {
                                      e.currentTarget.style.backgroundColor = '#e0e7ff'
                                    }}
                                    disabled={isSaving}
                                  >
                                    <Shield size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                    Assign Policy
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedMember(member)
                                      setDeactivateConfirm(true)
                                    }}
                                    style={{
                                      padding: '6px 12px',
                                      backgroundColor: '#fee2e2',
                                      color: '#7f1d1d',
                                      border: '1px solid #fecaca',
                                      borderRadius: '6px',
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => {
                                      e.currentTarget.style.backgroundColor = '#fecaca'
                                    }}
                                    onMouseLeave={e => {
                                      e.currentTarget.style.backgroundColor = '#fee2e2'
                                    }}
                                    disabled={isSaving}
                                  >
                                    Deactivate
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Results count */}
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '12px', textAlign: 'right' }}>
            Showing {filteredMembers.length} of {members.length} members
          </p>
        </div>
      </div>

      {/* Add Member Modal */}
      {addModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 40
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            maxWidth: '500px',
            width: '90%'
          }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>Add Insurance Member</h2>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Employee <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select an employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Member full name"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Relationship <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={formData.relationship}
                  onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="spouse">Spouse</option>
                  <option value="child">Child</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setAddModalOpen(false)
                  setFormData({ name: '', relationship: 'spouse', employeeId: '', dob: '' })
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6366f1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
                disabled={isSaving}
              >
                {isSaving ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Policy Modal */}
      {assignModalOpen && selectedMember && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 40
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            maxWidth: '500px',
            width: '90%'
          }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>
                Assign Policy to {selectedMember.name}
              </h2>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Select Policy <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={assignData.policyId}
                  onChange={(e) => setAssignData({ policyId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Choose a policy</option>
                  {policies.map(policy => (
                    <option key={policy.id} value={policy.id}>{policy.name} ({policy.policyNumber})</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setAssignModalOpen(false)
                  setSelectedMember(null)
                  setAssignData({ policyId: '' })
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignPolicy}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6366f1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
                disabled={isSaving}
              >
                {isSaving ? 'Assigning...' : 'Assign Policy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation */}
      {deactivateConfirm && selectedMember && (
        <ConfirmDialog
          title="Deactivate Member"
          message={`Are you sure you want to deactivate ${selectedMember.name}? Their insurance coverage will be suspended.`}
          confirmLabel="Deactivate"
          cancelLabel="Cancel"
          onConfirm={handleDeactivateMember}
          onCancel={() => {
            setDeactivateConfirm(false)
            setSelectedMember(null)
          }}
        />
      )}
    </RequireRole>
  )
}
