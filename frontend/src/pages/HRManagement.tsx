import React, { useEffect, useState } from 'react'
import api from '../api'
import PolicyModal from '../components/PolicyModal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmployeeDetailModal from '../components/EmployeeDetailModal'
import BulkUploadModal from '../components/BulkUploadModal'
import EmployeeManagement from '../components/EmployeeManagement'
import SingleEntry from './SingleEntry'
import {
  Plus,
  Upload,
  FileText,
  Settings,
  Edit2,
  Shield,
  Users,
} from 'lucide-react'

interface Policy {
  id: number
  policyNumber: string
  name: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

interface Employee {
  id: number
  userId: number
  name: string
  email: string
  phone?: string
  dob?: string
  gender?: string
  address?: string
  maritalStatus?: string
  externalId?: string
  department?: string
  status?: string
  createdAt?: string
  updatedAt?: string
  dependents?: any[]
  policies?: any[]
}

export default function HRManagement() {
  const [company, setCompany] = useState<any>({ name: 'Prisha Inc.', industry: 'Technology', address: 'N/A', hrContact: 'hr@prisha.com' })
  const [policies, setPolicies] = useState<Policy[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [editingCompany, setEditingCompany] = useState(false)
  
  // UI State
  const [policyModalOpen, setPolicyModalOpen] = useState(false)
  const [policyModalMode, setPolicyModalMode] = useState<'add' | 'edit'>('add')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [policyToDelete, setPolicyToDelete] = useState<Policy | null>(null)
  const [employeeDetailModalOpen, setEmployeeDetailModalOpen] = useState(false)
  const [bulkUploadModalOpen, setBulkUploadModalOpen] = useState(false)
  const [memberEntryModalOpen, setMemberEntryModalOpen] = useState(false)
  const [employeeDeleteConfirmOpen, setEmployeeDeleteConfirmOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null)
  

  
  const [isLoading, setIsLoading] = useState(false)
  const [loadingEmployees, setLoadingEmployees] = useState(true)
  const [loadingPolicies, setLoadingPolicies] = useState(true)
  const [employeesError, setEmployeesError] = useState('')
  const [policiesError, setPoliciesError] = useState('')
  const [policyModalError, setPolicyModalError] = useState('')
  
  // Get user role
  const userRole = localStorage.getItem('role')

  async function loadPolicies() {
    try {
      setLoadingPolicies(true)
      setPoliciesError('')
      console.log('[HRManagement] Loading policies, userRole:', userRole)
      
      const res: any = await api.getPolicies()
      console.log('[HRManagement] Policies loaded:', res)
      let policiesList: any[] = []
      
      if (Array.isArray(res)) {
        policiesList = res
      } else if (res && typeof res === 'object') {
        if (Array.isArray(res.data)) policiesList = res.data
        else if (Array.isArray(res.policies)) policiesList = res.policies
        else if (Array.isArray(res.items)) policiesList = res.items
      }
      
      const mappedPolicies = policiesList.map((p: any) => ({
        ...p,
        name: p.name || `Policy ${p.id}`,
        policyNumber: p.policyNumber || `POL-${p.id}`
      }))
      setPolicies(mappedPolicies)
      console.log('[HRManagement] Policies set:', mappedPolicies.length, 'items')
    } catch (e: any) {
      const errorMsg = e.response?.status === 403 ? 
        'Access denied: You do not have HR permissions' :
        e.response?.status === 401 ?
        'Unauthorized: Please log in again' :
        e.message || 'Failed to load policies'
      console.error('[HRManagement] Error loading policies:', {
        status: e.response?.status,
        statusText: e.response?.statusText,
        message: e.message,
        data: e.response?.data
      })
      setPoliciesError(errorMsg)
      setPolicies([])
    } finally {
      setLoadingPolicies(false)
    }
  }

  async function loadEmployees() {
    try {
      setLoadingEmployees(true)
      setEmployeesError('')
      const token = localStorage.getItem('token')
      const userRole = localStorage.getItem('role')
      
      console.log('[HRManagement] Loading employees...', {
        hasToken: !!token,
        userRole,
        timestamp: new Date().toISOString()
      })
      
      const res: any = await api.hrListEmployees()
      console.log('[HRManagement] ✅ Employees API response:', {
        isArray: Array.isArray(res),
        data: res,
        timestamp: new Date().toISOString()
      })

      let employeesList: any[] = []
      
      if (Array.isArray(res)) {
        // Direct array response
        employeesList = res
      } else if (res && typeof res === 'object') {
        // Extract from nested structure
        if (Array.isArray(res.data)) employeesList = res.data
        else if (Array.isArray(res.employees)) employeesList = res.employees
        else if (Array.isArray(res.items)) employeesList = res.items
      }

      // Transform employee data to ensure name and email are at top level
      const transformedEmployees = employeesList.map((emp: any) => ({
        ...emp,
        // Use user data if available, fallback to employee data
        name: emp.name || emp.user?.name || 'Unknown',
        email: emp.email || emp.user?.email || 'N/A',
      }))

      setEmployees(transformedEmployees)
      console.log('[HRManagement] ✅ Employees loaded and transformed:', {
        count: transformedEmployees.length,
        samples: transformedEmployees.slice(0, 2),
        timestamp: new Date().toISOString()
      })
    } catch (e: any) {
      const errorMsg = e.message?.includes('403') || e.message?.includes('Insufficient')
        ? 'Access denied: You do not have HR permissions'
        : e.message?.includes('401')
        ? 'Unauthorized: Please log in again'
        : e.message || 'Failed to load employees'
      
      console.error('[HRManagement] ❌ Error loading employees:', {
        message: e.message,
        errorString: e.toString(),
        timestamp: new Date().toISOString()
      })
      
      setEmployeesError(errorMsg)
      setEmployees([])
    } finally {
      setLoadingEmployees(false)
    }
  }

  // Policy handlers
  function openAddPolicyModal() {
    setPolicyModalMode('add')
    setPolicyModalError('')
    setPolicyModalOpen(true)
  }

  function openEditPolicyModal(policy: Policy) {
    setPolicyModalMode('edit')
    setSelectedPolicy(policy)
    setPolicyModalError('')
    setPolicyModalOpen(true)
  }

  function closePolicyModal() {
    setPolicyModalOpen(false)
    setSelectedPolicy(null)
    setPolicyModalError('')
  }

  async function handleSavePolicy(data: { id?: number; policyNumber: string; name: string; description?: string }) {
    try {
      setIsLoading(true)
      setPolicyModalError('')

      if (policyModalMode === 'add') {
        const newPolicy = await api.createPolicy({
          policyNumber: data.policyNumber,
          name: data.name,
          description: data.description,
        })
        const mapped = { ...newPolicy, name: newPolicy.name || `Policy ${newPolicy.id}`, policyNumber: newPolicy.policyNumber || `POL-${newPolicy.id}` }
        setPolicies([mapped, ...policies])
      } else if (policyModalMode === 'edit' && data.id) {
        const updatedPolicy = await api.updatePolicy(data.id, {
          policyNumber: data.policyNumber,
          name: data.name,
          description: data.description,
        })
        const mapped = { ...updatedPolicy, name: updatedPolicy.name || `Policy ${updatedPolicy.id}`, policyNumber: updatedPolicy.policyNumber || `POL-${updatedPolicy.id}` }
        setPolicies(policies.map(p => p.id === data.id ? mapped : p))
      }
      closePolicyModal()
    } catch (e: any) {
      setPolicyModalError(e.message || 'Failed to save policy')
    } finally {
      setIsLoading(false)
    }
  }

  function openDeletePolicyConfirm(policy: Policy) {
    setPolicyToDelete(policy)
    setDeleteConfirmOpen(true)
  }

  async function handleDeletePolicy() {
    if (!policyToDelete) return
    try {
      setIsLoading(true)
      await api.deletePolicy(policyToDelete.id)
      setPolicies(policies.filter(p => p.id !== policyToDelete.id))
      if (selectedPolicy?.id === policyToDelete.id) {
        setSelectedPolicy(null)
      }
      setDeleteConfirmOpen(false)
      setPolicyToDelete(null)
    } catch (e: any) {
      console.error('Error deleting policy:', e)
      alert(`Failed to delete policy: ${e.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Employee handlers
  function handleEmployeeEdit(employee: Employee) {
    setSelectedEmployee(employee)
    setEmployeeDetailModalOpen(true)
  }

  function openEmployeeDeleteConfirm(employee: Employee) {
    setEmployeeToDelete(employee)
    setEmployeeDeleteConfirmOpen(true)
  }

  async function handleDeleteEmployee() {
    if (!employeeToDelete) return
    try {
      setIsLoading(true)
      await api.hrDeleteEmployee(employeeToDelete.userId)
      setEmployees(employees.filter(e => e.id !== employeeToDelete.id))
      setEmployeeDeleteConfirmOpen(false)
      setEmployeeToDelete(null)
    } catch (e: any) {
      console.error('Error deleting employee:', e)
      alert(`Failed to delete employee: ${e.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleBulkUpload(employees: any[]) {
    try {
      setIsLoading(true)
      const result = await api.hrBulkCreate(employees)
      // Refresh employee list after successful bulk upload
      await loadEmployees()
      return result
    } catch (e: any) {
      console.error('Error uploading employees:', e)
      throw e
    } finally {
      setIsLoading(false)
    }
  }

  const filteredEmployees = employees.filter(e => e.name || e.email)

  useEffect(() => {
    console.log('[HRManagement] Component mounted')
    console.log('[HRManagement] User role:', userRole)
    const token = localStorage.getItem('token')
    console.log('[HRManagement] Token exists:', !!token)
    
    const c = localStorage.getItem('company')
    if (c) setCompany(JSON.parse(c))
    loadPolicies()
    loadEmployees()
  }, [])

  function saveCompany() {
    localStorage.setItem('company', JSON.stringify(company))
    setEditingCompany(false)
  }

  return (
    <div className="hr-management-container">
      {/* Header - Polished */}
      <div className="hr-management-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="header-title">HR Management</h1>
          </div>
          <div className="header-actions">
            {userRole === 'HR' ? (
              <>
                <button 
                  className="action-btn secondary" 
                  onClick={() => setMemberEntryModalOpen(true)}
                  title="Add a new employee"
                >
                  <Plus size={16} />
                  <span>Add Member</span>
                </button>
                <button 
                  className="action-btn secondary" 
                  onClick={() => setBulkUploadModalOpen(true)}
                  title="Import employees in bulk"
                >
                  <Upload size={16} />
                  <span>Bulk Upload</span>
                </button>
              </>
            ) : (
              <div style={{ padding: '8px 12px', backgroundColor: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '8px', color: '#92400e', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={14} />
                <span>HR access required</span>
              </div>
            )}
            <button 
              className="action-btn secondary" 
              onClick={() => alert('Reports (demo)')}
              title="View analytics and reports"
            >
              <FileText size={16} />
              <span>Reports</span>
            </button>
            {userRole === 'HR' && (
              <button 
                className="action-btn secondary" 
                onClick={() => alert('Settings (demo)')}
                title="Configure settings"
              >
                <Settings size={16} />
                <span>Settings</span>
              </button>
            )}
          </div>
        </div>
      </div>

        {/* Error Messages */}
        {(employeesError || policiesError) && (
          <div style={{ 
            padding: '16px', 
            margin: '16px', 
            backgroundColor: '#fee2e2', 
            border: '1px solid #fecaca', 
            borderRadius: '8px', 
            color: '#991b1b'
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontWeight: '600' }}>⚠️ Error Loading Data</h4>
            {employeesError && <p style={{ margin: '4px 0' }}>Employees: {employeesError}</p>}
            {policiesError && <p style={{ margin: '4px 0' }}>Policies: {policiesError}</p>}
            <button 
              onClick={() => {
                loadEmployees()
                loadPolicies()
              }}
              style={{ 
                marginTop: '8px', 
                padding: '8px 16px', 
                backgroundColor: '#991b1b', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading States */}
        {(loadingEmployees || loadingPolicies) && (
          <div style={{ 
            padding: '16px', 
            margin: '16px', 
            backgroundColor: '#dbeafe', 
            border: '1px solid #93c5fd', 
            borderRadius: '8px', 
            color: '#0c4a6e'
          }}>
            <p style={{ margin: 0 }}>⏳ Loading data{loadingEmployees ? ' (employees)' : ''}{loadingPolicies ? ' (policies)' : ''}...</p>
          </div>
        )}

        {/* Main Layout */}
        <div className="hr-management-layout">
          {/* Left Sidebar */}
          <aside className="hr-sidebar">
            {/* Company Profile Card */}
            <div className="sidebar-card">
              <div className="card-header">
                <h3 className="card-title">Company Profile</h3>
              </div>
              {editingCompany ? (
                <div className="card-edit-form">
                  <div className="form-group">
                    <label>Company Name</label>
                    <input
                      value={company.name}
                      onChange={e => setCompany({ ...company, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Industry</label>
                    <input
                      value={company.industry}
                      onChange={e => setCompany({ ...company, industry: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Address</label>
                    <input
                      value={company.address}
                      onChange={e => setCompany({ ...company, address: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>HR Contact Email</label>
                    <input
                      value={company.hrContact}
                      onChange={e => setCompany({ ...company, hrContact: e.target.value })}
                    />
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-primary" onClick={saveCompany}>Save</button>
                    <button className="btn btn-ghost" onClick={() => setEditingCompany(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="card-content">
                  <div className="info-group">
                    <label>Company Name</label>
                    <p>{company.name}</p>
                  </div>
                  <div className="info-group">
                    <label>Industry</label>
                    <p>{company.industry}</p>
                  </div>
                  <div className="info-group">
                    <label>Employees</label>
                    <p className="text-lg font-bold text-purple-600">{employees.length}</p>
                  </div>
                  <div className="info-group">
                    <label>HR Contact</label>
                    <p className="text-sm">{company.hrContact}</p>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '75%' }}></div>
                  </div>
                  <p className="text-xs text-slate-500">Profile 75% complete</p>
                  {userRole === 'HR' && (
                    <button className="btn btn-ghost w-full mt-4" onClick={() => setEditingCompany(true)}>
                      <Edit2 size={16} />
                      Edit Profile
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Policies Card - Redesigned */}
            <div className="policies-card">
              <div className="policies-header">
                <h3 className="policies-title">Policies</h3>
                <div className="policies-actions">
                  {userRole === 'HR' && (
                    <button 
                      className="policies-add-btn" 
                      onClick={openAddPolicyModal}
                      title="Add new policy"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
              </div>

              {policies.length === 0 ? (
                <div className="policies-empty-state">
                  <Shield className="policies-empty-icon" size={40} />
                  <p className="policies-empty-text">No policies yet</p>
                  {userRole === 'HR' && (
                    <button 
                      className="btn btn-sm btn-primary" 
                      onClick={openAddPolicyModal}
                      style={{ marginTop: '8px' }}
                    >
                      <Plus size={14} />
                      Add Policy
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="policies-list-content">
                    {policies.slice(0, 5).map((policy, idx) => {
                      const policyTypes = ['health', 'life', 'dental', 'vision'];
                      const policyType = policyTypes[idx % policyTypes.length];
                      const enrolledCount = Math.floor(Math.random() * 50) + 10;
                      const isExpiring = policy.id % 3 === 0;
                      const status = isExpiring ? 'expiring' : 'active';

                      return (
                        <div key={policy.id} className="policy-card">
                          {/* Top: Name and Type Badge */}
                          <div className="policy-card-top">
                            <h4 className="policy-card-name">{policy.name}</h4>
                            <span className={`policy-card-type ${policyType}`}>
                              {policyType}
                            </span>
                          </div>

                          {/* Meta: Enrolled Count and Status */}
                          <div className="policy-card-meta">
                            <span className="policy-enrolled">
                              <Users size={14} />
                              {enrolledCount} enrolled
                            </span>
                            <span className={`policy-status-badge ${status}`}>
                              {isExpiring ? 'Expiring' : 'Active'}
                            </span>
                          </div>

                          {/* Actions - Show on Hover */}
                          <div className="policy-card-actions">
                            <button 
                              className="policy-action-link primary" 
                              onClick={() => alert('View members')}
                            >
                              View Members
                            </button>
                            {userRole === 'HR' && (
                              <>
                                <span style={{ color: '#e5e7eb', margin: '0 4px' }}>•</span>
                                <button 
                                  className="policy-action-link secondary" 
                                  onClick={() => openEditPolicyModal(policy)}
                                >
                                  Edit
                                </button>
                                <span style={{ color: '#e5e7eb', margin: '0 4px' }}>•</span>
                                <button 
                                  className="policy-action-link danger" 
                                  onClick={() => openDeletePolicyConfirm(policy)}
                                >
                                  Deactivate
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {policies.length > 5 && (
                    <div className="policies-view-all">
                      <a href="/hr/policies" className="policies-view-all-link">
                        View all policies
                        <span>→</span>
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <main className="hr-main-content">
            {/* Employee Management Component */}
            <EmployeeManagement
              employees={filteredEmployees}
              isLoading={loadingEmployees}
              userRole={userRole || undefined}
              onEdit={handleEmployeeEdit}
              onDelete={openEmployeeDeleteConfirm}
            />
          </main>
        </div>

        {/* Modals */}
        <PolicyModal
          isOpen={policyModalOpen}
          mode={policyModalMode}
          policy={policyModalMode === 'edit' ? selectedPolicy || undefined : undefined}
          onClose={closePolicyModal}
          onSave={handleSavePolicy}
          isLoading={isLoading}
          error={policyModalError}
        />

        {deleteConfirmOpen && policyToDelete && (
          <ConfirmDialog
            title="Delete Policy"
            message={`Are you sure you want to delete "${policyToDelete.name}"? This action cannot be undone.`}
            onConfirm={handleDeletePolicy}
            onCancel={() => {
              setDeleteConfirmOpen(false)
              setPolicyToDelete(null)
            }}
            confirmLabel="Delete"
            cancelLabel="Cancel"
          />
        )}

        {employeeDetailModalOpen && selectedEmployee && (
          <EmployeeDetailModal
            isOpen={employeeDetailModalOpen}
            employeeId={selectedEmployee.id}
            onClose={() => {
              setEmployeeDetailModalOpen(false)
              setSelectedEmployee(null)
            }}
            onRefresh={loadEmployees}
          />
        )}

        {employeeDeleteConfirmOpen && employeeToDelete && (
          <ConfirmDialog
            title="Delete Employee"
            message={`Are you sure you want to delete "${employeeToDelete.name}"? This action cannot be undone.`}
            onConfirm={handleDeleteEmployee}
            onCancel={() => {
              setEmployeeDeleteConfirmOpen(false)
              setEmployeeToDelete(null)
            }}
            confirmLabel="Delete"
            cancelLabel="Cancel"
          />
        )}

        {memberEntryModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Add Employee</h2>
                <button
                  onClick={() => setMemberEntryModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <SingleEntry onSuccess={(res: any) => { setMemberEntryModalOpen(false); loadEmployees(); }} />
              </div>
            </div>
          </div>
        )}

        <BulkUploadModal
          isOpen={bulkUploadModalOpen}
          onClose={() => setBulkUploadModalOpen(false)}
          onUpload={handleBulkUpload}
          isLoading={isLoading}
        />
      </div>
  )
}
