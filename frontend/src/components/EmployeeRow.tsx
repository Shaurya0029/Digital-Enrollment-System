import React, { useState } from 'react'

interface Employee {
  id: number
  userId: number
  name?: string
  email?: string
  user?: { name: string; email: string }
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

interface EmployeeRowProps {
  employee: Employee
  isExpanded: boolean
  onToggleExpand: () => void
  onEdit: (employee: Employee) => void
  onDelete: (employee: Employee) => void
}

export default function EmployeeRow({
  employee,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
}: EmployeeRowProps) {
  const displayName = employee.name || employee.user?.name || `ID ${employee.id}`
  const displayEmail = employee.email || employee.user?.email || ''
  
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const status = 'Active' // Default to Active for now
  const statusColor = status === 'Active' ? '#10b981' : '#6b7280'

  return (
    <>
      <tr className={`border-b border-slate-200 transition-colors hover:bg-slate-50 ${isExpanded ? 'bg-blue-50' : 'bg-white'}`}>
        <td className="px-4 py-3 text-center">
          <button
            onClick={onToggleExpand}
            className="inline-flex items-center justify-center w-6 h-6 rounded text-slate-600 hover:bg-slate-200 transition-colors"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </td>
        <td className="px-4 py-3 flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-blue-700 text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          <span className="text-sm font-medium text-slate-900 truncate">
            {displayName}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-slate-600">
          {employee.id}
        </td>
        <td className="px-4 py-3 text-sm text-slate-600 truncate">
          {displayEmail}
        </td>
        <td className="px-4 py-3 text-sm text-slate-600">
          {employee.phone || '—'}
        </td>
        <td className="px-4 py-3 text-sm text-slate-600">
          —
        </td>
        <td className="px-4 py-3 text-sm text-slate-600">
          —
        </td>
        <td className="px-4 py-3 text-sm text-slate-600">
          —
        </td>
        <td className="px-4 py-3 text-sm text-slate-600">
          —
        </td>
        <td className="px-4 py-3 flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${status === 'Active' ? 'bg-green-500' : 'bg-slate-400'}`} />
          <span className="text-sm font-medium text-slate-600">{status}</span>
        </td>
        <td className="px-4 py-3 flex gap-2">
          <button
            onClick={() => onEdit(employee)}
            className="px-2 py-1 rounded text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(employee)}
            className="px-2 py-1 rounded text-xs font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </td>
      </tr>

      {isExpanded && (
        <tr className="bg-slate-50 border-b border-slate-200">
          <td colSpan={12} className="px-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Full Name
                </label>
                <p className="text-slate-900 font-medium mt-1">
                  {displayName}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Email
                </label>
                <p className="text-slate-900 font-medium mt-1">
                  {displayEmail}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Phone
                </label>
                <p className="text-slate-900 font-medium mt-1">
                  {employee.phone || '—'}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Date of Birth
                </label>
                <p className="text-slate-900 font-medium mt-1">
                  {employee.dob
                    ? new Date(employee.dob).toLocaleDateString()
                    : '—'}
                </p>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                  }}
                >
                  Gender
                </label>
                <p style={{ color: '#1f2937', marginTop: '4px' }}>
                  {employee.gender || '—'}
                </p>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                  }}
                >
                  Marital Status
                </label>
                <p style={{ color: '#1f2937', marginTop: '4px' }}>
                  {employee.maritalStatus || '—'}
                </p>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                  }}
                >
                  Address
                </label>
                <p style={{ color: '#1f2937', marginTop: '4px' }}>
                  {employee.address || '—'}
                </p>
              </div>

              {employee.dependents && employee.dependents.length > 0 && (
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Dependents
                  </label>
                  <div className="mt-2 space-y-2">
                    {employee.dependents.map((dep: any) => (
                      <div
                        key={dep.id}
                        className="p-2 bg-white border border-slate-300 rounded-md text-xs text-slate-800"
                      >
                        <strong>{dep.name}</strong> ({dep.relation}){' '}
                        {dep.dob && (
                          <>
                            -{' '}
                            {Math.floor(
                              (new Date().getTime() -
                                new Date(dep.dob).getTime()) /
                                (365.25 * 24 * 60 * 60 * 1000),
                            )}{' '}
                            yrs
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {employee.policies && employee.policies.length > 0 && (
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Assigned Policies
                  </label>
                  <div className="mt-2 space-y-1.5">
                    {employee.policies.map((pol: any) => (
                      <span
                        key={pol.id}
                        className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                      >
                        {pol.policy?.name || pol.name || 'N/A'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
