import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
// Sidebar is provided by the global `Layout` wrapper; remove local import to avoid duplicate sidebars
import api from '../api'
import ConfirmDialog from '../components/ConfirmDialog'
import SingleEntry from './SingleEntry'
import EmployeePersonal from './EmployeePersonal'
import RequireRole from '../components/RequireRole'
import EmployeeDetailModal from '../components/EmployeeDetailModal'

export default function EmployeesPage(){
  function getInitials(name:string|undefined){
    if (!name) return ''
    return name.split(' ').map(n=>n[0]).slice(0,2).join('')
  }
  const [employees, setEmployees] = useState<any[]>([])
  
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selected, setSelected] = useState<any | null>(null)
  const [showAddDependent, setShowAddDependent] = useState(false)
  const [showSingleModal, setShowSingleModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<number|null>(null)
  const [depName, setDepName] = useState('')
  const [depRelation, setDepRelation] = useState('')
  const [editingDependentId, setEditingDependentId] = useState<number|null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailEmployeeId, setDetailEmployeeId] = useState<number|null>(null)
  const navigate = useNavigate()
  const [role, setRole] = useState<string>(localStorage.getItem('role') || '')

  async function load(){
    try{
      if (String(role || '').toUpperCase() === 'EMPLOYEE'){
        const me:any = await api.getMe()
        if (me && me.employee) setEmployees([me.employee])
        else setEmployees([])
      } else {
        const res:any = await api.hrListEmployees()
        if (Array.isArray(res)) setEmployees(res)
        else {
          console.error(res)
          setEmployees([])
        }
      }
    }catch(err:any){ console.error('load employees failed', err); setEmployees([]) }
  }

  async function loadEmployee(id:number){
    const res:any = await api.hrGetEmployee(id)
    setSelected(res || null)
  }

  function isSuccessResponse(res:any){
    if (res === undefined || res === null) return false
    if (typeof res === 'boolean') return res === true
    if (typeof res === 'string') return res.trim() === '' || /ok|deleted|success/i.test(res)
    if (typeof res === 'object') return !!(res.ok || res.message || Object.keys(res).length > 0)
    return true
  }

  useEffect(()=>{ load() }, [])

  useEffect(()=>{
    const onAuth = () => setRole(localStorage.getItem('role') || '')
    window.addEventListener('auth-change', onAuth)
    return () => window.removeEventListener('auth-change', onAuth)
  }, [])

  useEffect(()=>{ if (selectedId) loadEmployee(selectedId) }, [selectedId])

  async function handleAddDependent(e:any){
    e.preventDefault()
    if (!selectedId) return
    const empId = Number(selectedId)
    const payload:any = { name: depName, relation: depRelation, employeeId: empId }
    try{
      let res:any
      if (editingDependentId) {
        res = await api.request(`/dependents/${editingDependentId}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) } as any)
      } else {
        res = await api.createDependent(empId, payload)
      }
      if (res && (res.dependent || res.id || res.ok)) {
        setDepName(''); setDepRelation(''); setShowAddDependent(false); setEditingDependentId(null); loadEmployee(selectedId);
      } else {
        alert(res.error || 'Save failed')
      }
    }catch(err:any){ alert(err?.message || 'Request failed') }
  }

  async function handleDeleteDependent(id:number){
    if (!selectedId) return
    if (!confirm('Delete dependent?')) return
    try{
      const res:any = await api.request(`/dependents/${id}`, { method: 'DELETE' } as any)
      if (isSuccessResponse(res)) {
        // reload selected employee to refresh dependents
        loadEmployee(selectedId)
      } else {
        alert(res.error || 'Delete failed')
      }
    }catch(err:any){ alert(err?.message || 'Request failed') }
  }

  async function handleDeleteEmployee(empId:number){
    try{
      const res:any = await api.hrDeleteEmployee(empId)
      if (isSuccessResponse(res)) {
        load()
      } else {
        alert(res.error || 'Delete failed')
      }
    }catch(err:any){ alert(err?.message || 'Delete failed') }
  }

  function confirmDelete(id:number){
    setPendingDeleteId(id)
    setShowConfirmDelete(true)
  }

  async function performDelete(){
    if (!pendingDeleteId) return
    await handleDeleteEmployee(pendingDeleteId)
    setShowConfirmDelete(false)
    setPendingDeleteId(null)
  }

  function handleEditDependent(dep:any){
    setEditingDependentId(dep.id)
    setDepName(dep.name || '')
    setDepRelation(dep.relation || '')
    setShowAddDependent(true)
  }
  return (
    <RequireRole role="HR">
    <div className="main-area">
        <header className="page-header">
          <div className="left-banner">
            <div className="sub">Base • HR</div>
            <h1>Insurance Members</h1>
          </div>
          
        </header>

        <div className="content-grid">
          <div className="center-panel">
            <div className="people-header">
              <div>
                <h2>Insurance Members</h2>
                <p className="muted">Manage and enroll insurance policy members in your organization</p>

                <div className="tabs" role="tablist">
                  <button className={`tab ${filter==='all' ? 'active' : ''}`} onClick={()=>setFilter('all')}>All</button>
                  <button className={`tab ${filter==='active' ? 'active' : ''}`} onClick={()=>setFilter('active')}>Active</button>
                  <button className={`tab ${filter==='with-dependents' ? 'active' : ''}`} onClick={()=>setFilter('with-dependents')}>With dependents</button>
                </div>
              </div>

              <div className="controls">
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <input className="search" placeholder="Search by name or email" value={query} onChange={e=>setQuery(e.target.value)} />
                  {/* Filters and Sort removed */}
                </div>
                <div>
                  { String(role || '').toUpperCase().startsWith('HR') ? (
                    <button className="btn-primary" onClick={()=>setShowSingleModal(true)} style={{marginRight:8,padding:'10px 16px',borderRadius:10}}>+ Insurance Members</button>
                  ) : (
                    <button className="btn-primary" disabled title="Only HR can add members" style={{marginRight:8,padding:'10px 16px',borderRadius:10,opacity:0.6,cursor:'not-allowed'}}>+ Insurance Members</button>
                  )}
                </div>
              </div>
            </div>

            <div className="employee-table">
              <div className="table-head">
                <div className="col name-col">Name</div>
                <div className="col date-col">Date</div>
                <div className="col job-col">Job title</div>
                <div className="col type-col">Employment Type</div>
              </div>

              {employees.filter(emp=>{
                if (filter==='with-dependents' && (!emp.dependents || emp.dependents.length===0)) return false
                if (filter==='active' && emp.status === 'inactive') return false
                if (!query) return true
                const q = query.toLowerCase()
                return (emp.user?.name || '').toLowerCase().includes(q) || (emp.user?.email || '').toLowerCase().includes(q)
              }).map(emp=> (
                <div key={emp.id} className={`table-row ${selectedId===emp.id? 'selected':''}`} onClick={()=>setSelectedId(emp.id)} style={{cursor:'pointer'}}>
                  <div className="col name-col">
                    <input type="checkbox" onChange={()=>{}} />
                    <div className="emp-meta">
                      <div className="avatar">{getInitials(emp.user?.name)}</div>
                      <div className="info">
                        <strong>{emp.user?.name || `ID ${emp.id}`}</strong>
                        <div className="email muted">{emp.user?.email}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col date-col">{emp.hireDate || emp.createdAt || ''}</div>
                  <div className="col job-col">{emp.jobTitle || emp.role || ''}</div>
                  <div className="col type-col">{emp.employmentType || 'Employment'}</div>
                  <div className="col actions-col" style={{display:'flex',gap:6}}>
                    <button className="btn-ghost" onClick={(e)=>{ e.stopPropagation(); setDetailEmployeeId(emp.id); setShowDetailModal(true); }}>Details</button>
                    <button className="btn-ghost" onClick={(e)=>{ e.stopPropagation(); setSelectedId(emp.id); }}>Select</button>
                    { String(role || '').toUpperCase().startsWith('HR') ? (
                      <button className="btn-ghost" onClick={(e)=>{ e.stopPropagation(); confirmDelete(emp.id) }}>Delete</button>
                    ) : null }
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`right-panel ${selected ? 'open' : 'closed'}`}>
            {selected ? (
              <div>
                <h3>{selected.user?.name || `Employee ${selected.id}`}</h3>
                <div className="muted">{selected.user?.email}</div>
                <hr />
                <h4>Policy Dependents</h4>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {(selected.dependents || []).map((d:any)=> (
                      <div key={d.id} className="dependent-item" style={{display:'flex',alignItems:'center',gap:12}}>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:600}}>{d.name}</div>
                          <div className="muted">{d.relation}</div>
                        </div>
                        <div className="muted">{d.dob ? new Date(d.dob).toLocaleDateString() : ''}</div>
                        <div style={{display:'flex',gap:8}}>
                          <button className="btn-ghost" onClick={(e)=>{ e.stopPropagation(); handleEditDependent(d) }}>Edit</button>
                          <button className="btn-ghost" onClick={(e)=>{ e.stopPropagation(); handleDeleteDependent(d.id) }}>Delete</button>
                        </div>
                      </div>
                  ))}
                  {(selected.dependents||[]).length===0 && <div className="empty">No dependents</div>}
                </div>

                <div style={{marginTop:12}}>
                  <button onClick={()=>setShowAddDependent(s=>!s)}>+ Add Dependent</button>
                  <button style={{marginLeft:8}} className="btn-ghost" onClick={()=>navigate(`/employees/${selected.id}/dependents`)}>Open dependents page</button>
                </div>

                {showAddDependent && (
                  <div style={{marginTop:12,border:'1px solid #eee',padding:12,borderRadius:6}}>
                    <form onSubmit={handleAddDependent}>
                      <input placeholder="Name" value={depName} onChange={e=>setDepName(e.target.value)} />
                      <input placeholder="Relation" value={depRelation} onChange={e=>setDepRelation(e.target.value)} />
                      <div style={{marginTop:8}}>
                        <button type="submit">Add</button>
                        <button type="button" onClick={()=>setShowAddDependent(false)} style={{marginLeft:8}}>Cancel</button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty">No Employee Selected<br/>Please select an employee to view details</div>
            )}
          </div>
          {showSingleModal && (
            <div className="modal-backdrop" onClick={(e:any)=>{ if (e.target === e.currentTarget) setShowSingleModal(false) }}>
              <div className="modal-card">
                <button className="modal-close" onClick={()=>setShowSingleModal(false)}>✕</button>
                <SingleEntry onSuccess={(res:any)=>{ setShowSingleModal(false); load(); }} />
              </div>
            </div>
          )}
          {showProfileModal && selectedId && (
            <div className="modal-backdrop" onClick={(e:any)=>{ if (e.target === e.currentTarget) setShowProfileModal(false) }}>
              <div className="modal-card">
                <button className="modal-close" onClick={()=>setShowProfileModal(false)}>✕</button>
                <EmployeePersonal employeeId={selectedId} onClose={()=>setShowProfileModal(false)} />
              </div>
            </div>
          )}
          {showConfirmDelete && (
            <ConfirmDialog
              title="Delete employee?"
              message="Are you sure you want to delete this employee? This action cannot be undone."
              onCancel={() => { setShowConfirmDelete(false); setPendingDeleteId(null) }}
              onConfirm={performDelete}
              confirmLabel="Delete"
              cancelLabel="Cancel"
            />
          )}
          {showDetailModal && detailEmployeeId && (
            <EmployeeDetailModal
              isOpen={showDetailModal}
              employeeId={detailEmployeeId}
              onClose={() => { setShowDetailModal(false); setDetailEmployeeId(null) }}
              onRefresh={() => { load(); loadEmployee(selectedId || detailEmployeeId) }}
            />
          )}
        </div>
      </div>
    </RequireRole>
  )
}
