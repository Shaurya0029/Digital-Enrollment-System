import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const [showRegister, setShowRegister] = useState<boolean>(false)

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

  const roleTheme = 'from-purple-600 to-blue-500'
  const primaryBtn = 'from-sky-500 to-blue-600'

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
      if (!res || !res.token) {
        setError(res?.error || 'Invalid credentials')
        return
      }

      const serverRole = normalizeRole(res.role)
      const effectiveRole: Role = serverRole || selectedRole

      if (serverRole && serverRole !== selectedRole) {
        setError(`Role mismatch: account role is ${res.role}, but you selected ${selectedRole}.`)
        return
      }

      localStorage.setItem('token', res.token)
      localStorage.setItem('role', effectiveRole)
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
    <div className="app-login-root" style={{ background: '#f5f7fb' }}>
      <div className="app-login-card">
        <div className="app-login-left">
          <h1 className="mt-4 text-3xl md:text-4xl font-extrabold text-gray-900">Hello, Welcome Back</h1>
          <p className="mt-2 text-sm text-gray-500">Hey, welcome back to the login page of Prisha Policy</p>

          <div className="mt-6 flex gap-3">
            <button type="button" onClick={() => setSelectedRole('HR')} className={`px-4 py-2 rounded-full font-semibold text-sm transition-all duration-150 focus:outline-none ${selectedRole === 'HR' ? `text-white bg-linear-to-r ${roleTheme} shadow-md` : 'bg-gray-50 text-gray-700 border border-gray-200'}`}>Login as HR</button>
            <button type="button" onClick={() => setSelectedRole('EMPLOYEE')} className={`px-4 py-2 rounded-full font-semibold text-sm transition-all duration-150 focus:outline-none ${selectedRole === 'EMPLOYEE' ? `text-white bg-linear-to-r ${roleTheme} shadow-md` : 'bg-gray-50 text-gray-700 border border-gray-200'}`}>Login as Employee</button>
          </div>

          <div className="mt-4 flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-600"><input type="radio" name="role" checked={selectedRole === 'EMPLOYEE'} onChange={() => setSelectedRole('EMPLOYEE')} className="w-4 h-4 accent-sky-500" />Employee</label>
            <label className="flex items-center gap-2 text-sm text-gray-600"><input type="radio" name="role" checked={selectedRole === 'HR'} onChange={() => setSelectedRole('HR')} className="w-4 h-4 accent-purple-600" />HR</label>
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email / Employee ID</label>
              <input name="email" ref={emailRef} required value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" className={`mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:ring-2 focus:ring-opacity-50 ${selectedRole === 'HR' ? 'focus:ring-purple-300' : 'focus:ring-sky-300'}`} placeholder={selectedRole === 'HR' ? 'hr@example.com' : 'employee@example.com'} />
            </div>

            {otpMode && selectedRole === 'HR' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700">One-time code</label>
                <div className="mt-1 relative">
                  {otpSent ? (
                    <>
                      <input value={otpCode} onChange={e => setOtpCode(e.target.value)} placeholder="Enter code" className="block w-full rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:ring-2 focus:ring-purple-300" />
                      <div className="mt-2 flex gap-2">
                        <button type="button" onClick={verifyOtpAndRedirect} disabled={otpLoading || !otpCode} className={`px-4 py-2 rounded ${otpLoading ? 'bg-gray-400' : 'bg-purple-600 text-white'}`}>{otpLoading ? 'Verifying…' : 'Verify'}</button>
                        <button type="button" onClick={() => { setOtpMode(false); setOtpSent(false); setOtpCode('') }} className="px-4 py-2 rounded border">Cancel</button>
                      </div>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <button type="button" onClick={requestOtp} className={`px-4 py-2 rounded ${otpLoading ? 'bg-gray-400' : 'bg-purple-600 text-white'}`}>{otpLoading ? 'Sending…' : 'Request OTP'}</button>
                      <button type="button" onClick={() => setOtpMode(false)} className="px-4 py-2 rounded border">Back</button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="mt-1 relative">
                  <input name="password" ref={passwordRef} required type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" className={`block w-full rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:ring-2 focus:ring-opacity-50 ${selectedRole === 'HR' ? 'focus:ring-purple-300' : 'focus:ring-sky-300'}`} placeholder="Enter your password" />
                  <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-slate-600 px-2 py-1 rounded hover:bg-gray-100">{showPassword ? 'Hide' : 'Show'}</button>
                </div>
              </div>
            )}

            {selectedRole === 'HR' && !otpMode && (
              <div className="mt-2 text-sm text-right"><button type="button" onClick={() => setOtpMode(true)} className="text-purple-600 hover:underline">Use one-time code instead</button></div>
            )}

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center text-sm text-gray-600"><input type="checkbox" className="mr-2 h-4 w-4 accent-sky-500" checked={remember} onChange={e => setRemember(e.target.checked)} />Remember me</label>
              <button type="button" onClick={() => void 0} className="text-sm text-sky-600 hover:underline">Forgot Password?</button>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <div>
              <button disabled={loading} type="submit" className={`w-full inline-flex justify-center items-center gap-2 px-4 py-3 rounded-lg text-white font-semibold shadow-lg transform transition-transform ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'} bg-linear-to-r ${primaryBtn}`}>
                {loading && (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                )}
                <span>{selectedRole === 'HR' ? 'Sign in as HR' : 'Sign in'}</span>
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            {selectedRole === 'HR' ? (
              <>
                Don't have an HR account? <button onClick={() => setShowRegister(s => !s)} className="text-sky-600 hover:underline">Register as HR</button>
              </>
            ) : (
              <>
                Need help? <button onClick={() => void 0} className="text-sky-600 hover:underline">Contact Support</button>
              </>
            )}
          </div>

          {showRegister && selectedRole === 'HR' && (
            <div style={{ marginTop: 16 }} className="card">
              <h3>Register HR Account</h3>
              <form onSubmit={async e => { e.preventDefault(); const res: any = await api.hrRegister({ email, password, name: '' }); if (res && res.ok) { alert('Registered (demo). Please login.'); setShowRegister(false) } else alert(res.error || 'Register failed') }}>
                <input placeholder="HR name" onChange={() => { }} />
                <input placeholder="Company name" onChange={() => { }} />
                <div className="row"><button className="btn-primary" type="submit">Create HR Account</button><button type="button" className="btn-ghost" onClick={() => setShowRegister(false)}>Cancel</button></div>
              </form>
            </div>
          )}
        </div>

        <div className="app-login-right flex items-center justify-center">
          <div className="app-illustration w-full h-full flex items-center justify-center bg-linear-to-br from-purple-600 to-sky-400 rounded-r-2xl">
            <div className="illustration-inner text-center px-8 py-12">
              <div className="illustration-title text-4xl md:text-5xl font-extrabold text-white tracking-wide drop-shadow-lg">Welcome</div>
              <div className="illustration-sub mt-3 text-lg md:text-xl text-white/90">Digital Enrollment System</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
