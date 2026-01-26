// Quick test to verify employee login
const API_BASE = 'http://localhost:5000'

async function testEmployeeLogin() {
  try {
    console.log('Testing employee login...')
    
    // Test with test employee credentials
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrId: 'employee@example.com',
        password: 'password',
        role: 'EMPLOYEE'
      })
    })
    
    const data = await res.json()
    console.log('Response Status:', res.status)
    console.log('Response Data:', data)
    
    if (res.ok) {
      console.log('✅ Employee login successful!')
      console.log('Token:', data.token?.substring(0, 20) + '...')
      console.log('Role:', data.role)
    } else {
      console.log('❌ Employee login failed:', data.error)
    }
  } catch (err) {
    console.error('❌ Error:', err)
  }
}

testEmployeeLogin()
