import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import RequireRole from '../components/RequireRole'
import { Building2, Users, Shield, Clock, FileText, Download, ChevronRight, HelpCircle, Loader } from 'lucide-react'

interface Employee {
  id?: number
  user?: { name: string; email: string }
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  dateOfBirth?: string
  address?: string
  status?: string
  company?: string
  name?: string
}

interface Policy {
  id?: number
  name?: string
  policyNumber?: string
  coverageType?: string
  status?: string
  description?: string
}

interface Dependent {
  id?: number
  name?: string
  relationship?: string
  status?: string
  policyId?: number
  dateOfBirth?: string
}

interface Activity {
  id: number
  type: 'enrollment' | 'update' | 'pending' | 'completed'
  title: string
  description: string
  timestamp: string
}

export default function EmployeeDashboard(){
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [policies, setPolicies] = useState<Policy[]>([])
  const [dependents, setDependents] = useState<Dependent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingRequests, setPendingRequests] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    setLoading(true)
    setError(null)
    try {
      // Load employee profile
      const meRes: any = await api.getMe().catch(() => null)
      if (meRes) {
        setEmployee(meRes.employee || meRes)
      }

      // Load all policies
      const policiesRes: any = await api.getPolicies().catch(() => [])
      if (Array.isArray(policiesRes)) {
        setPolicies(policiesRes)
      } else if (policiesRes?.data && Array.isArray(policiesRes.data)) {
        setPolicies(policiesRes.data)
      }

      // Load employee's dependents
      const employeeId = localStorage.getItem('employeeId')
      if (employeeId) {
        const depsRes: any = await api.getDependents(Number(employeeId)).catch(() => [])
        if (Array.isArray(depsRes)) {
          setDependents(depsRes)
          // Count pending dependents (without policy assignment)
          const pending = depsRes.filter((dep: Dependent) => !dep.policyId || dep.status === 'pending').length
          setPendingRequests(pending)
        } else if (depsRes?.data && Array.isArray(depsRes.data)) {
          setDependents(depsRes.data)
          const pending = depsRes.data.filter((dep: Dependent) => !dep.policyId || dep.status === 'pending').length
          setPendingRequests(pending)
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getActivityFeed = (): Activity[] => {
    const feed: Activity[] = [
      {
        id: 1,
        type: 'completed',
        title: 'Insurance Enrollment Completed',
        description: 'Your insurance enrollment for 2026 has been confirmed',
        timestamp: 'Today at 9:30 AM'
      },
      {
        id: 2,
        type: 'update',
        title: `Dependents Updated`,
        description: `${dependents.length} dependent${dependents.length !== 1 ? 's' : ''} in your coverage`,
        timestamp: 'January 28'
      }
    ]

    // Add pending request notification if there are pending dependents
    if (pendingRequests > 0) {
      feed.push({
        id: 3,
        type: 'pending',
        title: 'Pending Policy Assignments',
        description: `${pendingRequests} dependent${pendingRequests !== 1 ? 's' : ''} awaiting policy assignment`,
        timestamp: 'Today'
      })
    }

    feed.push(
      {
        id: 4,
        type: 'enrollment',
        title: 'Enrollment Period',
        description: 'Annual benefits enrollment is currently active',
        timestamp: 'January 15'
      }
    )

    return feed
  }

  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'completed': return '✓'
      case 'update': return '●'
      case 'pending': return '⏳'
      case 'enrollment': return '▶'
      default: return '●'
    }
  }

  const getActivityColor = (type: string) => {
    switch(type) {
      case 'completed': return '#10b981'
      case 'update': return '#3b82f6'
      case 'pending': return '#f59e0b'
      case 'enrollment': return '#8b5cf6'
      default: return '#6b7280'
    }
  }

  const handleDownloadPolicy = (policy: Policy) => {
    // Create a mock policy document download
    const policyContent = `
POLICY DOCUMENT
===============

Policy Name: ${policy.name || 'Insurance Policy'}
Policy Number: ${policy.policyNumber || 'N/A'}
Coverage Type: ${policy.coverageType || 'Standard'}
Status: ${policy.status || 'Active'}

Description:
${policy.description || 'This is your insurance policy document.'}

Coverage Details:
- Medical Coverage: Included
- Dental Coverage: Included
- Vision Coverage: Included
- Life Insurance: Included

Terms & Conditions:
This policy is effective from January 1, 2026 through December 31, 2026.
All coverages are subject to the terms and conditions outlined in this document.

Generated: ${new Date().toLocaleDateString()}
    `

    const blob = new Blob([policyContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${policy.policyNumber || 'policy'}-${policy.name?.replace(/\s+/g, '-')}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <RequireRole role="EMPLOYEE">
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
              <p style={{ color: '#6b7280', margin: 0 }}>Loading your dashboard...</p>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '8px',
            padding: '16px',
            margin: '24px',
            color: '#991b1b'
          }}>
            <p style={{ fontSize: '14px', margin: 0 }}>⚠️ {error}</p>
          </div>
        )}
      <div style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
        color: '#fff',
        padding: '32px 24px',
        borderBottom: 'none'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '700', margin: '0 0 8px 0' }}>
              Welcome, {employee?.user?.name || employee?.firstName || employee?.name || 'Employee'}
            </h1>
            <p style={{ fontSize: '16px', opacity: 0.9, margin: 0 }}>
              Manage your benefits and insurance coverage
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/employee')}
              style={{
                padding: '10px 16px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'
              }}
            >
              View My Profile
            </button>
            <button
              onClick={() => navigate('/employee/dependents')}
              style={{
                padding: '10px 16px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'
              }}
            >
              Manage Dependents
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {/* Organization Card */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', backgroundColor: '#e0e7ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={20} style={{ color: '#6366f1' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>My Organization</span>
            </div>
            <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
              {employee?.company || 'Your Company'}
            </p>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '8px 0 0 0' }}>Active Member</p>
          </div>

          {/* Total Dependents Card */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', backgroundColor: '#fef3c7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={20} style={{ color: '#f59e0b' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Total Dependents</span>
            </div>
            <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
              {dependents.length}
            </p>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '8px 0 0 0' }}>Family members covered</p>
          </div>

          {/* Active Policies Card */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', backgroundColor: '#d1fae5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={20} style={{ color: '#10b981' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Active Policies</span>
            </div>
            <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
              {policies.filter(p => p.status === 'active' || !p.status).length}
            </p>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '8px 0 0 0' }}>Enrolled plans</p>
          </div>

          {/* Pending Requests Card */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', backgroundColor: '#ede9fe', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={20} style={{ color: '#8b5cf6' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Pending Requests</span>
            </div>
            <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
              {pendingRequests}
            </p>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '8px 0 0 0' }}>Awaiting action</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* My Policies Section */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>My Policies</h2>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '4px 8px', borderRadius: '6px' }}>
                  {policies.length}
                </span>
              </div>

              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {policies.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                    <Shield size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p style={{ fontSize: '14px', fontWeight: '500' }}>No policies available</p>
                  </div>
                ) : (
                  policies.map((policy, idx) => (
                    <div
                      key={policy.id || idx}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '10px',
                        padding: '16px',
                        backgroundColor: '#f9fafb',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#d1d5db'
                        e.currentTarget.style.backgroundColor = '#ffffff'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#e5e7eb'
                        e.currentTarget.style.backgroundColor = '#f9fafb'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: 0 }}>
                            {policy.name || 'Insurance Policy'}
                          </h3>
                          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                            {policy.coverageType || 'Coverage'} • {policy.policyNumber || 'Policy'}
                          </div>
                          <div style={{
                            display: 'inline-block',
                            marginTop: '8px',
                            padding: '4px 8px',
                            backgroundColor: '#d1fae5',
                            color: '#065f46',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            ✓ Active
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadPolicy(policy)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#374151',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = '#e5e7eb'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = '#f3f4f6'
                          }}
                        >
                          <Download size={14} />
                          Download
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Activity Section */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>Recent Activity</h2>
              </div>

              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {getActivityFeed().map((activity, idx) => (
                    <div key={activity.id} style={{ display: 'flex', gap: '16px' }}>
                      {/* Timeline line */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: getActivityColor(activity.type),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '16px'
                          }}
                        >
                          {getActivityIcon(activity.type)}
                        </div>
                        {idx < getActivityFeed().length - 1 && (
                          <div
                            style={{
                              width: '2px',
                              height: '48px',
                              backgroundColor: '#e5e7eb',
                              margin: '8px 0'
                            }}
                          />
                        )}
                      </div>

                      {/* Activity content */}
                      <div style={{ flex: 1, paddingTop: '4px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>
                          {activity.title}
                        </h4>
                        <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 4px 0' }}>
                          {activity.description}
                        </p>
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                          {activity.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Quick Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Quick Actions Card */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                padding: '16px',
                borderBottom: '1px solid #e5e7eb',
                background: 'linear-gradient(90deg, #f8fafc 0%, #ffffff 100%)'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 }}>Quick Actions</h3>
              </div>

              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => navigate('/employee/dependents')}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#6366f1',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#4f46e5'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = '#6366f1'
                  }}
                >
                  <span>Manage Dependents</span>
                  <ChevronRight size={18} />
                </button>

                <button
                  onClick={() => policies.length > 0 && handleDownloadPolicy(policies[0])}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: policies.length > 0 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                    opacity: policies.length > 0 ? 1 : 0.5
                  }}
                  disabled={policies.length === 0}
                  onMouseEnter={e => {
                    if (policies.length > 0) e.currentTarget.style.backgroundColor = '#e5e7eb'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6'
                  }}
                >
                  <Download size={16} />
                  Download Policy
                </button>

                <button
                  onClick={() => navigate('/employee')}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
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
                    e.currentTarget.style.backgroundColor = '#e5e7eb'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6'
                  }}
                >
                  <FileText size={16} />
                  View My Profile
                </button>

                <button
                  onClick={() => {
                    const message = prompt('How can we help you?')
                    if (message) alert('Support request submitted: ' + message)
                  }}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
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
                    e.currentTarget.style.backgroundColor = '#e5e7eb'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6'
                  }}
                >
                  <HelpCircle size={16} />
                  Support
                </button>
              </div>
            </div>

            {/* Quick Stats Card */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: '0 0 12px 0' }}>Your Coverage</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>Status</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#10b981' }}>✓ Active</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>Dependents Covered</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{dependents.length}</span>
                </div>
              </div>
            </div>

            {/* Help Card */}
            <div style={{
              backgroundColor: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
              borderRadius: '12px',
              padding: '16px',
              color: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 8px 0' }}>Need Help?</h3>
              <p style={{ fontSize: '13px', opacity: 0.9, margin: '0 0 12px 0' }}>
                Contact our support team for any questions about your benefits.
              </p>
              <button
                onClick={() => alert('Support contact: benefits@company.com | Phone: 1-800-XXX-XXXX')}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'
                }}
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </RequireRole>
  )
}

