import { useEffect, useState } from 'react'
import api from '../api'

interface EmployeeDetailModalProps {
  isOpen: boolean
  employeeId?: number
  onClose: () => void
  onRefresh?: () => void
}

interface Employee {
  id: number
  user?: { name: string; email: string }
  jobTitle?: string
  department?: string
  employmentType?: string
  status?: string
  phone?: string
  address?: string
  hireDate?: string
}

interface Dependent {
  id: number
  name?: string
  firstName?: string
  lastName?: string
  relation?: string
  relationship?: string
  dob?: string
  employeeId: number
}

interface Policy {
  id: number
  policyNumber: string
  name: string
}

export default function EmployeeDetailModal({ isOpen, employeeId, onClose, onRefresh }: EmployeeDetailModalProps) {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [dependents, setDependents] = useState<Dependent[]>([])
  const [availablePolicies, setAvailablePolicies] = useState<Policy[]>([])
  const [assignedPolicies, setAssignedPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [isActive, setIsActive] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [selectedPolicyId, setSelectedPolicyId] = useState<number | string>('')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ phone: '', address: '', dob: '', maritalStatus: 'single' })
  const [saving, setSaving] = useState(false)

  // Fetch employee details, dependents, and policies when modal opens
  useEffect(() => {
    if (!isOpen || !employeeId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError('')

        // Fetch employee
        const empData = await api.hrGetEmployee(employeeId)
        setEmployee(empData)
        setIsActive((empData?.status || '').toUpperCase() === 'ACTIVE')

        // Fetch dependents
        const depsData = await api.getDependents(employeeId)
        setDependents(Array.isArray(depsData) ? depsData : [])

        // Fetch all policies
        const policiesData = await api.getPolicies()
        setAvailablePolicies(Array.isArray(policiesData) ? policiesData : [])

        // Mock assigned policies — in production, fetch from backend
        setAssignedPolicies([])
        // Initialize edit form
        setEditForm({
          phone: empData?.phone || '',
          address: empData?.address || '',
          dob: empData?.dob ? new Date(empData.dob).toISOString().split('T')[0] : '',
          maritalStatus: empData?.maritalStatus || 'single'
        })
      } catch (err: any) {
        setError(err.message || 'Failed to load employee details')
        console.error('Error loading employee details:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isOpen, employeeId])

  // Toggle employee status
  const handleToggleStatus = async () => {
    if (!employee) return

    try {
      setToggling(true)
      const newStatus = isActive ? 'INACTIVE' : 'ACTIVE'
      await api.updateEmployee(employee.id, { status: newStatus })
      setIsActive(!isActive)
      onRefresh?.()
    } catch (err: any) {
      setError(err.message || 'Failed to update employee status')
    } finally {
      setToggling(false)
    }
  }

  // Handle edit save
  const handleSaveEdit = async () => {
    if (!employee) return
    try {
      setSaving(true)
      setError('')
      await api.hrUpdateEmployee(employee.id, {
        phone: editForm.phone,
        address: editForm.address,
        dob: editForm.dob,
        maritalStatus: editForm.maritalStatus
      })
      setEmployee({ ...employee, ...editForm })
      setIsEditing(false)
      onRefresh?.()
    } catch (err: any) {
      setError(err.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  // Assign policy to employee
  const handleAssignPolicy = async () => {
    if (!employee || !selectedPolicyId) return

    try {
      setAssigning(true)
      await api.assignPolicy(employee.id, Number(selectedPolicyId))

      // Update assigned policies list
      const assigned = availablePolicies.find(p => p.id === Number(selectedPolicyId))
      if (assigned) {
        setAssignedPolicies([...assignedPolicies, assigned])
      }

      setSelectedPolicyId('')
      onRefresh?.()
    } catch (err: any) {
      setError(err.message || 'Failed to assign policy')
    } finally {
      setAssigning(false)
    }
  }

  if (!isOpen) return null

  const fullName = employee?.user?.name || `${employee?.id || 'N/A'}`
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const unassignedPolicies = availablePolicies.filter(p => !assignedPolicies.find(ap => ap.id === p.id))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-linear-to-r from-blue-600 to-blue-800 px-6 py-4 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold">Member Details</h2>
          <button onClick={onClose} className="text-white hover:bg-blue-700 p-1 rounded">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : employee ? (
            <div className="space-y-6">
              {/* Profile Section */}
              <div className="flex items-start gap-4 pb-4 border-b">
                <div className="shrink-0">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-linear-to-br from-blue-400 to-blue-600 text-white text-xl font-bold">
                    {initials}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-900">{fullName}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{employee.user?.email || 'N/A'}</p>
                </div>
              </div>

              {/* Employee Details Grid */}
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Phone</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Address</label>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Street, City, State, ZIP"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Date of Birth</label>
                    <input
                      type="date"
                      value={editForm.dob}
                      onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Marital Status</label>
                    <select
                      value={editForm.maritalStatus}
                      onChange={(e) => setEditForm({ ...editForm, maritalStatus: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Member ID</label>
                    <p className="text-gray-900 font-medium">{employee.id}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Job Title</label>
                    <p className="text-gray-900 font-medium">{employee.jobTitle || '—'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Department</label>
                    <p className="text-gray-900 font-medium">{employee.department || '—'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Employment Type</label>
                    <p className="text-gray-900 font-medium">{employee.employmentType || '—'}</p>
                  </div>
                  {employee.hireDate && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Hire Date</label>
                      <p className="text-gray-900 font-medium">{employee.hireDate}</p>
                    </div>
                  )}
                  {employee.phone && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Phone</label>
                      <p className="text-gray-900 font-medium">{employee.phone}</p>
                    </div>
                  )}
                  {employee.address && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Address</label>
                      <p className="text-gray-900 font-medium">{employee.address}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Dependents Section */}
              {dependents.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Dependents ({dependents.length})</h4>
                  <div className="space-y-2">
                    {dependents.map(dep => (
                      <div key={dep.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{dep.name || dep.firstName + ' ' + dep.lastName}</p>
                          <p className="text-xs text-gray-600">{dep.relation || dep.relationship}</p>
                        </div>
                        {dep.dob && <p className="text-xs text-gray-600">{new Date(dep.dob).toLocaleDateString()}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assigned Policies */}
              {assignedPolicies.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Assigned Policies</h4>
                  <div className="space-y-2">
                    {assignedPolicies.map(policy => (
                      <div key={policy.id} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{policy.name}</p>
                          <p className="text-xs text-gray-600">{policy.policyNumber}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assign Policy Section */}
              {unassignedPolicies.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Assign Policy</h4>
                  <div className="flex gap-2">
                    <select
                      value={selectedPolicyId}
                      onChange={e => setSelectedPolicyId(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      disabled={assigning}
                    >
                      <option value="">Select a policy...</option>
                      {unassignedPolicies.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.policyNumber})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssignPolicy}
                      disabled={!selectedPolicyId || assigning}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-sm"
                    >
                      {assigning ? 'Assigning...' : 'Assign'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No employee data found</div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving || loading}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md font-medium text-sm disabled:bg-gray-400"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <>
              <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md font-medium text-sm">
                Close
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md font-medium text-sm"
              >
                Edit
              </button>
              {employee && (
                <button
                  onClick={handleToggleStatus}
                  disabled={toggling || loading}
                  className={`px-4 py-2 rounded-md font-medium text-sm text-white ${
                    isActive
                      ? 'bg-red-600 hover:bg-red-700 disabled:bg-gray-400'
                      : 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400'
                  }`}
                >
                  {toggling ? 'Updating...' : isActive ? 'Deactivate' : 'Activate'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
