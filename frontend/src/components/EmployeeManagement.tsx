import React, { useState } from 'react'
import { Edit2, Trash2, ChevronDown, Shield, Users } from 'lucide-react'

interface Employee {
  id: number
  userId: number
  name: string
  email: string
  phone?: string
  department?: string
  status?: string
  dependents?: any[]
  policies?: any[]
  [key: string]: any
}

interface EmployeeManagementProps {
  employees: Employee[]
  isLoading?: boolean
  userRole?: string
  onEdit: (employee: Employee) => void
  onDelete: (employee: Employee) => void
}

export default function EmployeeManagement({
  employees,
  isLoading = false,
  userRole = '',
  onEdit,
  onDelete,
}: EmployeeManagementProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const getInitials = (name: string): string => {
    if (!name) return '?'
    return name
      .split(' ')
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('')
  }

  const getEnrollmentPercentage = (employee: Employee): number => {
    const policiesCount = employee.policies?.length || 0
    const dependentsCount = employee.dependents?.length || 0
    let percentage = 0
    if (policiesCount > 0) percentage += 50
    if (dependentsCount > 0) percentage += 50
    return percentage
  }

  const toggleExpandRow = (id: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  if (isLoading) {
    return (
      <div className="employee-management-card">
        <div className="employee-management-header">
          <h2 className="employee-management-title">Employee Management</h2>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading employees...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="employee-management-card">
      <div className="employee-management-header">
        <h2 className="employee-management-title">Employee Management</h2>
        <div className="employee-management-meta">
          <span className="employee-count">{employees.length} employees</span>
        </div>
      </div>

      {employees.length === 0 && (
        <div className="empty-state">
          <Users size={48} className="empty-state-icon" />
          <p className="empty-state-text">No employees yet</p>
        </div>
      )}

      {employees.length > 0 && (
        <div className="emp-grid-wrapper">
          {/* Header Row */}
          <div className="emp-grid-header">
            <div className="emp-col-checkbox"></div>
            <div className="emp-col-employee">Employee</div>
            <div className="emp-col-department">Department</div>
            <div className="emp-col-status">Status</div>
            <div className="emp-col-enrollment">Enrollment</div>
            <div className="emp-col-actions">Actions</div>
          </div>

          {/* Data Rows */}
          {employees.map((employee) => (
            <React.Fragment key={employee.id}>
              <div className="emp-grid-row">
                <div className="emp-col-checkbox"></div>

                <div className="emp-col-employee">
                  <div className="emp-avatar">{getInitials(employee.name || 'Unknown')}</div>
                  <div className="emp-name-email">
                    <div className="emp-name">{employee.name || 'Unknown'}</div>
                    <div className="emp-email">{employee.email || 'N/A'}</div>
                  </div>
                </div>

                <div className="emp-col-department">{employee.department || '—'}</div>

                <div className="emp-col-status">
                  <span className={`emp-status-badge ${employee.status?.toLowerCase() === 'inactive' ? 'inactive' : 'active'}`}>
                    {employee.status || 'Active'}
                  </span>
                </div>

                <div className="emp-col-enrollment">
                  {getEnrollmentPercentage(employee) > 0 ? (
                    <div className="emp-enrollment-bar">
                      <div className="emp-enrollment-track">
                        <div className="emp-enrollment-fill" style={{ width: `${getEnrollmentPercentage(employee)}%` }}></div>
                      </div>
                      <span className="emp-enrollment-text">{getEnrollmentPercentage(employee)}%</span>
                    </div>
                  ) : (
                    <span className="emp-not-enrolled">Not enrolled</span>
                  )}
                </div>

                <div className="emp-col-actions">
                  <button className="emp-icon-btn" onClick={() => toggleExpandRow(employee.id)} title={expandedRows.has(employee.id) ? 'Collapse' : 'Expand'}>
                    <ChevronDown size={18} style={{ transform: expandedRows.has(employee.id) ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                  </button>
                  {userRole === 'HR' && (
                    <>
                      <button className="emp-icon-btn" onClick={() => onEdit(employee)} title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button className="emp-icon-btn" onClick={() => onDelete(employee)} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {expandedRows.has(employee.id) && (
                <div className="emp-expanded-row">
                  <div className="emp-expanded-content">
                    <div className="emp-expand-section">
                      <h4 className="emp-expand-title"><Shield size={14} /> Assigned Policies</h4>
                      {employee.policies && employee.policies.length > 0 ? (
                        <div className="emp-expand-list">
                          {employee.policies.map((p, i) => (
                            <div key={i} className="emp-expand-item">
                              <span className="emp-expand-dot"></span>
                              <span>{p.name || 'Policy'}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="emp-expand-empty">No policies assigned</p>
                      )}
                    </div>
                    <div className="emp-expand-section">
                      <h4 className="emp-expand-title"><Users size={14} /> Dependents</h4>
                      {employee.dependents && employee.dependents.length > 0 ? (
                        <div className="emp-expand-list">
                          {employee.dependents.map((d, i) => (
                            <div key={i} className="emp-expand-item">
                              <span className="emp-expand-dot"></span>
                              <span>{d.name || 'Dependent'}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="emp-expand-empty">No dependents</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  )
}
