import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import DashboardStats from '../components/DashboardStats'
import RecentActivity from '../components/RecentActivity'

export default function EmployeeDashboard(){
  const [employeeId, setEmployeeId] = useState('')
  const [name, setName] = useState('')
  const [relation, setRelation] = useState('')
  const [profileName, setProfileName] = useState('')
  const [profileEmail, setProfileEmail] = useState('')
  const [employee, setEmployee] = useState<any | null>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalDependents, setModalDependents] = useState<any[]>([])
  const [showDependentsModal, setShowDependentsModal] = useState(false)
  const [dependentsLoading, setDependentsLoading] = useState(false)
  const [dependentsError, setDependentsError] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const navigate = useNavigate()

  useEffect(()=>{
    const id = localStorage.getItem('employeeId')
    if (id) setEmployeeId(id);
    ;(async ()=>{
      try{
        const me:any = await api.getMe();
        if (me) {
          setProfileName(me.employee?.user?.name || me.user?.name || '')
          setProfileEmail(me.employee?.user?.email || me.user?.email || '')
          setEmployee(me.employee || me)
        }
      }catch(_){ }
    })()

    // Fetch all employees list
    ;(async ()=>{
      try{
        const result:any = await api.getEmployees()
        if (Array.isArray(result)) {
          setEmployees(result)
        } else if (result && result.data && Array.isArray(result.data)) {
          setEmployees(result.data)
        } else if (result && result.employees && Array.isArray(result.employees)) {
          setEmployees(result.employees)
        }
      }catch(err){ 
        console.error('Failed to fetch employees:', err)
      }
    })()
  }, [])

  async function openEmployeeModal(emp:any){
    setSelected(emp)
    setShowModal(true)
    // try load dependents for this employee id
    try{
      const deps:any = await api.getDependents(emp.id)
      if (Array.isArray(deps)) setModalDependents(deps)
      else setModalDependents([])
    }catch(err){ setModalDependents([]) }
  }

  async function openDependentsModal(){
    setShowDependentsModal(true)
    setDependentsLoading(true)
    setDependentsError('')
    try{
      const id = employeeId
      if (!id) {
        setDependentsError('Employee ID not found')
        setDependentsLoading(false)
        return
      }
      const deps:any = await api.getDependents(Number(id))
      if (Array.isArray(deps)) {
        setModalDependents(deps)
      } else if (deps && deps.data && Array.isArray(deps.data)) {
        setModalDependents(deps.data)
      } else {
        setModalDependents([])
      }
      setDependentsError('')
    }catch(err:any){ 
      console.error('Failed to load dependents:', err)
      setDependentsError('Failed to load dependents. Please try again.')
      setModalDependents([])
    }finally{
      setDependentsLoading(false)
    }
  }

  async function handleCreate(e:any){
    e.preventDefault()
    if (!employeeId) return alert('Set your employee id')
    const empId = Number(employeeId)
    const payload = { name, relation, employeeId: empId }
    const res:any = await api.createDependent(empId, payload)
    if (res.dependent || res.id) { setName(''); setRelation(''); alert('Dependent created'); await openDependentsModal() }
    else alert(res.error || 'Create failed')
  }

  async function handlePasswordChange(e:any){
    e.preventDefault()
    if (!currentPassword || !newPassword) return alert('Provide current and new password')
    try{
      const res:any = await api.changePassword({ currentPassword, newPassword })
      if (res && (res.ok || res.success)) { alert('Password updated (demo)'); setCurrentPassword(''); setNewPassword('') }
      else alert(res.error || 'Password change failed')
    }catch(err:any){ alert(err.message || 'Request failed') }
  }

  return (
    <div className="main-area">
      <header className="page-header">
        <div className="left-banner">
          <div className="sub">Employee • Dashboard</div>
          <h1>Welcome{profileName ? `, ${profileName}` : ''}</h1>
        </div>
        <div className="actions">
          <button className="btn-ghost" onClick={()=>navigate('/employee')}>View My Profile</button>
          <button className="btn-ghost" onClick={()=>navigate('/employee/dependents')}>Manage Dependents</button>
        </div>
      </header>

      {/* Dashboard Statistics Section */}
      <DashboardStats />

      {/* Main Content Grid */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 340px', gap:'20px', padding:'0 24px 32px', flex: 1}}>
        {/* Left Panel - Recent Activity & Employees */}
        <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
          {/* Recent Activity Section */}
          <RecentActivity />

          {/* All Employees Section */}
          {employees.length > 0 && (
            <div style={{
              background:'white',
              borderRadius:'12px',
              border:'1px solid #e6e9ef',
              boxShadow:'0 2px 8px rgba(0,0,0,0.08)',
              overflow:'hidden'
            }}>
              <div style={{
                padding:'16px 20px',
                background:'linear-gradient(90deg, #f6f8fb 0%, #ffffff 100%)',
                borderBottom:'1px solid #e6e9ef'
              }}>
                <h3 style={{margin:'0', fontSize:'16px', fontWeight:'600', color:'#0f172a'}}>All Employees</h3>
              </div>

              <div style={{
                padding:'12px',
                display:'flex',
                flexDirection:'column',
                gap:'8px',
                maxHeight:'400px',
                overflowY:'auto'
              }}>
                <div style={{padding:'8px 12px'}}>
                  <input placeholder="Search employees..." onChange={e=>{/* TODO: filter */}} style={{
                    width:'100%',
                    padding:'8px 12px',
                    border:'1px solid #e6e9ef',
                    borderRadius:'8px',
                    fontSize:'14px'
                  }} />
                </div>

                {employees.map(emp=> (
                  <div key={emp.id || emp.employeeId} style={{
                    padding:'12px',
                    borderRadius:'10px',
                    background:'linear-gradient(180deg,#ffffff,#fbfcff)',
                    border:'1px solid #eef2f8',
                    cursor:'pointer',
                    transition:'all 0.2s ease'
                  }}
                  onClick={()=>openEmployeeModal(emp)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(11,35,76,0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(11,35,76,0.03)'
                  }}
                  >
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                      <div style={{display:'flex', gap:'12px', flex:1}}>
                        <div style={{
                          width:'40px',
                          height:'40px',
                          borderRadius:'8px',
                          background:'linear-gradient(135deg,#7c3aed,#06b6d4)',
                          color:'white',
                          display:'flex',
                          alignItems:'center',
                          justifyContent:'center',
                          fontSize:'14px',
                          fontWeight:'600',
                          flexShrink:0
                        }}>
                          {(emp.user?.name||emp.name||'--').split(' ').map((s:string)=>s[0]).slice(0,2).join('')}
                        </div>
                        <div style={{minWidth:0}}>
                          <strong style={{fontSize:'14px', color:'#0f172a'}}>{emp.user?.name || emp.name || 'Unnamed'}</strong>
                          <div style={{fontSize:'13px', color:'#6b7280', marginTop:'2px'}}>{emp.user?.email || emp.email || ''}</div>
                          <div style={{fontSize:'12px', color:'#9ca3af', marginTop:'2px'}}>ID: {emp.externalId || emp.employeeId || emp.id}</div>
                        </div>
                      </div>
                      <button className="btn-ghost" onClick={(e) => { e.stopPropagation(); navigate(`/hr/employees/personal/${emp.id}`) }} style={{fontSize:'12px', padding:'4px 8px'}}>View</button>
                    </div>
                  </div>
                ))}
                {employees.length === 0 && <div style={{textAlign:'center', color:'#9ca3af', padding:'20px'}}>No employees found</div>}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Quick Actions & Profile Settings */}
        <aside style={{display:'flex', flexDirection:'column', gap:'20px'}}>
          {/* Quick Actions Card */}
          <div style={{
            background:'white',
            borderRadius:'12px',
            border:'1px solid #e6e9ef',
            boxShadow:'0 2px 8px rgba(0,0,0,0.08)',
            overflow:'hidden'
          }}>
            <div style={{
              padding:'16px 20px',
              background:'linear-gradient(90deg, #f6f8fb 0%, #ffffff 100%)',
              borderBottom:'1px solid #e6e9ef'
            }}>
              <h3 style={{margin:'0', fontSize:'16px', fontWeight:'600', color:'#0f172a'}}>Quick Actions</h3>
            </div>

            <div style={{padding:'16px', display:'flex', flexDirection:'column', gap:'8px'}}>
              <button className="btn-ghost" onClick={()=>navigate('/employee')} style={{textAlign:'left'}}>View My Profile</button>
              <button className="btn-ghost" onClick={openDependentsModal} style={{textAlign:'left'}}>Manage Dependents</button>
              <button className="btn-ghost" onClick={()=>alert('Download started (demo)')} style={{textAlign:'left'}}>Download Policy Document</button>
              <button className="btn-ghost" onClick={()=>{ const text = prompt('Describe issue for support (demo):'); if (text) alert('Support request submitted (demo)') }} style={{textAlign:'left'}}>Raise Support Request</button>
            </div>
          </div>

          {/* Profile Settings Card */}
          <div style={{
            background:'white',
            borderRadius:'12px',
            border:'1px solid #e6e9ef',
            boxShadow:'0 2px 8px rgba(0,0,0,0.08)',
            overflow:'hidden'
          }}>
            <div style={{
              padding:'16px 20px',
              background:'linear-gradient(90deg, #f6f8fb 0%, #ffffff 100%)',
              borderBottom:'1px solid #e6e9ef'
            }}>
              <h3 style={{margin:'0', fontSize:'16px', fontWeight:'600', color:'#0f172a'}}>Profile Settings</h3>
            </div>

            <div style={{padding:'16px', display:'flex', flexDirection:'column', gap:'12px'}}>
              <div>
                <label style={{fontSize:'12px', color:'#6b7280', display:'block', marginBottom:'4px', fontWeight:'500'}}>Name</label>
                <input placeholder="Name" value={profileName} onChange={e=>setProfileName(e.target.value)} style={{
                  width:'100%',
                  padding:'8px 12px',
                  border:'1px solid #e6e9ef',
                  borderRadius:'8px',
                  fontSize:'14px',
                  boxSizing:'border-box'
                }} />
              </div>

              <div>
                <label style={{fontSize:'12px', color:'#6b7280', display:'block', marginBottom:'4px', fontWeight:'500'}}>Email</label>
                <input placeholder="Email" value={profileEmail} onChange={e=>setProfileEmail(e.target.value)} style={{
                  width:'100%',
                  padding:'8px 12px',
                  border:'1px solid #e6e9ef',
                  borderRadius:'8px',
                  fontSize:'14px',
                  boxSizing:'border-box'
                }} />
              </div>

              <button className="btn-ghost" onClick={async ()=>{ const res:any = await api.updateProfile({ name: profileName, email: profileEmail }); if (res && (res.ok || res.employee)) alert('Profile updated (demo)'); else alert(res.error || 'Update failed') }} style={{width:'100%'}}>Save Changes</button>

              <hr style={{border:'none', borderTop:'1px solid #e6e9ef', margin:'8px 0'}} />

              <div>
                <label style={{fontSize:'12px', color:'#6b7280', display:'block', marginBottom:'8px', fontWeight:'600'}}>Change Password</label>
                <form onSubmit={handlePasswordChange} style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                  <input type="password" placeholder="Current password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} style={{
                    width:'100%',
                    padding:'8px 12px',
                    border:'1px solid #e6e9ef',
                    borderRadius:'8px',
                    fontSize:'14px',
                    boxSizing:'border-box'
                  }} />
                  <input type="password" placeholder="New password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} style={{
                    width:'100%',
                    padding:'8px 12px',
                    border:'1px solid #e6e9ef',
                    borderRadius:'8px',
                    fontSize:'14px',
                    boxSizing:'border-box'
                  }} />
                  <button type="submit" style={{width:'100%'}}>Update Password</button>
                </form>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Employee Detail Modal */}
      {showModal && selected && (
        <div style={{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.28)', zIndex: 1000}}>
          <div className="center-card" style={{width:900, maxWidth:'95%', maxHeight:'90%', overflow:'auto', borderRadius:12}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center', marginBottom: '16px'}}>
              <h2 style={{margin:0}}>{selected.user?.name || selected.name}</h2>
              <button className="btn-ghost" onClick={()=>{ setShowModal(false); setSelected(null); setModalDependents([]) }}>Close</button>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'220px 1fr',gap:16}}>
              <div style={{textAlign:'center'}}>
                <div style={{width:160,height:160,borderRadius:12,background:'linear-gradient(135deg,#7c3aed,#06b6d4)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,margin:'0 auto'}}>
                  {(selected.user?.name||selected.name||'--').split(' ').map((s:string)=>s[0]).slice(0,2).join('')}
                </div>
                <div style={{marginTop:12}}>
                  <div className="muted-small">Employee ID</div>
                  <div><strong>{selected.externalId || selected.employeeId || selected.id}</strong></div>
                </div>
              </div>

              <div>
                <h4>Personal Info</h4>
                <div className="row"><div style={{flex:1}}><strong>Name</strong><div className="muted-small">{selected.user?.name || selected.name}</div></div><div style={{flex:1}}><strong>Email</strong><div className="muted-small">{selected.user?.email || selected.email}</div></div></div>
                <div className="row"><div style={{flex:1}}><strong>Gender</strong><div className="muted-small">{selected.gender || '—'}</div></div><div style={{flex:1}}><strong>DOB</strong><div className="muted-small">{selected.dob || '—'}</div></div></div>

                <h4 style={{marginTop:12}}>Employment Details</h4>
                <div className="row"><div style={{flex:1}}><strong>Designation</strong><div className="muted-small">{selected.designation || '—'}</div></div><div style={{flex:1}}><strong>Date of Joining</strong><div className="muted-small">{selected.doj || '—'}</div></div></div>

                <h4 style={{marginTop:12}}>Policy</h4>
                <div className="row"><div style={{flex:1}}><strong>Policy</strong><div className="muted-small">{selected.policy?.name || 'Not enrolled'}</div></div>
                <div style={{flex:1}}><strong>Policy No.</strong><div className="muted-small">{selected.policy?.policyNumber || '—'}</div></div></div>

                <h4 style={{marginTop:12}}>Dependents</h4>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {modalDependents.length === 0 && <div className="empty">No dependents</div>}
                  {modalDependents.map(d=> (
                    <div key={d.id} className="dependent-item">
                      <div style={{flex:1}}>
                        <strong>{d.name}</strong>
                        <div className="muted-small">{d.relation} • {d.dob || ''}</div>
                      </div>
                      <div className="row"><button className="btn-ghost" onClick={()=>alert('Manage dependent (demo)')}>Manage</button></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dependents Modal */}
      {showDependentsModal && (
        <div style={{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.28)', zIndex: 1000}}>
          <div style={{background:'white', borderRadius:'12px', padding:'24px', maxWidth:'600px', width:'90%', maxHeight:'80%', overflowY:'auto', boxShadow:'0 20px 25px rgba(0,0,0,0.15)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center', marginBottom: '20px'}}>
              <h2 style={{margin:'0', fontSize:'20px', fontWeight:'600', color:'#0f172a'}}>My Dependents</h2>
              <button className="btn-ghost" onClick={()=>setShowDependentsModal(false)} style={{padding:'4px 8px'}}>✕</button>
            </div>

            {dependentsLoading && (
              <div style={{textAlign:'center', padding:'40px', color:'#6b7280'}}>
                <div style={{marginBottom:'12px'}}>Loading dependents...</div>
              </div>
            )}

            {!dependentsLoading && dependentsError && (
              <div style={{background:'#fee2e2', border:'1px solid #fecaca', borderRadius:'8px', padding:'12px', marginBottom:'16px', color:'#991b1b', fontSize:'14px'}}>
                {dependentsError}
              </div>
            )}

            {!dependentsLoading && !dependentsError && modalDependents.length === 0 && (
              <div style={{textAlign:'center', padding:'40px', color:'#6b7280'}}>
                <div style={{fontSize:'32px', marginBottom:'12px'}}>👶</div>
                <div style={{fontWeight:'600', marginBottom:'8px'}}>No dependents yet</div>
                <div style={{fontSize:'14px'}}>Add a dependent to enroll them for coverage</div>
              </div>
            )}

            {!dependentsLoading && modalDependents.length > 0 && (
              <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                {modalDependents.map((dep:any) => (
                  <div key={dep.id} style={{border:'1px solid #e5e7eb', borderRadius:'8px', padding:'12px', background:'#f9fafb'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                      <div>
                        <div style={{fontWeight:'600', color:'#0f172a', marginBottom:'4px'}}>{dep.name}</div>
                        <div style={{fontSize:'13px', color:'#6b7280', marginBottom:'2px'}}>Relationship: {dep.relation}</div>
                        <div style={{fontSize:'13px', color:'#6b7280', marginBottom:'2px'}}>DOB: {dep.dob || '—'}</div>
                        {dep.gender && <div style={{fontSize:'13px', color:'#6b7280'}}>Gender: {dep.gender}</div>}
                      </div>
                      <button className="btn-ghost" onClick={()=>alert('Manage dependent feature coming soon')} style={{fontSize:'12px', padding:'4px 8px'}}>Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{marginTop:'20px', display:'flex', gap:'8px', justifyContent:'flex-end'}}>
              <button className="btn-ghost" onClick={()=>setShowDependentsModal(false)}>Close</button>
              <button className="btn-primary" onClick={()=>navigate('/employee/dependents')}>View Full Page</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
