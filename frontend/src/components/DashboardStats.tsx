import React, { useState, useEffect } from 'react'
import api from '../api'
import StatsCard from './StatsCard'

interface StatsData {
  employees: number
  dependents: number
  policies: number
  pendingRequests: number
}

interface DashboardStatsProps {
  onRetry?: () => void
}

export default function DashboardStats({ onRetry }: DashboardStatsProps) {
  const [stats, setStats] = useState<StatsData>({
    employees: 0,
    dependents: 0,
    policies: 0,
    pendingRequests: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchStats = async () => {
    setLoading(true)
    setError('')
    try {
      const [empRes, depRes, polRes] = await Promise.all([
        api.getEmployees().catch(() => ({ error: 'Unable to fetch' })),
        api.getDependents().catch(() => ({ error: 'Unable to fetch' })),
        api.getPolicies().catch(() => ({ error: 'Unable to fetch' }))
      ])

      let empCount = 0
      let depCount = 0
      let polCount = 0

      // Handle employees
      if (!empRes.error) {
        if (Array.isArray(empRes)) {
          empCount = empRes.length
        } else if (empRes.data && Array.isArray(empRes.data)) {
          empCount = empRes.data.length
        } else if (empRes.employees && Array.isArray(empRes.employees)) {
          empCount = empRes.employees.length
        }
      }

      // Handle dependents
      if (!depRes.error) {
        if (Array.isArray(depRes)) {
          depCount = depRes.length
        } else if (depRes.data && Array.isArray(depRes.data)) {
          depCount = depRes.data.length
        }
      }

      // Handle policies
      if (!polRes.error) {
        if (Array.isArray(polRes)) {
          polCount = polRes.length
        } else if (polRes.data && Array.isArray(polRes.data)) {
          polCount = polRes.data.length
        } else if (polRes.policies && Array.isArray(polRes.policies)) {
          polCount = polRes.policies.length
        }
      }

      setStats({
        employees: empCount,
        dependents: depCount,
        policies: polCount,
        pendingRequests: 0 // Placeholder - backend doesn't have this endpoint yet
      })
    } catch (err: any) {
      setError('Failed to load dashboard statistics. Please try again.')
      console.error('Dashboard stats error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const handleRetry = () => {
    fetchStats()
    onRetry?.()
  }

  return (
    <div style={{ padding: '0 24px 24px' }}>
      {error && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fef3c7',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span style={{ fontSize: '14px', color: '#92400e' }}>{error}</span>
          </div>
          <button
            onClick={handleRetry}
            style={{
              background: '#d97706',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#b45309'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#d97706'}
          >
            Retry
          </button>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px'
      }}>
        <StatsCard
          title="Total Employees"
          count={stats.employees}
          subtext="Active in system"
          isLoading={loading}
          variant="primary"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          }
        />

        <StatsCard
          title="Total Dependents"
          count={stats.dependents}
          subtext="Family members registered"
          isLoading={loading}
          variant="success"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path>
              <circle cx="8" cy="10" r="2"></circle>
              <circle cx="16" cy="10" r="2"></circle>
              <path d="M8 14c2 1 4 2 4 2s2-1 4-2"></path>
            </svg>
          }
        />

        <StatsCard
          title="Active Policies"
          count={stats.policies}
          subtext="Coverage plans"
          isLoading={loading}
          variant="warning"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"></path>
              <polyline points="7 7 7 13 17 13 17 7"></polyline>
            </svg>
          }
        />

        <StatsCard
          title="Pending Requests"
          count={stats.pendingRequests}
          subtext="Awaiting approval"
          isLoading={loading}
          variant="default"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          }
        />
      </div>
    </div>
  )
}
