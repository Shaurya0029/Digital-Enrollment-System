import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'

export default function PolicyDetails(){
  const { id } = useParams()
  const navigate = useNavigate()
  const [policy, setPolicy] = useState<any>(null)

  async function load(){
    if (!id) return
    try{
      const res:any = await api.getPolicy(Number(id))
      setPolicy(res)
    }catch(err:any){ console.error(err); alert(err.message || 'Failed to load') }
  }

  useEffect(()=>{ load() }, [id])

  return (
    <div className="main-area">
      <header className="page-header">
        <div className="left-banner"><div className="sub">Base • HR</div><h1>Policy Details</h1></div>
        <div className="actions">
          <button className="btn-ghost" onClick={()=>navigate('/hr/employees')}>Add Employee</button>
          <button className="btn-primary" onClick={()=>navigate('/hr/employees/bulk')}>Bulk Upload</button>
        </div>
      </header>

      <div className="content-grid">
        <div className="center-panel">
          {policy ? (
            <div className="card">
              <h2>{policy.name}</h2>
              <div className="muted-small">{policy.policyNumber}</div>
              <hr />
              <h4>Coverage / Details</h4>
              <p className="muted-small">(No detailed coverage fields in demo)</p>

              <div style={{marginTop:12}}>
                <button className="btn-primary" onClick={()=>navigate('/hr/employees')}>Add Employee</button>
                <button className="btn-ghost" onClick={()=>navigate('/hr/employees/bulk')} style={{marginLeft:8}}>Bulk Upload</button>
                <button className="btn-ghost" onClick={()=>navigate(`/policies/${id}/enrol`)} style={{marginLeft:8}}>Enrol Employees</button>
              </div>

              <h4 style={{marginTop:12}}>Employees Enrolled</h4>
              <div className="card-list">
                {(policy.employees || []).map((ep:any)=> (
                  <div key={ep.id} className="emp-card">
                    <div className="meta">
                      <div className="avatar">{(ep.employee?.user?.name || '').split(' ').map((n:string)=>n[0]).slice(0,2).join('')}</div>
                      <div className="info"><strong>{ep.employee?.user?.name}</strong><div className="muted-small">{ep.employee?.user?.email}</div></div>
                    </div>
                  </div>
                ))}
                {(policy.employees||[]).length===0 && <div className="empty">No employees enrolled</div>}
              </div>
            </div>
          ) : (
            <div className="empty">Loading...</div>
          )}
        </div>

        <div className="right-panel">
          <div className="card">
            <h4>Policy Summary</h4>
            <div className="muted-small">ID: {policy?.id}</div>
            <div className="muted-small">Employees: {(policy?.employees||[]).length}</div>
            <div style={{marginTop:12}}>
              <button className="btn-ghost" onClick={()=>{ if (!policy) return; navigator.clipboard.writeText(window.location.href); alert('Link copied') }}>Copy Link</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
