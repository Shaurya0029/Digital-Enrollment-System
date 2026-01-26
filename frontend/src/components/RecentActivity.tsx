import React from 'react'

interface ActivityItem {
  id: string
  action: string
  description: string
  timestamp: string
  icon: string
}

interface RecentActivityProps {
  items?: ActivityItem[]
}

export default function RecentActivity({ items = [] }: RecentActivityProps) {
  const defaultActivities: ActivityItem[] = [
    {
      id: '1',
      action: 'Profile Updated',
      description: 'Your profile information was updated',
      timestamp: 'Today',
      icon: '👤'
    },
    {
      id: '2',
      action: 'Dependent Added',
      description: 'New dependent registered to your account',
      timestamp: 'Yesterday',
      icon: '👨‍👩‍👧'
    },
    {
      id: '3',
      action: 'Policy Document',
      description: 'Policy document downloaded successfully',
      timestamp: '2 days ago',
      icon: '📄'
    }
  ]

  const displayItems = items.length > 0 ? items : defaultActivities

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e6e9ef',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '16px 20px',
        background: 'linear-gradient(90deg, #f6f8fb 0%, #ffffff 100%)',
        borderBottom: '1px solid #e6e9ef'
      }}>
        <h3 style={{
          margin: '0',
          fontSize: '16px',
          fontWeight: '600',
          color: '#0f172a'
        }}>
          Recent Activity
        </h3>
      </div>

      <div style={{ padding: '0' }}>
        {displayItems.map((item, index) => (
          <div
            key={item.id}
            style={{
              padding: '16px 20px',
              borderBottom: index < displayItems.length - 1 ? '1px solid #f3f4f6' : 'none',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f9fafb'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <div style={{
              fontSize: '24px',
              flexShrink: 0
            }}>
              {item.icon}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                margin: '0 0 4px 0',
                fontSize: '14px',
                fontWeight: '500',
                color: '#0f172a'
              }}>
                {item.action}
              </p>
              <p style={{
                margin: '0 0 4px 0',
                fontSize: '13px',
                color: '#6b7280'
              }}>
                {item.description}
              </p>
              <p style={{
                margin: '0',
                fontSize: '12px',
                color: '#9ca3af'
              }}>
                {item.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>

      {displayItems.length === 0 && (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: '#9ca3af'
        }}>
          <p style={{ margin: '0', fontSize: '14px' }}>No recent activity</p>
        </div>
      )}
    </div>
  )
}
