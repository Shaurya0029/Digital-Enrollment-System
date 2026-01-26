import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'

export default function Dependents(){
  const { employeeId: paramId } = useParams()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState<any | null>(null)
  const [dependents, setDependents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ name: '', relation: '', dob: '', gender: '', coverageStart: '' })
  const [employees, setEmployees] = useState<any[]>([])
  const [empsLoading, setEmpsLoading] = useState(false)
  const [depsModalOpen, setDepsModalOpen] = useState(false)
  const [depsModalEmp, setDepsModalEmp] = useState<any|null>(null)
  const [depsModalList, setDepsModalList] = useState<any[]>([])

  const empIdNum = paramId ? Number(paramId) : null

  async function loadEmployee(id?:number|null){
    if (!id) { setEmployee(null); return }
    try{ const res:any = await api.hrGetEmployee(id); setEmployee(res) }catch(e:any){ console.error(e); setEmployee(null) }
  }

  async function loadDependents(id?:number|null){
    setIsLoading(true)
    setError(null)
    try{
      if (!id) { setDependents([]); setError('No employee selected'); setIsLoading(false); return }
      const res:any = await api.getDependents(id)
      if (Array.isArray(res)) setDependents(res)
      else { setDependents([]); setError('Failed to load dependents') }
    }catch(err:any){ console.error('Load dependents failed', err); setDependents([]); setError(err?.message || 'Failed to load dependents') }
    finally{ setIsLoading(false) }
  }

  async function loadEmployees(){
    setEmpsLoading(true)
    try{
      const res:any = await api.hrListEmployees()
      setEmployees(Array.isArray(res)?res:[])
    }catch(err:any){ console.error('Load employees failed', err); setEmployees([]) }
    finally{ setEmpsLoading(false) }
  }

  useEffect(()=>{
    // empIdNum comes from route param; always refresh when it changes
    if (empIdNum) {
      loadEmployee(empIdNum)
      loadDependents(empIdNum)
    } else {
      setEmployee(null)
      setDependents([])
      setError('No employee selected')
      
      // If the current user is an employee (not HR) and no route param, load their own employee record
      ;(async ()=>{
        try{
          const me:any = await api.getMe()
          const userRole = String((me && me.user && me.user.role) || localStorage.getItem('role') || '').toUpperCase()
          if (userRole === 'EMPLOYEE' && me?.employee?.id) {
            // navigate to the employee's dependents route so empIdNum is set and UI updates
            navigate(`/employees/${me.employee.id}/dependents`, { replace: true })
          }
        }catch(err){
          console.error('Failed to load current user for dependents redirect:', err)
        }
      })()
    }
    loadEmployees()
  }, [empIdNum, navigate])

  function handleSelectEmployee(ev: React.ChangeEvent<HTMLSelectElement>){
    const id = Number(ev.target.value) || null
    if (id) navigate(`/employees/${id}/dependents`)
  }

  function openCreate(){ 
    if (!empIdNum) { alert('Please select an employee before adding dependents'); return }
    if ((dependents || []).length >= 4) { alert('Maximum of 4 dependents allowed'); return }
    setEditing(null); setForm({ name:'', relation:'', dob:'', gender:'', coverageStart:'' }); setShowForm(true)
  }

  function openEdit(dep:any){ setEditing(dep); setForm({ name: dep.name||'', relation: dep.relation||'', dob: dep.dob||'', gender: dep.gender||'', coverageStart: dep.coverageStart||'' }); setShowForm(true) }

  function validateForm(){
    if (!empIdNum) return 'No employee selected'
    if (!form.name || !form.relation || !form.dob) return 'Name, relation and DOB are required'
    // max dependents
    if (!editing && dependents.length >= 4) return 'Maximum of 4 dependents allowed'
    // age validation for child relation
    if (form.relation.toLowerCase() === 'child' || form.relation.toLowerCase() === 'son' || form.relation.toLowerCase() === 'daughter'){
      const dob = new Date(form.dob)
      if (isNaN(dob.getTime())) return 'Invalid DOB'
      const age = (Date.now() - dob.getTime()) / (1000*60*60*24*365.25)
      if (age >= 25) return 'Child must be under 25 years old'
    }
    return null
  }

  async function handleSave(e:any){
    e?.preventDefault()
    if (!empIdNum) return alert('No employee selected')
    const v = validateForm()
    if (v) return alert(v)
    try{
      const payload:any = { name: form.name, relation: form.relation, dob: form.dob, gender: form.gender, coverageStart: form.coverageStart, employeeId: empIdNum }
      let res:any
      if (editing && editing.id) res = await api.request(`/dependents/${editing.id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) } as any)
      else res = await api.createDependent(empIdNum, payload)
      if (res && (res.dependent || res.id || res.ok)) { setShowForm(false); await loadDependents(empIdNum); }
      else alert(res.error || 'Save failed')
    }catch(err:any){ alert(err.message || 'Request failed') }
  }

  async function handleDelete(id:number){
    const d = dependents.find(x=>x.id===id)
    if (!d) return
    if (d.policyId) return alert('Cannot delete dependent assigned to an insurance policy')
    if (!confirm('Delete dependent?')) return
    try{
      const res:any = await api.request(`/dependents/${id}`, { method: 'DELETE' } as any)
      // refresh dependents for current employee
      await loadDependents(empIdNum)
    }catch(err:any){ alert(err.message || 'Delete failed') }
  }

  return (
    <div className="main-area">
      <header className="page-header dependents-hero" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <div className="left-banner dependents-banner">
            <div className="sub">Base • Employee</div>
            <h1>Dependents</h1>
          </div>
        </div>

        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:12}}>
          {employee && (
            <div className="card" style={{padding:'10px 14px', minWidth:180, textAlign:'right'}}>
              <div style={{fontWeight:700, fontSize:14}}>{employee.user?.name}</div>
              <div className="muted-small">Employee ID: {employee.externalId || employee.id}</div>
              <div className="muted-small">Policy: {employee.policy?.name || '—'}</div>
              <div className="muted-small">Status: {employee.status || 'Active'}</div>
            </div>
          )}

          <div style={{display:'flex',gap:10}}>
            <button className="btn-primary" onClick={openCreate} disabled={!empIdNum} aria-disabled={!empIdNum}>+ Add Dependent</button>
            <button className="btn-ghost" onClick={()=>navigate('/hr/employees')}>Back to employees</button>
          </div>
        </div>
      </header>

      <div className="content-grid">
        <div className="center-panel">
          <div style={{marginBottom:12, display:'flex',flexDirection:'column',gap:6}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <label style={{marginRight:6,fontWeight:600}}>Select employee</label>
              <select onChange={handleSelectEmployee} value={empIdNum || ''} style={{padding:8,borderRadius:8}}>
                <option value="">-- choose --</option>
                {employees.map((e:any)=> (
                  <option key={e.id} value={e.id}>{e.user?.name || e.id} — {e.user?.email || ''}</option>
                ))}
              </select>
            </div>
            <div style={{fontSize:13,color:'#6b7280'}}>Choose an employee to view and manage their dependents.</div>
            {!empIdNum && error && <div style={{color:'#dc2626',fontSize:13}}>{/* user-friendly placement for error */}{error}</div>}
          </div>
          <div className="card">
            <h3>Dependents for {employee ? employee.user?.name : (empIdNum ? `Employee ${empIdNum}` : 'Selected employee')}</h3>
            <div style={{overflowX:'auto', marginTop:12}}>
              {!empIdNum ? (
                <div style={{padding:32,textAlign:'center',color:'#6b7280'}}>
                  <div style={{fontSize:40}}>👋</div>
                  <div style={{fontWeight:600, marginTop:8}}>No employee selected</div>
                  <div style={{marginTop:6}}>Select an employee above to view and manage their dependents.</div>
                </div>
              ) : (
                <table className="table" style={{minWidth:680}}>
                  <thead>
                    <tr><th>Dependent Name</th><th>Relationship</th><th>DOB</th><th>Gender</th><th>Coverage Start</th><th>Coverage Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {isLoading && (
                      <tr><td colSpan={7} className="muted-small">Loading dependents…</td></tr>
                    )}
                    {!isLoading && error && (
                      <tr><td colSpan={7} className="empty">{error || 'Unable to load dependents'}</td></tr>
                    )}
                    {!isLoading && !error && dependents.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{padding:24}}>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
                            <div style={{display:'flex',alignItems:'center',gap:12}}>
                              <div style={{fontSize:36}}>👶</div>
                              <div>
                                <div style={{fontWeight:600}}>No dependents added yet</div>
                                <div className="muted-small">Add a dependent to enroll them for coverage.</div>
                              </div>
                            </div>
                            <div>
                              <button className="btn-primary" onClick={openCreate} disabled={!empIdNum || dependents.length>=4} title={!empIdNum ? 'Select an employee first' : dependents.length>=4 ? 'Maximum dependents reached' : ''}>Add a dependent</button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    {!isLoading && !error && dependents.map((d:any)=> (
                      <tr key={d.id}>
                        <td>{d.name}</td>
                        <td>{d.relation}</td>
                        <td>{d.dob ? new Date(d.dob).toLocaleDateString() : '—'}</td>
                        <td>{d.gender || '—'}</td>
                        <td>{d.coverageStart || '—'}</td>
                        <td>
                          <span style={{padding:'4px 8px',borderRadius:999,fontSize:12,color:d.policyId ? '#065f46' : '#374151',background:d.policyId ? '#ecfdf5' : '#f3f4f6'}}>
                            {d.policyId ? 'Covered' : 'Not covered'}
                          </span>
                        </td>
                        <td style={{display:'flex',gap:8}}>
                          <button className="btn-ghost" onClick={()=>openEdit(d)} aria-label={`Edit ${d.name}`}>✏️</button>
                          <button className="btn-ghost" onClick={()=>handleDelete(d.id)} aria-label={`Delete ${d.name}`}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="card" style={{marginTop:12}}>
            <h4>Rules</h4>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
              <div>
                <div style={{fontSize:14,fontWeight:600}}>{employee ? (employee.user?.name || `Employee ${empIdNum}`) : 'No employee selected'}</div>
                <div style={{fontSize:12,color:'#6b7280'}}>{employee ? (employee.user?.email || '') : ''}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:12,color:'#6b7280'}}>Dependents</div>
                {
                  (() => {
                    const count = (dependents || []).length
                    const max = 4
                    const pct = Math.min(100, Math.round((count/max)*100))
                    const color = count >= max ? '#fecaca' : (count >= 3 ? '#fef3c7' : '#d1fae5')
                    const textColor = count >= max ? '#991b1b' : (count >= 3 ? '#92400e' : '#065f46')
                    return (
                      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end'}}>
                        <div style={{fontWeight:700,color:textColor}}>{count} / {max}</div>
                        <div style={{width:80,height:8,background:color,borderRadius:999,marginTop:6}} />
                      </div>
                    )
                  })()
                }
              </div>
            </div>

            <ul style={{marginTop:12}}>
              <li style={{marginBottom:6}}>Dependents are linked to this employee</li>
              <li style={{marginBottom:6}}>Max dependents: 4</li>
              <li>Child must be under 25 years old</li>
            </ul>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="modal">
          <div className="modal-inner">
            <h3>{editing ? 'Edit Dependent' : 'Add Dependent'}</h3>
            <form onSubmit={handleSave} style={{display:'grid',gap:8}}>
              <input placeholder="Full name" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
              <select value={form.relation} onChange={e=>setForm({...form, relation: e.target.value})}>
                <option value="">Select relation</option>
                <option>Spouse</option>
                <option>Child</option>
                <option>Son</option>
                <option>Daughter</option>
                <option>Parent</option>
              </select>
              <input type="date" placeholder="DOB" value={form.dob} onChange={e=>setForm({...form, dob: e.target.value})} />
              <select value={form.gender} onChange={e=>setForm({...form, gender: e.target.value})}>
                <option value="">Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <label>Coverage start date</label>
              <input type="date" value={form.coverageStart} onChange={e=>setForm({...form, coverageStart: e.target.value})} />
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                <button type="button" className="btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {depsModalOpen && depsModalEmp && (
        <div style={{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.28)'}}>
          <div className="center-card" style={{width:720,maxWidth:'95%'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h3 style={{margin:0}}>Dependents of {depsModalEmp.user?.name || depsModalEmp.name}</h3>
              <div><button className="btn-ghost" onClick={()=>{ setDepsModalOpen(false); setDepsModalEmp(null); setDepsModalList([]) }}>Close</button></div>
            </div>

            <div style={{marginTop:12}}>
              {depsModalList.length === 0 && <div className="empty">No dependents found for this employee</div>}
              {depsModalList.map((d:any)=> (
                <div key={d.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid #eee'}}>
                  <div>
                    <div style={{fontWeight:600}}>{d.name}</div>
                    <div className="muted-small">{d.relation} • {d.dob || '—'}</div>
                  </div>
                  <div>
                    <button className="btn-ghost" onClick={()=>alert('Manage dependent: '+d.name)}>Manage</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
