import React from 'react'

interface StatsCardProps {
  title: string
  count: number | string
  subtext?: string
  icon?: React.ReactNode
  isLoading?: boolean
  error?: string
  variant?: 'default' | 'primary' | 'success' | 'warning'
}

export default function StatsCard({
  title,
  count,
  subtext = 'Active in system',
  icon,
  isLoading = false,
  error,
  variant = 'default'
}: StatsCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'linear-gradient(135deg, #0b63ff 0%, #0052cc 100%)'
      case 'success':
        return 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
      case 'warning':
        return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
      default:
        return 'linear-gradient(135deg, #475569 0%, #334155 100%)'
    }
  }

  const getCountGradient = () => {
    switch (variant) {
      case 'primary':
        return 'linear-gradient(90deg, #0b63ff 0%, #0052cc 100%)'
      case 'success':
        return 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
      case 'warning':
        return 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
      default:
        return 'linear-gradient(90deg, #475569 0%, #334155 100%)'
    }
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid #e6e9ef',
      padding: '24px',
      transition: 'all 0.3s ease',
      cursor: 'default'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
    }}
    >
      {/* Loading Skeleton */}
      {isLoading ? (
        <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
          <div style={{height:'20px', background:'#e6e9ef', borderRadius:'6px', animation:'pulse 2s infinite', width:'96px'}}></div>
          <div style={{height:'48px', background:'#e6e9ef', borderRadius:'6px', animation:'pulse 2s infinite', width:'64px'}}></div>
          <div style={{height:'16px', background:'#e6e9ef', borderRadius:'6px', animation:'pulse 2s infinite', width:'128px'}}></div>
        </div>
      ) : error ? (
        // Error State
        <div style={{textAlign:'center', padding:'16px 0'}}>
          <p style={{fontSize:'14px', fontWeight:'500', color:'#0f172a', margin:'0'}}>{title}</p>
          <p style={{fontSize:'12px', color:'#ef4444', marginTop:'8px'}}>{error}</p>
        </div>
      ) : (
        // Content State
        <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between'}}>
          <div style={{flex:1}}>
            <p style={{fontSize:'12px', fontWeight:'500', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 12px 0'}}>{title}</p>
            <div style={{marginBottom:'8px'}}>
              <p style={{
                fontSize:'36px',
                fontWeight:'700',
                background: getCountGradient(),
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: '0'
              }}>
                {count}
              </p>
            </div>
            <p style={{fontSize:'12px', color:'#9ca3af', margin:'0'}}>{subtext}</p>
          </div>
          {icon && (
            <div style={{
              height: '64px',
              width: '64px',
              borderRadius: '8px',
              background: getVariantStyles(),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              opacity: 0.95,
              flexShrink: 0,
              marginLeft: '16px'
            }}>
              {icon}
            </div>
          )}
        </div>
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
