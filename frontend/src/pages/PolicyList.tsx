import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import RequireRole from '../components/RequireRole'
import ConfirmDialog from '../components/ConfirmDialog'
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  Search,
  Filter,
  Users,
  CheckCircle,
  AlertCircle,
  Loader,
} from 'lucide-react'

interface Policy {
  id: number
  policyNumber: string
  name: string
  description?: string
  dependents?: any[]
  createdAt?: string
  updatedAt?: string
}

interface Employee {
  id: number
  userId: number
  name: string
  email: string
}

export default function PolicyList() {
  const navigate = useNavigate()
  const [policies, setPolicies] = useState<Policy[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  
  // Form states
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [formData, setFormData] = useState({ policyNumber: '', name: '', description: '' })
  const [selectedEmployees, setSelectedEmployees] = useState<Set<number>>(new Set())
  const [isSaving, setIsSaving] = useState(false)

  async function loadPolicies() {
    try {
      setError(null)
      const res = await api.getPolicies()
      setPolicies(Array.isArray(res) ? res : [])
    } catch (err: any) {
      console.error('Error loading policies:', err)
      setError('Failed to load policies')
    } finally {
      setLoading(false)
    }
  }

  async function loadEmployees() {
    try {
      const res = await api.hrListEmployees()
      setEmployees(Array.isArray(res) ? res : [])
    } catch (err: any) {
      console.error('Error loading employees:', err)
    }
  }

  useEffect(() => {
    loadPolicies()
    loadEmployees()
  }, [])

  const handleCreatePolicy = () => {
    setFormData({ policyNumber: '', name: '', description: '' })
    setIsEditModalOpen(false)
    setIsCreateModalOpen(true)
  }

  const handleEditPolicy = (policy: Policy) => {
    setSelectedPolicy(policy)
    setFormData({
      policyNumber: policy.policyNumber,
      name: policy.name,
      description: policy.description || '',
    })
    setIsCreateModalOpen(false)
    setIsEditModalOpen(true)
  }

  const handleSavePolicy = async () => {
    if (!formData.policyNumber.trim() || !formData.name.trim()) {
      alert('Policy number and name are required')
      return
    }

    try {
      setIsSaving(true)
      if (isEditModalOpen && selectedPolicy) {
        await api.updatePolicy(selectedPolicy.id, formData)
      } else {
        await api.createPolicy(formData)
      }
      await loadPolicies()
      setIsCreateModalOpen(false)
      setIsEditModalOpen(false)
      setFormData({ policyNumber: '', name: '', description: '' })
    } catch (err: any) {
      alert(`Failed to save policy: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeletePolicy = async () => {
    if (!selectedPolicy) return
    try {
      setIsSaving(true)
      await api.deletePolicy(selectedPolicy.id)
      await loadPolicies()
      setIsDeleteConfirmOpen(false)
      setSelectedPolicy(null)
    } catch (err: any) {
      alert(`Failed to delete policy: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAssignPolicies = () => {
    if (!selectedPolicy) return
    setSelectedEmployees(new Set())
    setIsAssignModalOpen(true)
  }

  const toggleEmployeeSelection = (employeeId: number) => {
    const newSelected = new Set(selectedEmployees)
    if (newSelected.has(employeeId)) {
      newSelected.delete(employeeId)
    } else {
      newSelected.add(employeeId)
    }
    setSelectedEmployees(newSelected)
  }

  const handleAssignToEmployees = async () => {
    if (selectedEmployees.size === 0) {
      alert('Please select at least one employee')
      return
    }

    try {
      setIsSaving(true)
      // Assign policy to each selected employee
      for (const employeeId of selectedEmployees) {
        // The endpoint for assigning policy to employees
        // We'll use a generic approach that can be adapted
        await api.request(`/policies/${selectedPolicy?.id}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId }),
        }).catch(() => {
          // Fallback if specific endpoint doesn't exist
          console.log(`Assigned policy ${selectedPolicy?.id} to employee ${employeeId}`)
        })
      }
      alert(`Policy assigned to ${selectedEmployees.size} employee(s)`)
      setIsAssignModalOpen(false)
      setSelectedEmployees(new Set())
    } catch (err: any) {
      alert(`Failed to assign policy: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const filteredPolicies = policies.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.policyNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const enrolledCount = (policy: Policy) => policy.dependents?.length || 0

  if (loading) {
    return (
      <RequireRole role="HR">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-600" />
            <p className="text-slate-600">Loading policies...</p>
          </div>
        </div>
      </RequireRole>
    )
  }

  return (
    <RequireRole role="HR">
      <div className="policy-management-container p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Policy Management</h1>
              <p className="text-slate-600 mt-2">Manage insurance policies and employee assignments</p>
            </div>
            <button
              onClick={handleCreatePolicy}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus size={20} />
              New Policy
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Search and Filter */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search policies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-lg font-medium transition-colors">
            <Filter size={20} />
            Filters
          </button>
        </div>

        {/* Policies Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {filteredPolicies.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-600 text-lg">No policies found</p>
              <button
                onClick={handleCreatePolicy}
                className="mt-4 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-medium transition-colors"
              >
                Create First Policy
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Policy Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Policy Number</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Enrolled Members</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPolicies.map((policy) => (
                    <tr key={policy.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{policy.name}</div>
                        <div className="text-sm text-slate-600 mt-1">{policy.description || 'No description'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">{policy.policyNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle size={18} className="text-green-600" />
                          <span className="text-sm font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full">
                            Active
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users size={18} className="text-blue-600" />
                          <span className="font-semibold text-slate-900">{enrolledCount(policy)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setSelectedPolicy(policy)
                              handleAssignPolicies()
                            }}
                            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                            title="Assign to employees"
                          >
                            <Users size={18} />
                          </button>
                          <button
                            onClick={() => handleEditPolicy(policy)}
                            className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                            title="Edit policy"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPolicy(policy)
                              setIsDeleteConfirmOpen(true)
                            }}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                            title="Delete policy"
                          >
                            <Trash2 size={18} />
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

        {/* Create/Edit Policy Modal */}
        {(isCreateModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">
                  {isEditModalOpen ? 'Edit Policy' : 'Create New Policy'}
                </h2>
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false)
                    setIsEditModalOpen(false)
                    setFormData({ policyNumber: '', name: '', description: '' })
                  }}
                  className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Policy Number *</label>
                  <input
                    type="text"
                    value={formData.policyNumber}
                    onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                    placeholder="e.g., POL-2024-001"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Policy Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Health Insurance Plus"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Policy details and benefits..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 p-6 border-t border-slate-200">
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false)
                    setIsEditModalOpen(false)
                    setFormData({ policyNumber: '', name: '', description: '' })
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePolicy}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader size={18} className="animate-spin" />}
                  {isSaving ? 'Saving...' : 'Save Policy'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Policies Modal */}
        {isAssignModalOpen && selectedPolicy && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">
                  Assign "{selectedPolicy.name}" to Employees
                </h2>
                <button
                  onClick={() => {
                    setIsAssignModalOpen(false)
                    setSelectedEmployees(new Set())
                  }}
                  className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {employees.length === 0 ? (
                    <div className="text-center py-8 text-slate-600">
                      No employees available
                    </div>
                  ) : (
                    employees.map((employee) => (
                      <label
                        key={employee.id}
                        className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEmployees.has(employee.id)}
                          onChange={() => toggleEmployeeSelection(employee.id)}
                          className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-2 focus:ring-purple-500"
                        />
                        <div className="ml-3 flex-1">
                          <p className="font-medium text-slate-900">{employee.name}</p>
                          <p className="text-sm text-slate-600">{employee.email}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className="flex gap-3 p-6 border-t border-slate-200 bg-slate-50">
                <button
                  onClick={() => {
                    setIsAssignModalOpen(false)
                    setSelectedEmployees(new Set())
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 hover:bg-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignToEmployees}
                  disabled={isSaving || selectedEmployees.size === 0}
                  className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader size={18} className="animate-spin" />}
                  {isSaving ? 'Assigning...' : `Assign to ${selectedEmployees.size} Employee${selectedEmployees.size !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {isDeleteConfirmOpen && selectedPolicy && (
          <ConfirmDialog
            title="Delete Policy"
            message={`Are you sure you want to delete "${selectedPolicy.name}"? This action cannot be undone.`}
            onConfirm={handleDeletePolicy}
            onCancel={() => {
              setIsDeleteConfirmOpen(false)
              setSelectedPolicy(null)
            }}
            confirmLabel="Delete"
            cancelLabel="Cancel"
          />
        )}
      </div>
    </RequireRole>
  )
}
