import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import RequireRole from '../components/RequireRole'
import PolicyModal from '../components/PolicyModal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmployeeTable from '../components/EmployeeTable'
import EmployeeDetailModal from '../components/EmployeeDetailModal'
import BulkUploadModal from '../components/BulkUploadModal'
import SingleEntry from './SingleEntry'

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
  createdAt?: string
  updatedAt?: string
  dependents?: any[]
  policies?: any[]
}

export default function HRManagement(){
  const [company, setCompany] = useState<any>({ name: 'Demo Company', address: 'N/A', hrContact: 'hr@example.com' })
  const [policies, setPolicies] = useState<Policy[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [editingCompany, setEditingCompany] = useState(false)
  const [role, setRole] = useState<string>(localStorage.getItem('role') || '')
  
  // Policy modal state
  const [policyModalOpen, setPolicyModalOpen] = useState(false)
  const [policyModalMode, setPolicyModalMode] = useState<'add' | 'edit'>('add')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [policyToDelete, setPolicyToDelete] = useState<Policy | null>(null)
  
  // Employee modal state
  const [employeeDetailModalOpen, setEmployeeDetailModalOpen] = useState(false)
  
  // Bulk upload state
  const [bulkUploadModalOpen, setBulkUploadModalOpen] = useState(false)
  
  // Member entry modal state
  const [memberEntryModalOpen, setMemberEntryModalOpen] = useState(false)
  
  // Employee delete confirmation
  const [employeeDeleteConfirmOpen, setEmployeeDeleteConfirmOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null)
  
  // Search and filter
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('')
  const [employeeFilterDepartment, setEmployeeFilterDepartment] = useState('')
  const [employeeFilterStatus, setEmployeeFilterStatus] = useState('')
  const [currentEmployeePage, setCurrentEmployeePage] = useState(1)
  
  const [isLoading, setIsLoading] = useState(false)
  const [policyModalError, setPolicyModalError] = useState('')
  const navigate = useNavigate()

  async function loadPolicies(){
    try {
      console.log('Fetching policies from API...')
      const res: any = await api.getPolicies()
      console.log('Policies response:', res)
      let policiesList: any[] = []
      
      // Handle different response formats
      if (Array.isArray(res)) {
        policiesList = res
      } else if (res && typeof res === 'object') {
        // Try common wrapper formats
        if (Array.isArray(res.data)) policiesList = res.data
        else if (Array.isArray(res.policies)) policiesList = res.policies
        else if (Array.isArray(res.items)) policiesList = res.items
        else {
          console.warn('Policies response is an object but not an array, treating as empty:', res)
          policiesList = []
        }
      } else {
        console.error('Unexpected policies response type:', res)
        policiesList = []
      }
      
      console.log('Policies loaded successfully:', policiesList.length)
      // Ensure each policy has name and policyNumber
      const mappedPolicies = policiesList.map((p: any) => ({
        ...p,
        name: p.name || `Policy ${p.id}`,
        policyNumber: p.policyNumber || `POL-${p.id}`
      }))
      console.log('Mapped policies:', mappedPolicies)
      setPolicies(mappedPolicies)
    } catch(e: any) {
      console.error('Error loading policies:', e)
      setPolicies([])
    }
  }

  async function loadEmployees(){
    try {
      console.log('Fetching employees from API...')
      const res: any = await api.hrListEmployees()
      console.log('Employees response:', res)
      let employeesList: any[] = []
      
      // Handle different response formats
      if (Array.isArray(res)) {
        employeesList = res
      } else if (res && typeof res === 'object') {
        // Try common wrapper formats
        if (Array.isArray(res.data)) employeesList = res.data
        else if (Array.isArray(res.employees)) employeesList = res.employees
        else if (Array.isArray(res.items)) employeesList = res.items
        else {
          console.warn('Employees response is an object but not an array, treating as empty:', res)
          employeesList = []
        }
      } else {
        console.error('Unexpected employees response type:', res)
        employeesList = []
      }
      
      console.log('Employees loaded successfully:', employeesList.length)
      setEmployees(employeesList)
    } catch(e: any) {
      console.error('Error loading employees:', e)
      setEmployees([])
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
    } catch(e: any) {
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
    } catch(e: any) {
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
      await api.deleteEmployee(employeeToDelete.id)
      setEmployees(employees.filter(e => e.id !== employeeToDelete.id))
      setEmployeeDeleteConfirmOpen(false)
      setEmployeeToDelete(null)
    } catch(e: any) {
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
      if (result && result.successCount > 0) {
        await loadEmployees()
      }
      return result
    } catch(e: any) {
      console.error('Error uploading employees:', e)
      throw e
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(()=>{
    const c = localStorage.getItem('company')
    if (c) setCompany(JSON.parse(c))
    loadPolicies()
    loadEmployees()
    const onAuth = () => setRole(localStorage.getItem('role') || '')
    window.addEventListener('auth-change', onAuth)
    return () => window.removeEventListener('auth-change', onAuth)
  }, [])

  function saveCompany(){ localStorage.setItem('company', JSON.stringify(company)); setEditingCompany(false); }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">Base • HR</div>
              <h1 className="text-3xl font-bold text-slate-900">HR Management</h1>
            </div>
            <div className="flex gap-3 flex-wrap justify-end">
              <button 
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                onClick={()=>{ if (selectedPolicy) navigator.clipboard.writeText(window.location.href + `#/policies/${selectedPolicy.id}`); alert('Link copied (demo)') }}
              >
                Share
              </button>
              <button 
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                onClick={()=>{ alert('Reports (demo)') }}
              >
                Reports
              </button>
              <button 
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                onClick={()=>{ alert('Settings (demo)') }}
              >
                Settings
              </button>
              <button 
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                onClick={()=>{ alert('Help (demo)') }}
              >
                Help
              </button>
              <button 
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all shadow-md"
                onClick={()=>setMemberEntryModalOpen(true)}
              >
                + Add Member
              </button>
              <button 
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all shadow-md"
                onClick={() => setBulkUploadModalOpen(true)}
              >
                Bulk Upload
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
          {/* Company Profile Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Company Profile</h3>
            {editingCompany ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 uppercase mb-2">Company Name</label>
                  <input 
                    value={company.name} 
                    onChange={e=>setCompany({...company,name:e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 uppercase mb-2">Address</label>
                  <input 
                    value={company.address} 
                    onChange={e=>setCompany({...company,address:e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 uppercase mb-2">HR Contact</label>
                  <input 
                    value={company.hrContact} 
                    onChange={e=>setCompany({...company,hrContact:e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    onClick={saveCompany}
                  >
                    Save
                  </button>
                  <button 
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    onClick={()=>setEditingCompany(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-500 uppercase tracking-wide">Name</p>
                  <p className="text-lg font-semibold text-slate-900 mt-1">{company.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 uppercase tracking-wide">Address</p>
                  <p className="text-sm text-slate-700 mt-1">{company.address}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 uppercase tracking-wide">HR Contact</p>
                  <p className="text-sm text-slate-700 mt-1">{company.hrContact}</p>
                </div>
                <div className="pt-2">
                  <button 
                    className="w-full px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    onClick={()=>setEditingCompany(true)}
                  >
                    Edit
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Policies Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Policies</h3>
              <button 
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                onClick={openAddPolicyModal}
                disabled={isLoading}
              >
                + Add
              </button>
            </div>
            <div className="space-y-2">
              {policies.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-slate-500 italic">No policies yet. Create one to get started.</p>
                </div>
              ) : (
                policies.map(p=> (
                  <div 
                    key={p.id} 
                    className={`p-3 rounded-lg border transition-all cursor-pointer hover:bg-slate-50 flex items-center justify-between ${
                      selectedPolicy?.id === p.id 
                        ? 'bg-blue-50 border-blue-300' 
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div 
                      onClick={() => setSelectedPolicy(p)}
                      className="flex-1 cursor-pointer min-w-0"
                    >
                      <p className="font-semibold text-sm text-slate-900 truncate">{p.policyNumber}</p>
                      <p className="text-xs text-slate-600 mt-0.5 truncate">{p.name}</p>
                    </div>
                    <div className="flex gap-1.5 ml-2 shrink-0">
                      <button 
                        className="px-2 py-1 rounded text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50"
                        onClick={() => openEditPolicyModal(p)}
                        disabled={isLoading}
                      >
                        Edit
                      </button>
                      <button 
                        className="px-2 py-1 rounded text-xs font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
                        onClick={() => openDeletePolicyConfirm(p)}
                        disabled={isLoading}
                      >
                        Del
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-3 space-y-6">
          {/* Employees Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="mb-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Employees</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Total: <span className="font-semibold text-slate-900">{employees.length}</span> employee{employees.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Search & Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 uppercase mb-2">Search</label>
                  <input
                    type="text"
                    placeholder="Name, email, or ID..."
                    value={employeeSearchTerm}
                    onChange={(e) => {
                      setEmployeeSearchTerm(e.target.value)
                      setCurrentEmployeePage(1)
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 uppercase mb-2">Department</label>
                  <select
                    value={employeeFilterDepartment}
                    onChange={(e) => {
                      setEmployeeFilterDepartment(e.target.value)
                      setCurrentEmployeePage(1)
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Departments</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Sales">Sales</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 uppercase mb-2">Status</label>
                  <select
                    value={employeeFilterStatus}
                    onChange={(e) => {
                      setEmployeeFilterStatus(e.target.value)
                      setCurrentEmployeePage(1)
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Employee Table */}
            <div className="overflow-x-auto">
              <EmployeeTable 
                employees={employees}
                isLoading={isLoading}
                searchTerm={employeeSearchTerm}
                filterDepartment={employeeFilterDepartment}
                filterStatus={employeeFilterStatus}
                onEdit={handleEmployeeEdit}
                onDelete={openEmployeeDeleteConfirm}
                pageSize={10}
                currentPage={currentEmployeePage}
                onPageChange={setCurrentEmployeePage}
              />
            </div>
          </div>

          {/* Policy Details Section */}
          {selectedPolicy && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-slate-900">{selectedPolicy.name}</h3>
              <p className="text-sm text-slate-600 font-medium mt-1">{selectedPolicy.policyNumber}</p>
              {selectedPolicy.description && (
                <p className="text-slate-700 text-sm mt-4">
                  {selectedPolicy.description}
                </p>
              )}
              <hr className="my-4 border-slate-200" />
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">Coverage</h4>
                  <p className="text-xs text-slate-600 mt-1">(Demo)</p>
                </div>
              </div>

              <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wide mt-6 mb-3">Employees Enrolled</h4>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-sm text-slate-600">No employees enrolled in this policy yet.</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Right Sidebar - Help & Support */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Help & Support</h3>
          <p className="text-sm text-slate-600 mb-4">Find answers, FAQs and contact support for urgent issues.</p>
          <hr className="border-slate-200 mb-4" />
          
          <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wide mb-3">FAQs</h4>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span><strong>Add employees?</strong> Use Add Employee or Bulk Upload.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span><strong>Expand details?</strong> Click the arrow to view full employee information.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span><strong>Search?</strong> Use the search bar to find by name, email, or ID.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span><strong>Manage policies?</strong> Use the Add Policy button on the left.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span><strong>Filter?</strong> Use the department and status dropdowns above the table.</span>
            </li>
          </ul>

          <button 
            className="mt-6 w-full px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            onClick={()=>{ const email = prompt('Describe your issue and provide contact email (demo):'); if (email) alert('Support request submitted (demo)') }}
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>

      {/* Policy Modal */}
      <PolicyModal
        isOpen={policyModalOpen}
        mode={policyModalMode}
        policy={policyModalMode === 'edit' ? selectedPolicy || undefined : undefined}
        onClose={closePolicyModal}
        onSave={handleSavePolicy}
        isLoading={isLoading}
        error={policyModalError}
      />

      {/* Delete Policy Confirmation */}
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

      {/* Employee Detail Modal */}
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

      {/* Delete Employee Confirmation */}
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

      {/* Member Entry Modal */}
      {memberEntryModalOpen && (
        <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
              <SingleEntry onSuccess={(res:any)=>{ setMemberEntryModalOpen(false); loadEmployees(); }} />
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={bulkUploadModalOpen}
        onClose={() => setBulkUploadModalOpen(false)}
        onUpload={handleBulkUpload}
        isLoading={isLoading}
      />
    </div>
  )
}
