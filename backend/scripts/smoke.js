(async ()=>{
  try{
    const base = 'http://localhost:5000'
    const loginRes = await fetch(base + '/auth/login', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ emailOrId: 'hr@example.com', password: 'password123', role: 'HR' })
    })
    const login = await loginRes.json()
    console.log('LOGIN_STATUS', loginRes.status)
    console.log('LOGIN_BODY', login)
    const token = login.token
    if (!token){ console.error('no token; abort'); process.exit(1) }

    const hdr = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }
    // single
    const single = await fetch(base + '/hr/employee', { method: 'POST', headers: hdr, body: JSON.stringify({ name: 'AutoTestJS', email: 'autotestjs@example.com', password: 'password123' }) })
    console.log('SINGLE_STATUS', single.status)
    try { console.log('SINGLE_BODY', await single.json()) } catch(e){ console.log('SINGLE_BODY_RAW', await single.text()) }

    // bulk
    const bulkPayload = [{ name: 'BulkJS1', email: 'bulkjs1@example.com', password: 'changeme' }, { name: 'BulkJS2', email: 'bulkjs2@example.com', password: 'changeme' }]
    const bulk = await fetch(base + '/hr/employee/bulk', { method: 'POST', headers: hdr, body: JSON.stringify(bulkPayload) })
    console.log('BULK_STATUS', bulk.status)
    try { console.log('BULK_BODY', await bulk.json()) } catch(e){ console.log('BULK_BODY_RAW', await bulk.text()) }

  }catch(e){ console.error('SMOKE ERROR', e) }
})()
