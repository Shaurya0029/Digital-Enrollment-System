import React, { useState, useMemo } from 'react'
import EmployeeRow from './EmployeeRow'

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

interface EmployeeTableProps {
  employees: Employee[]
  isLoading?: boolean
  searchTerm?: string
  filterDepartment?: string
  filterStatus?: string
  onEdit: (employee: Employee) => void
  onDelete: (employee: Employee) => void
  pageSize?: number
  currentPage?: number
  onPageChange?: (page: number) => void
}

export default function EmployeeTable({
  employees,
  isLoading = false,
  searchTerm = '',
  filterDepartment = '',
  filterStatus = '',
  onEdit,
  onDelete,
  pageSize = 10,
  currentPage = 1,
  onPageChange,
}: EmployeeTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const toggleExpandRow = (id: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  // Filter and search
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        !searchTerm ||
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.id.toString().includes(searchTerm)

      const matchesDepartment = !filterDepartment || emp.address?.includes(filterDepartment)
      const matchesStatus = !filterStatus || filterStatus === 'Active'

      return matchesSearch && matchesDepartment && matchesStatus
    })
  }, [employees, searchTerm, filterDepartment, filterStatus])

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / pageSize)
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (employees.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500 text-sm italic">
        No employees found. Add one to get started.
      </div>
    )
  }

  if (filteredEmployees.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500 text-sm">
        No employees match your search or filters.
      </div>
    )
  }

  return (
    <div>
      <table className="w-full">
        <thead className="sticky top-0 z-10">
          <tr className="bg-slate-100 border-b-2 border-slate-300">
            <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wider text-slate-700 w-10">—</th>
            <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-slate-700">Name</th>
            <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-slate-700">ID</th>
            <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-slate-700">Email</th>
            <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-slate-700">Phone</th>
            <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-slate-700">Department</th>
            <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-slate-700">Designation</th>
            <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-slate-700">Policy</th>
            <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-slate-700">Joining Date</th>
            <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-slate-700">Status</th>
            <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-slate-700">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {paginatedEmployees.map((employee) => (
            <EmployeeRow
              key={employee.id}
              employee={employee}
              isExpanded={expandedRows.has(employee.id)}
              onToggleExpand={() => toggleExpandRow(employee.id)}
              onEdit={() => onEdit(employee)}
              onDelete={() => onDelete(employee)}
            />
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-4 bg-slate-50 border-t border-slate-200 rounded-b-lg">
          <div className="text-xs text-slate-600 font-medium">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredEmployees.length)} of{' '}
            {filteredEmployees.length} employees
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => onPageChange?.(page)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-w-10 ${
                  page === currentPage
                    ? 'bg-blue-600 text-white border border-blue-600'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
