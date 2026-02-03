import { useState, useEffect } from 'react'
import { Download, TrendingUp, Users, BarChart3, Loader, AlertCircle, Calendar, Filter, Shield } from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import * as XLSX from 'xlsx'
import api from '../api'
import RequireRole from '../components/RequireRole'

interface Employee {
  id: number
  user?: { name: string; email: string }
  enrollmentStatus?: string
  createdAt?: string
}

interface Dependent {
  id: number
  name: string
  relation: string
  employeeId: number
  employeeName?: string
  policyId?: number
  createdAt?: string
}

interface Policy {
  id: number
  policyNumber: string
  name: string
  description?: string
  _count?: { employees: number }
}

interface ReportData {
  totalEmployees: number
  totalEnrolled: number
  enrollmentRate: number
  totalDependents: number
  policies: Policy[]
  employees: Employee[]
  dependents: Dependent[]
}

export default function HRReports() {
  const [reportData, setReportData] = useState<ReportData>({
    totalEmployees: 0,
    totalEnrolled: 0,
    enrollmentRate: 0,
    totalDependents: 0,
    policies: [],
    employees: [],
    dependents: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedPolicy, setSelectedPolicy] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'enrollment' | 'coverage' | 'trends'>('enrollment')

  // Load report data from backend
  async function loadReportData() {
    try {
      setLoading(true)
      setError(null)

      const employees: any = await api.hrListEmployees().catch(() => [])
      const policies: any = await api.getPolicies().catch(() => [])
      const dependents: any = await api.getDependents().catch(() => [])

      const filteredEmployees = Array.isArray(employees) ? employees.filter((emp: any) => {
        const empDate = emp.createdAt ? new Date(emp.createdAt) : new Date()
        return empDate >= new Date(startDate) && empDate <= new Date(endDate)
      }) : []

      const filteredDependents = Array.isArray(dependents) ? dependents.filter((dep: any) => {
        const depDate = dep.createdAt ? new Date(dep.createdAt) : new Date()
        return depDate >= new Date(startDate) && depDate <= new Date(endDate)
      }) : []

      const totalEmployees = filteredEmployees.length
      const totalEnrolled = filteredEmployees.filter((emp: any) => emp.enrollmentStatus === 'APPROVED' || emp.enrollmentStatus === 'ACTIVE').length
      const enrollmentRate = totalEmployees > 0 ? Math.round((totalEnrolled / totalEmployees) * 100) : 0
      const totalDependents = filteredDependents.length

      setReportData({
        totalEmployees,
        totalEnrolled,
        enrollmentRate,
        totalDependents,
        policies: Array.isArray(policies) ? policies : [],
        employees: filteredEmployees,
        dependents: filteredDependents
      })
    } catch (err: any) {
      console.error('Error loading report data:', err)
      setError('Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReportData()
  }, [startDate, endDate])

  // Generate monthly trends data
  const generateMonthlyTrends = () => {
    const trends = []
    const currentDate = new Date(startDate)
    const end = new Date(endDate)

    while (currentDate <= end) {
      const monthStr = currentDate.toLocaleString('default', { month: 'short', year: 'numeric' })
      const monthEmployees = reportData.employees.filter((emp: any) => {
        const empDate = emp.createdAt ? new Date(emp.createdAt) : new Date()
        return empDate.getMonth() === currentDate.getMonth() && empDate.getFullYear() === currentDate.getFullYear()
      })
      const enrolled = monthEmployees.filter((emp: any) => emp.enrollmentStatus === 'APPROVED' || emp.enrollmentStatus === 'ACTIVE').length

      trends.push({
        month: monthStr,
        total: monthEmployees.length,
        enrolled,
        rate: monthEmployees.length > 0 ? Math.round((enrolled / monthEmployees.length) * 100) : 0
      })

      currentDate.setMonth(currentDate.getMonth() + 1)
    }

    return trends
  }

  // Generate policy coverage data
  const generatePolicyCoverage = () => {
    return reportData.policies.map((policy: any) => ({
      policyId: policy.id,
      policyName: policy.name,
      policyNumber: policy.policyNumber,
      employeeCount: policy._count?.employees || 0,
      dependentCount: reportData.dependents.filter((dep: any) => dep.policyId === policy.id).length,
      totalMembers: (policy._count?.employees || 0) + reportData.dependents.filter((dep: any) => dep.policyId === policy.id).length
    }))
  }

  // Filter employees based on selected policy
  const getFilteredEmployees = () => {
    if (selectedPolicy === 'all') return reportData.employees
    return reportData.employees.filter((emp: any) => {
      // This would need policy assignment info from backend
      return true
    })
  }

  // Export to Excel (using XLSX library for proper Excel format)
  const exportToExcel = (filename: string, data: any[], sheetName: string) => {
    if (data.length === 0) {
      alert('No data to export')
      return
    }

    try {
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(data)
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`)
    } catch (err) {
      console.error('Excel export error:', err)
      alert('Failed to export to Excel')
    }
  }

  // Export to CSV (using XLSX library)
  const exportToCSV = (filename: string, data: any[]) => {
    if (data.length === 0) {
      alert('No data to export')
      return
    }

    try {
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(data)
      XLSX.utils.book_append_sheet(wb, ws, 'Report')
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
    } catch (err) {
      console.error('CSV export error:', err)
      alert('Failed to export to CSV')
    }
  }

  const handleExportEnrollment = (format: 'csv' | 'excel') => {
    const data = reportData.employees.map(emp => ({
      'Employee Name': emp.user?.name || 'N/A',
      'Email': emp.user?.email || 'N/A',
      'Status': emp.enrollmentStatus || 'PENDING',
      'Enrolled Date': emp.createdAt?.split('T')[0] || 'N/A'
    }))

    if (format === 'csv') {
      exportToCSV(`enrollment_report_${new Date().getTime()}`, data)
    } else {
      exportToExcel(`enrollment_report_${new Date().getTime()}`, data, 'Enrollments')
    }
  }

  const handleExportCoverage = (format: 'csv' | 'excel') => {
    const data = generatePolicyCoverage().map(policy => ({
      'Policy Name': policy.policyName,
      'Policy Number': policy.policyNumber,
      'Employees': policy.employeeCount,
      'Dependents': policy.dependentCount,
      'Total Members': policy.totalMembers
    }))

    if (format === 'csv') {
      exportToCSV(`policy_coverage_${new Date().getTime()}`, data)
    } else {
      exportToExcel(`policy_coverage_${new Date().getTime()}`, data, 'Coverage')
    }
  }

  const handleExportTrends = (format: 'csv' | 'excel') => {
    const data = generateMonthlyTrends().map(trend => ({
      'Month': trend.month,
      'New Enrollments': trend.total,
      'Enrolled': trend.enrolled,
      'Enrollment Rate %': trend.rate
    }))

    if (format === 'csv') {
      exportToCSV(`enrollment_trends_${new Date().getTime()}`, data)
    } else {
      exportToExcel(`enrollment_trends_${new Date().getTime()}`, data, 'Trends')
    }
  }

  if (loading) {
    return (
      <RequireRole role="HR">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-600" />
            <p className="text-slate-600">Loading reports...</p>
          </div>
        </div>
      </RequireRole>
    )
  }

  const monthlyTrends = generateMonthlyTrends()
  const policyCoverage = generatePolicyCoverage()

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
              Reports & Analytics
            </h1>
            <p style={{ fontSize: '16px', opacity: 0.9, margin: 0 }}>
              Analyze enrollment data, policy coverage, and enrollment trends
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

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <Users size={20} style={{ color: '#3b82f6' }} />
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Total Employees</span>
              </div>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>{reportData.totalEmployees}</p>
            </div>

            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <TrendingUp size={20} style={{ color: '#10b981' }} />
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Enrolled</span>
              </div>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>{reportData.totalEnrolled}</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
                {reportData.enrollmentRate}% enrollment rate
              </p>
            </div>

            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <Users size={20} style={{ color: '#8b5cf6' }} />
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Total Dependents</span>
              </div>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>{reportData.totalDependents}</p>
            </div>

            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <BarChart3 size={20} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Active Policies</span>
              </div>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>{reportData.policies.length}</p>
            </div>
          </div>

          {/* Filters */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 16px 0' }}>
              Filters
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>
                  Policy
                </label>
                <select
                  value={selectedPolicy}
                  onChange={e => setSelectedPolicy(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="all">All Policies</option>
                  {reportData.policies.map(policy => (
                    <option key={policy.id} value={String(policy.id)}>
                      {policy.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            marginBottom: '24px',
            overflow: 'hidden'
          }}>
            {/* Tab Navigation */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb'
            }}>
              {(['enrollment', 'coverage', 'trends'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    padding: '16px',
                    backgroundColor: activeTab === tab ? '#fff' : 'transparent',
                    color: activeTab === tab ? '#6366f1' : '#6b7280',
                    border: 'none',
                    borderBottom: activeTab === tab ? '2px solid #6366f1' : 'none',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab === 'enrollment' ? '📋 Enrollment Report' : tab === 'coverage' ? '🛡️ Policy Coverage' : '📈 Enrollment Trends'}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ padding: '24px' }}>
              {activeTab === 'enrollment' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>
                      Employee Enrollment Details
                    </h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleExportEnrollment('csv')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <Download size={16} />
                        CSV
                      </button>
                      <button
                        onClick={() => handleExportEnrollment('excel')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <Download size={16} />
                        Excel
                      </button>
                    </div>
                  </div>

                  {getFilteredEmployees().length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                      <AlertCircle size={48} style={{ margin: '0 auto 16px', color: '#d1d5db' }} />
                      <p>No enrollment data available for the selected period</p>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Employee Name</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Email</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Status</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Enrolled Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredEmployees().map((emp: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                                {emp.user?.name || 'N/A'}
                              </td>
                              <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>
                                {emp.user?.email || 'N/A'}
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '4px 8px',
                                  backgroundColor: emp.enrollmentStatus === 'APPROVED' || emp.enrollmentStatus === 'ACTIVE' ? '#d1fae5' : '#fef3c7',
                                  color: emp.enrollmentStatus === 'APPROVED' || emp.enrollmentStatus === 'ACTIVE' ? '#065f46' : '#92400e',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}>
                                  {emp.enrollmentStatus || 'PENDING'}
                                </span>
                              </td>
                              <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>
                                {emp.createdAt?.split('T')[0] || 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'coverage' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>
                      Policy-wise Coverage Summary
                    </h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleExportCoverage('csv')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <Download size={16} />
                        CSV
                      </button>
                      <button
                        onClick={() => handleExportCoverage('excel')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <Download size={16} />
                        Excel
                      </button>
                    </div>
                  </div>

                  {policyCoverage.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                      <AlertCircle size={48} style={{ margin: '0 auto 16px', color: '#d1d5db' }} />
                      <p>No policy coverage data available</p>
                    </div>
                  ) : (
                    <div>
                      {/* Policy Distribution Pie Chart */}
                      <div style={{ marginBottom: '32px', backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: '0 0 16px 0' }}>
                          Members Distribution by Policy
                        </h4>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={policyCoverage}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={(entry: any) => `${entry.policyName}: ${entry.totalMembers}`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="totalMembers"
                            >
                              {policyCoverage.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 6]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                              formatter={(value) => `${value} members`}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Coverage Table */}
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Policy Name</th>
                              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Policy Number</th>
                              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Employees</th>
                              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Dependents</th>
                              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Total Members</th>
                            </tr>
                          </thead>
                          <tbody>
                            {policyCoverage.map((policy: any, idx: number) => (
                              <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: idx % 2 === 0 ? '#f9fafb' : '#fff' }}>
                                <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                                  {policy.policyName}
                                </td>
                                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>
                                  {policy.policyNumber}
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#3b82f6' }}>
                                  {policy.employeeCount}
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#8b5cf6' }}>
                                  {policy.dependentCount}
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: '700', color: '#111827' }}>
                                  {policy.totalMembers}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'trends' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>
                      Monthly Enrollment Trends
                    </h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleExportTrends('csv')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <Download size={16} />
                        CSV
                      </button>
                      <button
                        onClick={() => handleExportTrends('excel')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <Download size={16} />
                        Excel
                      </button>
                    </div>
                  </div>

                  {monthlyTrends.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                      <AlertCircle size={48} style={{ margin: '0 auto 16px', color: '#d1d5db' }} />
                      <p>No trend data available for the selected period</p>
                    </div>
                  ) : (
                    <div>
                      {/* Trend Chart - Line Chart */}
                      <div style={{ marginBottom: '32px', backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: '0 0 16px 0' }}>
                          Enrollment Rate Trend
                        </h4>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={monthlyTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                              formatter={(value) => [`${value}%`, 'Rate']}
                            />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="rate" 
                              stroke="#6366f1" 
                              strokeWidth={2}
                              dot={{ fill: '#6366f1', r: 5 }}
                              name="Enrollment Rate %"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Trend Chart - Bar Chart */}
                      <div style={{ marginBottom: '32px', backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: '0 0 16px 0' }}>
                          Monthly Enrollments vs Enrolled
                        </h4>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={monthlyTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                            />
                            <Legend />
                            <Bar dataKey="total" fill="#3b82f6" name="New Enrollments" />
                            <Bar dataKey="enrolled" fill="#10b981" name="Enrolled" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Trend Table */}
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Month</th>
                              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>New Enrollments</th>
                              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Enrolled</th>
                              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Enrollment Rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {monthlyTrends.map((trend, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: idx % 2 === 0 ? '#f9fafb' : '#fff' }}>
                                <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                                  {trend.month}
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#3b82f6' }}>
                                  {trend.total}
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#10b981' }}>
                                  {trend.enrolled}
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#f59e0b' }}>
                                  {trend.rate}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RequireRole>
  )
}
