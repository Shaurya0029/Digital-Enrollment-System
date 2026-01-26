// Direct test of login API
const API_BASE = 'http://localhost:5000'

async function testEmployeeLogin() {
  console.log('Testing employee login with correct credentials...\n')
  
  const payload = {
    emailOrId: 'employee@example.com',
    password: 'password',
    role: 'EMPLOYEE'
  }
  
  console.log('Payload:', JSON.stringify(payload, null, 2))
  
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    console.log('\nResponse Status:', res.status)
    
    const data = await res.json()
    console.log('Response Data:', JSON.stringify(data, null, 2))
    
    if (res.ok && data.token) {
      console.log('\n✅ LOGIN SUCCESSFUL!')
      console.log('Token:', data.token.substring(0, 40) + '...')
      console.log('Role:', data.role)
    } else {
      console.log('\n❌ LOGIN FAILED:', data.error)
    }
  } catch (err) {
    console.log('\n❌ ERROR:', err.message)
  }
}

testEmployeeLogin()
