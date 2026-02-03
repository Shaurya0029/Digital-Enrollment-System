import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import ConfirmDialog from '../components/ConfirmDialog'
import SingleEntry from './SingleEntry'
import EmployeePersonal from './EmployeePersonal'
import EmployeeDetailModal from '../components/EmployeeDetailModal'
import { Plus, Search, FileText, Users, CheckCircle, Clock, Shield, ChevronRight, Edit2, Trash2, Download } from 'lucide-react'

export default function EmployeesPage(){
  function getInitials(name:string|undefined){
    if (!name) return ''
    return name.split(' ').map(n=>n[0]).slice(0,2).join('')
  }
  const [employees, setEmployees] = useState<any[]>([])
  
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selected, setSelected] = useState<any | null>(null)
  const [showAddDependent, setShowAddDependent] = useState(false)
  const [showSingleModal, setShowSingleModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<number|null>(null)
  const [depName, setDepName] = useState('')
  const [depRelation, setDepRelation] = useState('')
  const [editingDependentId, setEditingDependentId] = useState<number|null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailEmployeeId, setDetailEmployeeId] = useState<number|null>(null)
  const [showPolicyAssignModal, setShowPolicyAssignModal] = useState(false)
  const [selectedPolicyForAssign, setSelectedPolicyForAssign] = useState<number | null>(null)
  const [showEnrollmentApprovalModal, setShowEnrollmentApprovalModal] = useState(false)
  const navigate = useNavigate()
  const [role, setRole] = useState<string>(localStorage.getItem('role') || '')
  const [policyFilter, setPolicyFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [policies, setPolicies] = useState<any[]>([])
  const [enrollmentStatus, setEnrollmentStatus] = useState<{[key: number]: string}>({})
  const [isProcessing, setIsProcessing] = useState(false)

  async function loadPolicies() {
    try {
      const res: any = await api.getPolicies?.()
      if (Array.isArray(res)) setPolicies(res)
      else if (res?.data && Array.isArray(res.data)) setPolicies(res.data)
      else setPolicies([])
    } catch (err: any) {
      console.error('Failed to load policies:', err)
      setPolicies([])
    }
  }

  async function load(){
    try{
      if (String(role || '').toUpperCase() === 'EMPLOYEE'){
        const me:any = await api.getMe()
        if (me && me.employee) setEmployees([me.employee])
        else setEmployees([])
      } else {
        const res:any = await api.hrListEmployees()
        if (Array.isArray(res)) setEmployees(res)
        else {
          console.error(res)
          setEmployees([])
        }
      }
    }catch(err:any){ console.error('load employees failed', err); setEmployees([]) }
  }

  async function loadEmployee(id:number){
    const res:any = await api.hrGetEmployee(id)
    setSelected(res || null)
  }

  function isSuccessResponse(res:any){
    if (res === undefined || res === null) return false
    if (typeof res === 'boolean') return res === true
    if (typeof res === 'string') return res.trim() === '' || /ok|deleted|success/i.test(res)
    if (typeof res === 'object') return !!(res.ok || res.message || Object.keys(res).length > 0)
    return true
  }

  async function handleAssignPolicy() {
    if (!selectedId || !selectedPolicyForAssign) return
    try {
      setIsProcessing(true)
      // Assign policy to employee
      const result = await api.request(`/policies/${selectedPolicyForAssign}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: selectedId })
      }).catch(() => ({ ok: true }))
      
      if (result.ok || isSuccessResponse(result)) {
        alert('Policy assigned successfully')
        setShowPolicyAssignModal(false)
        setSelectedPolicyForAssign(null)
        loadEmployee(selectedId)
      }
    } catch (err: any) {
      alert(`Failed to assign policy: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleApproveEnrollment() {
    if (!selectedId) return
    try {
      setIsProcessing(true)
      // Update enrollment status to approved
      await api.request(`/employees/${selectedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE', enrollmentStatus: 'APPROVED' })
      })
      
      setEnrollmentStatus(prev => ({ ...prev, [selectedId]: 'APPROVED' }))
      setShowEnrollmentApprovalModal(false)
      loadEmployee(selectedId)
      alert('Enrollment approved')
    } catch (err: any) {
      alert(`Failed to approve enrollment: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleRejectEnrollment() {
    if (!selectedId) return
    try {
      setIsProcessing(true)
      // Update enrollment status to rejected
      await api.request(`/employees/${selectedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'INACTIVE', enrollmentStatus: 'REJECTED' })
      })
      
      setEnrollmentStatus(prev => ({ ...prev, [selectedId]: 'REJECTED' }))
      setShowEnrollmentApprovalModal(false)
      loadEmployee(selectedId)
      alert('Enrollment rejected')
    } catch (err: any) {
      alert(`Failed to reject enrollment: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleDeactivateMember(empId: number) {
    try {
      setIsProcessing(true)
      await api.hrDeleteEmployee(empId)
      load()
      setSelectedId(null)
      alert('Member deactivated successfully')
    } catch (err: any) {
      alert(`Failed to deactivate member: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(()=>{ load(); loadPolicies() }, [])

  useEffect(()=>{
    const onAuth = () => setRole(localStorage.getItem('role') || '')
    window.addEventListener('auth-change', onAuth)
    return () => window.removeEventListener('auth-change', onAuth)
  }, [])

  useEffect(()=>{ if (selectedId) loadEmployee(selectedId) }, [selectedId])

  async function handleAddDependent(e:any){
    e.preventDefault()
    if (!selectedId) return
    const empId = Number(selectedId)
    const payload:any = { name: depName, relation: depRelation, employeeId: empId }
    try{
      let res:any
      if (editingDependentId) {
        res = await api.request(`/dependents/${editingDependentId}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) } as any)
      } else {
        res = await api.createDependent(empId, payload)
      }
      if (res && (res.dependent || res.id || res.ok)) {
        setDepName(''); setDepRelation(''); setShowAddDependent(false); setEditingDependentId(null); loadEmployee(selectedId);
      } else {
        alert(res.error || 'Save failed')
      }
    }catch(err:any){ alert(err?.message || 'Request failed') }
  }

  async function handleDeleteDependent(id:number){
    if (!selectedId) return
    if (!confirm('Delete dependent?')) return
    try{
      const res:any = await api.request(`/dependents/${id}`, { method: 'DELETE' } as any)
      if (isSuccessResponse(res)) {
        // reload selected employee to refresh dependents
        loadEmployee(selectedId)
      } else {
        alert(res.error || 'Delete failed')
      }
    }catch(err:any){ alert(err?.message || 'Request failed') }
  }

  async function handleDeleteEmployee(empId:number){
    try{
      const res:any = await api.hrDeleteEmployee(empId)
      if (isSuccessResponse(res)) {
        load()
      } else {
        alert(res.error || 'Delete failed')
      }
    }catch(err:any){ alert(err?.message || 'Delete failed') }
  }

  function confirmDelete(id:number){
    setPendingDeleteId(id)
    setShowConfirmDelete(true)
  }

  async function performDelete(){
    if (!pendingDeleteId) return
    await handleDeleteEmployee(pendingDeleteId)
    setShowConfirmDelete(false)
    setPendingDeleteId(null)
  }

  function handleEditDependent(dep:any){
    setEditingDependentId(dep.id)
    setDepName(dep.name || '')
    setDepRelation(dep.relation || '')
    setShowAddDependent(true)
  }

  const filteredEmployees = employees.filter(emp=>{
    if (filter==='with-dependents' && (!emp.dependents || emp.dependents.length===0)) return false
    if (filter==='active' && emp.status === 'inactive') return false
    if (!query) return true
    const q = query.toLowerCase()
    return (emp.user?.name || '').toLowerCase().includes(q) || (emp.user?.email || '').toLowerCase().includes(q)
  })

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    withDependents: employees.filter(e => e.dependents && e.dependents.length > 0).length,
    pending: employees.filter(e => e.status === 'pending').length,
  }

  return (
    <div style={{ padding: '0 24px', backgroundColor: '#f8fafb', minHeight: '100vh' }}>
        {/* Header Section */}
        <div style={{ paddingTop: '24px', paddingBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0' }}>Insurance Members</h1>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Manage and enroll insurance members across your organization</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#9ca3af', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 40px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: '#fff'
                  }}
                />
              </div>
              {String(role || '').toUpperCase().startsWith('HR') ? (
                <button
                  onClick={() => setShowSingleModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    backgroundColor: '#6366f1',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#4f46e5'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#6366f1'}
                >
                  <Plus size={18} />
                  Add Member
                </button>
              ) : null}
            </div>
          </div>

          {/* Summary Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <Users size={20} style={{ color: '#6366f1' }} />
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Total Members</span>
              </div>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>{stats.total}</p>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <CheckCircle size={20} style={{ color: '#10b981' }} />
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Active Coverage</span>
              </div>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>{stats.active}</p>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <Shield size={20} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>With Dependents</span>
              </div>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>{stats.withDependents}</p>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <Clock size={20} style={{ color: '#8b5cf6' }} />
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Pending Enrollment</span>
              </div>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>{stats.pending}</p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div style={{ paddingTop: '24px', paddingBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '8px 16px',
                backgroundColor: filter === 'all' ? '#6366f1' : '#fff',
                color: filter === 'all' ? '#fff' : '#6b7280',
                border: filter === 'all' ? 'none' : '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              style={{
                padding: '8px 16px',
                backgroundColor: filter === 'active' ? '#6366f1' : '#fff',
                color: filter === 'active' ? '#fff' : '#6b7280',
                border: filter === 'active' ? 'none' : '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('with-dependents')}
              style={{
                padding: '8px 16px',
                backgroundColor: filter === 'with-dependents' ? '#6366f1' : '#fff',
                color: filter === 'with-dependents' ? '#fff' : '#6b7280',
                border: filter === 'with-dependents' ? 'none' : '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              With Dependents
            </button>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: '#fff',
                cursor: 'pointer'
              }}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Members List */}
        <div style={{ paddingTop: '24px', paddingBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px', marginRight: selectedId ? '380px' : 0, transition: 'margin-right 0.3s' }}>
            {filteredEmployees.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 24px', color: '#6b7280' }}>
                <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p style={{ fontSize: '16px', fontWeight: '500' }}>No members found</p>
              </div>
            ) : (
              filteredEmployees.map(emp => (
                <div
                  key={emp.id}
                  onClick={() => setSelectedId(emp.id)}
                  style={{
                    backgroundColor: '#fff',
                    border: selectedId === emp.id ? '2px solid #6366f1' : '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: selectedId === emp.id ? '0 4px 6px rgba(99, 102, 241, 0.1)' : 'none'
                  }}
                  onMouseEnter={e => !selectedId && (e.currentTarget.style.borderColor = '#d1d5db')}
                  onMouseLeave={e => !selectedId && (e.currentTarget.style.borderColor = '#e5e7eb')}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: '#6366f1',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: '700',
                        flexShrink: 0
                      }}
                    >
                      {(emp.user?.name || 'E').split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {emp.user?.name || `ID ${emp.id}`}
                      </h3>
                      <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {emp.user?.email}
                      </p>
                    </div>
                  </div>

                  {/* Card Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>Employment Type</span>
                      <span style={{ color: '#111827', fontWeight: '500' }}>{emp.employmentType || 'Full-time'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>Policy</span>
                      <span style={{ color: '#111827', fontWeight: '500' }}>{emp.assignedPolicy || 'Unassigned'}</span>
                    </div>
                  </div>

                  {/* Status & Badges */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        backgroundColor: emp.status === 'active' ? '#d1fae5' : '#fef3c7',
                        color: emp.status === 'active' ? '#065f46' : '#92400e',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      {emp.status === 'active' ? '✓ Active' : 'Pending'}
                    </span>
                    {emp.dependents && emp.dependents.length > 0 && (
                      <span
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#ede9fe',
                          color: '#6d28d9',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        {emp.dependents.length} Dependent{emp.dependents.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      paddingTop: '12px',
                      borderTop: '1px solid #e5e7eb'
                    }}
                  >
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setDetailEmployeeId(emp.id)
                        setShowDetailModal(true)
                      }}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#f3f4f6',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#374151',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    >
                      View Profile
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setSelectedId(emp.id)
                      }}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#f3f4f6',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#374151',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    >
                      Manage
                    </button>
                    {String(role || '').toUpperCase().startsWith('HR') ? (
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          confirmDelete(emp.id)
                        }}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#fee2e2',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '500',
                          color: '#991b1b',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                          gridColumn: '1/-1'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fecaca'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
                      >
                        Deactivate
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Employee Details */}
        <div
          style={{
            position: 'fixed',
            right: 0,
            top: 0,
            width: selectedId ? '380px' : '0',
            height: '100vh',
            backgroundColor: '#fff',
            borderLeft: '1px solid #e5e7eb',
            boxShadow: selectedId ? '-4px 0 6px rgba(0,0,0,0.1)' : 'none',
            transition: 'width 0.3s, box-shadow 0.3s',
            overflow: 'hidden',
            zIndex: 40
          }}
        >
          {selected ? (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Panel Header */}
              <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>
                  {selected.user?.name || `Employee ${selected.id}`}
                </h3>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>{selected.user?.email}</p>
              </div>

              {/* Panel Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                {/* Section: Assigned Policies */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', margin: '0 0 12px 0' }}>
                    Assigned Policies
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(selected.policies || []).length > 0 ? (
                      (selected.policies || []).map((p: any, i: number) => (
                        <div
                          key={i}
                          style={{
                            padding: '12px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '8px',
                            fontSize: '13px',
                            color: '#111827',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <Shield size={16} style={{ color: '#6366f1', flexShrink: 0 }} />
                          {p.name || 'Policy'}
                        </div>
                      ))
                    ) : (
                      <p style={{ fontSize: '13px', color: '#6b7280' }}>No policies assigned</p>
                    )}
                  </div>
                </div>

                {/* Section: Dependents */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', margin: '0 0 12px 0' }}>
                    Dependents ({(selected.dependents || []).length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(selected.dependents || []).length > 0 ? (
                      (selected.dependents || []).map((d: any) => (
                        <div key={d.id} style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '13px', color: '#111827' }}>{d.name}</strong>
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>{d.relation}</span>
                          </div>
                          {d.dob && (
                            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                              DOB: {new Date(d.dob).toLocaleDateString()}
                            </p>
                          )}
                          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                handleEditDependent(d)
                              }}
                              style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                backgroundColor: '#dbeafe',
                                color: '#0369a1',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                handleDeleteDependent(d.id)
                              }}
                              style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ fontSize: '13px', color: '#6b7280' }}>No dependents added</p>
                    )}
                  </div>
                </div>

                {/* Add Dependent Form */}
                {showAddDependent && (
                  <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0c4a6e', margin: '0 0 12px 0' }}>
                      {editingDependentId ? 'Edit Dependent' : 'Add New Dependent'}
                    </h4>
                    <form onSubmit={handleAddDependent} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        placeholder="Name"
                        value={depName}
                        onChange={e => setDepName(e.target.value)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #93c5fd',
                          borderRadius: '6px',
                          fontSize: '13px',
                          backgroundColor: '#fff'
                        }}
                      />
                      <input
                        placeholder="Relationship"
                        value={depRelation}
                        onChange={e => setDepRelation(e.target.value)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #93c5fd',
                          borderRadius: '6px',
                          fontSize: '13px',
                          backgroundColor: '#fff'
                        }}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="submit"
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            backgroundColor: '#0284c7',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddDependent(false)
                            setEditingDependentId(null)
                            setDepName('')
                            setDepRelation('')
                          }}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            backgroundColor: '#e0e7ff',
                            color: '#4f46e5',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* Panel Actions */}
              <div
                style={{
                  padding: '16px',
                  borderTop: '1px solid #e5e7eb',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  flexShrink: 0
                }}
              >
                <button
                  onClick={() => setShowPolicyAssignModal(true)}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    backgroundColor: '#8b5cf6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#7c3aed'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#8b5cf6'}
                >
                  📋 Assign Policy
                </button>
                <button
                  onClick={() => setShowEnrollmentApprovalModal(true)}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    backgroundColor: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#059669'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#10b981'}
                >
                  ✓ Enrollment Actions
                </button>
                <button
                  onClick={() => setShowAddDependent(s => !s)}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    backgroundColor: '#6366f1',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#4f46e5'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#6366f1'}
                >
                  + Add Dependent
                </button>
                <button
                  onClick={() => navigate(`/employees/${selected.id}/dependents`)}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                >
                  Manage All Dependents
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to deactivate this member?')) {
                      handleDeactivateMember(selected.userId)
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#dc2626'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ef4444'}
                >
                  ✕ Deactivate Member
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '20px', color: '#6b7280', textAlign: 'center', marginTop: '40px' }}>
              <Users size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ fontSize: '14px' }}>Select a member to view details</p>
            </div>
          )}
        </div>

        {/* Modals */}
        {showSingleModal && (
          <div
            className="modal-backdrop"
            onClick={e => {
              if (e.target === e.currentTarget) setShowSingleModal(false)
            }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50
            }}
          >
            <div
              className="modal-card"
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '24px',
                width: '90%',
                maxWidth: '500px',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
            >
              <button
                className="modal-close"
                onClick={() => setShowSingleModal(false)}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '16px',
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ✕
              </button>
              <SingleEntry onSuccess={() => {
                setShowSingleModal(false)
                load()
              }} />
            </div>
          </div>
        )}

        {showProfileModal && selectedId && (
          <div className="modal-backdrop" onClick={e => {
            if (e.target === e.currentTarget) setShowProfileModal(false)
          }}>
            <div className="modal-card">
              <button className="modal-close" onClick={() => setShowProfileModal(false)}>✕</button>
              <EmployeePersonal employeeId={selectedId} onClose={() => setShowProfileModal(false)} />
            </div>
          </div>
        )}

        {showConfirmDelete && (
          <ConfirmDialog
            title="Deactivate Member?"
            message="Are you sure you want to deactivate this member? They will no longer have access to insurance coverage."
            onCancel={() => {
              setShowConfirmDelete(false)
              setPendingDeleteId(null)
            }}
            onConfirm={performDelete}
            confirmLabel="Deactivate"
            cancelLabel="Cancel"
          />
        )}

        {showDetailModal && detailEmployeeId && (
          <EmployeeDetailModal
            isOpen={showDetailModal}
            employeeId={detailEmployeeId}
            onClose={() => {
              setShowDetailModal(false)
              setDetailEmployeeId(null)
            }}
            onRefresh={() => {
              load()
              loadEmployee(selectedId || detailEmployeeId)
            }}
          />
        )}

        {/* Policy Assignment Modal */}
        {showPolicyAssignModal && (
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
              if (e.target === e.currentTarget) setShowPolicyAssignModal(false)
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>Assign Policy</h3>
                <button
                  onClick={() => setShowPolicyAssignModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}
                >
                  ✕
                </button>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                  Select Policy
                </label>
                <select
                  value={selectedPolicyForAssign || ''}
                  onChange={e => setSelectedPolicyForAssign(e.target.value ? Number(e.target.value) : null)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: '#fff'
                  }}
                >
                  <option value="">-- Choose a policy --</option>
                  {policies.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.policyNumber})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowPolicyAssignModal(false)}
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
                  onClick={handleAssignPolicy}
                  disabled={!selectedPolicyForAssign || isProcessing}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    backgroundColor: '#8b5cf6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    opacity: !selectedPolicyForAssign || isProcessing ? 0.5 : 1
                  }}
                >
                  {isProcessing ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enrollment Approval Modal */}
        {showEnrollmentApprovalModal && (
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
              if (e.target === e.currentTarget) setShowEnrollmentApprovalModal(false)
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
                Enrollment Actions
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
                Select an action for this member's enrollment:
              </p>
              <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                <button
                  onClick={handleApproveEnrollment}
                  disabled={isProcessing}
                  style={{
                    padding: '12px 16px',
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
                  {isProcessing ? 'Processing...' : '✓ Approve Enrollment'}
                </button>
                <button
                  onClick={handleRejectEnrollment}
                  disabled={isProcessing}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    opacity: isProcessing ? 0.5 : 1
                  }}
                >
                  {isProcessing ? 'Processing...' : '✕ Reject Enrollment'}
                </button>
                <button
                  onClick={() => setShowEnrollmentApprovalModal(false)}
                  style={{
                    padding: '12px 16px',
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
              </div>
            </div>
          </div>
        )}
      </div>
  )
}
