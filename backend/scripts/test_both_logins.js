// Test both HR and Employee login
const API_BASE = 'http://localhost:5000'

async function testLogin(email, password, role) {
  console.log(`\n🔐 Testing ${role} login...`)
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrId: email, password, role })
    })
    
    const data = await res.json()
    
    if (res.ok && data.token) {
      console.log(`✅ ${role} login SUCCESS`)
      console.log(`   Token: ${data.token.substring(0, 30)}...`)
      console.log(`   Role: ${data.role}`)
      return true
    } else {
      console.log(`❌ ${role} login FAILED: ${data.error}`)
      return false
    }
  } catch (err) {
    console.log(`❌ ${role} login ERROR: ${err.message}`)
    return false
  }
}

async function runTests() {
  console.log('=== LOGIN TESTS ===')
  await testLogin('hr@example.com', 'password123', 'HR')
  await testLogin('employee@example.com', 'password', 'EMPLOYEE')
  console.log('\n=== DONE ===')
}

// Wait a bit and run
setTimeout(runTests, 2000)
