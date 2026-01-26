import React, { useEffect, useState } from 'react'
import api from '../api'
import RequireRole from '../components/RequireRole'

export default function HRDashboard(){
  function getInitials(name:string|undefined){
    if (!name) return ''
    return name.split(' ').map(n=>n[0]).slice(0,2).join('')
  }
  const [employees, setEmployees] = useState<any[]>([])
  const [policies, setPolicies] = useState<any[]>([])
  const [policyNumber, setPolicyNumber] = useState('')
  const [policyName, setPolicyName] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function load(){
    const res:any = await api.hrListEmployees()
    if (Array.isArray(res)) setEmployees(res)
    else console.error(res)
    const p:any = await api.getPolicies()
    if (Array.isArray(p)) setPolicies(p)
  }

  useEffect(()=>{ load() }, [])

  async function handleCreate(e:any){
    e.preventDefault()
    const payload = { name, email, password }
    const res:any = await api.hrCreateEmployee(payload)
    if (res.employee){ setName(''); setEmail(''); setPassword(''); load() }
    else alert(res.error || 'Create failed')
  }

  async function handleDelete(id:number){
    if (!confirm('Delete employee?')) return
    const res:any = await api.hrDeleteEmployee(id)
    if (res.ok || res.message) load()
    else alert(res.error || 'Delete failed')
  }

  return (
    <RequireRole role="HR">
    <div className="container hr-dashboard">
      <header className="hr-hero">
        <div>
          <h1>HR Dashboard</h1>
          <p className="muted">Overview of company enrollment activity and quick actions.</p>
          <div style={{display:'flex',gap:12,marginTop:12}}>
            <div className="stat">
              <div className="stat-value">{employees.length}</div>
              <div className="muted-small">Total employees</div>
            </div>
            <div className="stat">
              <div className="stat-value">{policies.length}</div>
              <div className="muted-small">Active policies</div>
            </div>
            <div className="stat">
              <div className="stat-value">{policies.reduce((s,p)=> s + ((p.employees && p.employees.length) ? p.employees.length : 0), 0)}</div>
              <div className="muted-small">Enrolments</div>
            </div>
          </div>
        </div>
        <div className="hero-actions">
          <button className="btn-ghost" onClick={()=>window.location.hash='/reports'}>Reports</button>
        </div>
      </header>

      <div className="hr-grid">
        <main className="hr-main full-width">
          <div className="card">
            <div className="card-header">
              <h3>Employees</h3>
              <div className="controls">
                <input className="search" placeholder="Search employees" />
                <button className="btn-ghost">Filters</button>
              </div>
            </div>

            <div className="employee-table">
              <div className="table-head">
                <div className="col name-col">Name</div>
                <div className="col date-col">Date</div>
                <div className="col job-col">Job title</div>
                <div className="col type-col">Employment Type</div>
              </div>
              <div className="card-list">
                {employees.map(emp=> (
                  <div key={emp.id} className="emp-card">
                    <div className="meta">
                      <div className="avatar">{getInitials(emp.user?.name)}</div>
                      <div className="info"><strong>{emp.user?.name || `ID ${emp.id}`}</strong><div className="muted-small">{emp.user?.email}</div></div>
                    </div>
                    <div className="actions"><button className="chev-btn">›</button></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      <section className="create-employee compact">
        <div className="card">
          <h3>Create employee</h3>
          <form onSubmit={handleCreate} className="stack">
            <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
            <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
            <input placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
            <div className="row"><button className="btn-primary" type="submit">Create</button></div>
          </form>
        </div>
      </section>
    </div>
    </RequireRole>
  )
}
