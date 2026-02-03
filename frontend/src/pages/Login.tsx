import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, Shield, Users, FileText, CheckCircle } from 'lucide-react'
import api from '../api'

type Role = 'HR' | 'EMPLOYEE'

interface LoginResponse {
  token?: string
  role?: string
  error?: string
}

function normalizeRole(raw?: string | null): Role | undefined {
  if (!raw) return undefined
  const u = String(raw).toUpperCase()
  if (u.startsWith('HR')) return 'HR'
  if (u.startsWith('EMP')) return 'EMPLOYEE'
  return undefined
}

export default function Login(): JSX.Element {
  const navigate = useNavigate()
  const emailRef = useRef<HTMLInputElement | null>(null)
  const passwordRef = useRef<HTMLInputElement | null>(null)

  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<Role>('EMPLOYEE')
  const [remember, setRemember] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState<boolean>(false)


  // OTP state (HR only)
  const [otpMode, setOtpMode] = useState<boolean>(false)
  const [otpSent, setOtpSent] = useState<boolean>(false)
  const [otpCode, setOtpCode] = useState<string>('')
  const [otpLoading, setOtpLoading] = useState<boolean>(false)

  useEffect(() => {
    try {
      if (emailRef.current?.value && !email) setEmail(emailRef.current.value)
      if (passwordRef.current?.value && !password) setPassword(passwordRef.current.value)
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleLogin(e?: React.FormEvent): Promise<void> {
    if (e) e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const emailVal = (email && email.trim()) || emailRef.current?.value?.trim() || ''
      const passwordVal = password || passwordRef.current?.value || ''
      if (!emailVal || !passwordVal) {
        setError('Email/Employee ID and password are required')
        return
      }

      if (!email) setEmail(emailVal)
      if (!password) setPassword(passwordVal)

      const res = (await api.login(emailVal, passwordVal, selectedRole)) as LoginResponse
      console.log('Login response:', res)
      if (!res || !res.token) {
        const errorMsg = res?.error || 'Invalid credentials'
        console.error('Login error:', errorMsg)
        setError(errorMsg)
        return
      }

      const serverRole = normalizeRole(res.role)
      const effectiveRole: Role = serverRole || selectedRole

      localStorage.setItem('token', res.token)
      localStorage.setItem('role', String(effectiveRole))
      if (remember) localStorage.setItem('remember', '1')

      try {
        const me = (await api.getMe()) as { employee?: { id?: number } } | unknown
        if (typeof me === 'object' && me !== null && 'employee' in (me as any)) {
          const maybe = me as { employee?: { id?: number } }
          if (maybe.employee?.id) localStorage.setItem('employeeId', String(maybe.employee.id))
        }
      } catch {
        // non-fatal
      }

      window.dispatchEvent(new Event('auth-change'))

      if (effectiveRole === 'HR') navigate('/hr/dashboard', { replace: true })
      else navigate('/employee/dashboard', { replace: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function requestOtp(): Promise<void> {
    setError(null)
    if (selectedRole !== 'HR') { setError('OTP is available only for HR'); return }
    const emailVal = (email && email.trim()) || emailRef.current?.value?.trim() || ''
    if (!emailVal) { setError('Enter email first'); return }

    setOtpLoading(true)
    try {
      const r = (await api.requestOtp(emailVal, 'HR')) as { ok?: boolean; error?: string } | undefined
      if (r?.ok) setOtpSent(true)
      else setError(r?.error || 'Failed to send OTP')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message || 'OTP request failed')
    } finally {
      setOtpLoading(false)
    }
  }

  async function verifyOtpAndRedirect(): Promise<void> {
    setError(null)
    if (selectedRole !== 'HR') { setError('OTP is available only for HR'); return }
    const emailVal = (email && email.trim()) || emailRef.current?.value?.trim() || ''
    if (!emailVal || !otpCode) { setError('Email and OTP are required'); return }

    setOtpLoading(true)
    try {
      const resp = (await api.verifyOtp(emailVal, otpCode, 'HR')) as LoginResponse
      if (!resp || !resp.token) { setError(resp?.error || 'OTP verify failed'); return }

      const serverRole = normalizeRole(resp.role)
      if (serverRole && serverRole !== 'HR') { setError(`Role mismatch: account role is ${resp.role}`); return }

      localStorage.setItem('token', resp.token)
      localStorage.setItem('role', (serverRole || 'HR'))
      window.dispatchEvent(new Event('auth-change'))
      navigate('/hr/dashboard', { replace: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message || 'OTP verify failed')
    } finally {
      setOtpLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {/* Main Card Container */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        maxWidth: '1000px',
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        minHeight: '600px'
      }}>
        {/* Left Column - Login Form */}
        <div style={{
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflowY: 'auto'
        }}>
          {/* Header */}
          <div>
            {/* Logo and App Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: '700',
                fontSize: '20px'
              }}>
                P
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>Prisha Policy</div>
                <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Digital Enrollment</div>
              </div>
            </div>

            {/* Heading */}
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#111827',
              margin: '0 0 8px 0'
            }}>
              Welcome Back
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: '0 0 32px 0'
            }}>
              Sign in to access your dashboard
            </p>

            {/* Role Selector Tabs */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '32px',
              backgroundColor: '#f3f4f6',
              padding: '6px',
              borderRadius: '10px'
            }}>
              <button
                onClick={() => setSelectedRole('HR')}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  backgroundColor: selectedRole === 'HR' ? '#fff' : 'transparent',
                  color: selectedRole === 'HR' ? '#6366f1' : '#6b7280',
                  boxShadow: selectedRole === 'HR' ? '0 2px 8px rgba(99, 102, 241, 0.2)' : 'none'
                }}
              >
                <Shield size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                HR
              </button>
              <button
                onClick={() => setSelectedRole('EMPLOYEE')}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  backgroundColor: selectedRole === 'EMPLOYEE' ? '#fff' : 'transparent',
                  color: selectedRole === 'EMPLOYEE' ? '#3b82f6' : '#6b7280',
                  boxShadow: selectedRole === 'EMPLOYEE' ? '0 2px 8px rgba(59, 130, 246, 0.2)' : 'none'
                }}
              >
                <Users size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                Employee
              </button>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Email Input */}
              <div>
                <label style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                  display: 'block',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Email / Employee ID
                </label>
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Mail size={18} style={{
                    position: 'absolute',
                    left: '12px',
                    color: '#9ca3af',
                    pointerEvents: 'none'
                  }} />
                  <input
                    ref={emailRef}
                    type="text"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={selectedRole === 'HR' ? 'hr@example.com' : 'employee@example.com'}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 44px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '14px',
                      transition: 'all 0.3s',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = selectedRole === 'HR' ? '#6366f1' : '#3b82f6'
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${selectedRole === 'HR' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(59, 130, 246, 0.1)'}`
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = '#e5e7eb'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                  display: 'block',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Password
                </label>
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Lock size={18} style={{
                    position: 'absolute',
                    left: '12px',
                    color: '#9ca3af',
                    pointerEvents: 'none'
                  }} />
                  <input
                    ref={passwordRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 44px 12px 44px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '14px',
                      transition: 'all 0.3s',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = selectedRole === 'HR' ? '#6366f1' : '#3b82f6'
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${selectedRole === 'HR' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(59, 130, 246, 0.1)'}`
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = '#e5e7eb'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6b7280',
                      padding: '4px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#374151'}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot Password */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '13px'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      accentColor: selectedRole === 'HR' ? '#6366f1' : '#3b82f6'
                    }}
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => alert('Password reset feature coming soon')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: selectedRole === 'HR' ? '#6366f1' : '#3b82f6',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.8'}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
                >
                  Forgot password?
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div style={{
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  {error}
                </div>
              )}

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px 16px',
                  background: selectedRole === 'HR' 
                    ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                    : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '8px'
                }}
                onMouseEnter={e => {
                  if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
                }}
              >
                {loading && (
                  <div style={{
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid #fff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                )}
                <span>
                  {loading ? 'Signing in...' : `Sign in as ${selectedRole === 'HR' ? 'HR' : 'Employee'}`}
                </span>
              </button>
            </form>

            {/* Support Link */}
            <div style={{
              textAlign: 'center',
              marginTop: '16px',
              fontSize: '13px',
              color: '#6b7280'
            }}>
              Need help?{' '}
              <button
                onClick={() => alert('Contact support: support@prishaPolicy.com | Phone: 1-800-XXX-XXXX')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: selectedRole === 'HR' ? '#6366f1' : '#3b82f6',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.8'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Branding */}
        <div style={{
          background: 'linear-gradient(135deg, #9333ea 0%, #6366f1 50%, #3b82f6 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 40px',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background Decoration */}
          <div style={{
            position: 'absolute',
            width: '300px',
            height: '300px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            top: '-100px',
            right: '-100px'
          }} />
          <div style={{
            position: 'absolute',
            width: '200px',
            height: '200px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '50%',
            bottom: '-50px',
            left: '-50px'
          }} />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              margin: '0 0 32px 0',
              lineHeight: 1.3
            }}>
              Welcome to Digital Enrollment System
            </h2>

            {/* Features List */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              marginBottom: '40px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Lock size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>Secure Insurance Enrollment</div>
                  <div style={{ fontSize: '13px', opacity: 0.9 }}>Fast, secure enrollment with end-to-end encryption</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Users size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>Manage Employees & Dependents</div>
                  <div style={{ fontSize: '13px', opacity: 0.9 }}>Easy management of your entire family coverage</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <FileText size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>Download Policy Documents</div>
                  <div style={{ fontSize: '13px', opacity: 0.9 }}>Access and download your policy documents anytime</div>
                </div>
              </div>
            </div>

            {/* Security Note */}
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '10px',
              padding: '16px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              fontWeight: '500'
            }}>
              <CheckCircle size={18} />
              <span>Your data is protected and encrypted</span>
            </div>
          </div>

          {/* Style for spinning loader */}
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>

      {/* Mobile Responsive */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="max-width: 1000px"] {
            min-height: auto !important;
          }
        }
      `}</style>
    </div>
  )
}