import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function PolicyList(){
  const [policies, setPolicies] = useState<any[]>([])
  const navigate = useNavigate()

  async function load(){
    try{
      const res:any = await api.getPolicies()
      if (Array.isArray(res)) setPolicies(res)
    }catch(err:any){ console.error(err) }
  }

  useEffect(()=>{ load() }, [])

  return (
    <div className="main-area">
      <header className="page-header">
        <div className="left-banner"><div className="sub">Base • HR</div><h1>Policies</h1></div>
        <div className="actions"><button className="btn-primary" onClick={()=>navigate('/hr/employees/bulk')}>Bulk Upload</button></div>
      </header>

      <div className="content-grid">
        <div className="center-panel">
          <div className="card-list">
            {policies.map(p=> {
              const isActive = !p.expiresAt || new Date(p.expiresAt) > new Date()
              return (
                <div key={p.id} className="emp-card" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <strong>{p.name}</strong>
                    <div className="muted-small">{p.policyNumber} • <span className="muted-small">{isActive ? 'Active' : 'Expired'}</span></div>
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <button className="btn-ghost" onClick={()=>navigate(`/policies/${p.id}`)}>Details</button>
                    <button className="btn-ghost" onClick={()=>navigate('/hr/employees')}>Add Employee</button>
                  </div>
                </div>
              )
            })}
            {policies.length===0 && <div className="empty">No policies found</div>}
          </div>
        </div>
        <div className="right-panel">
          <div className="empty">Select a policy to view details</div>
        </div>
      </div>
    </div>
  )
}
