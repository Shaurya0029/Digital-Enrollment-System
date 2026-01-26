import React, { useEffect, useState } from 'react'
import api from '../api'

export default function CompanyProfile(){
  const [company, setCompany] = useState<any>({ name: 'Demo Company', address: 'N/A', hrContact: 'hr@example.com' })
  const [editing, setEditing] = useState(false)

  function save(){
    // demo only: persist in localStorage
    localStorage.setItem('company', JSON.stringify(company))
    setEditing(false)
    alert('Saved (demo)')
  }

  useEffect(()=>{
    const c = localStorage.getItem('company')
    if (c) setCompany(JSON.parse(c))
  }, [])

  return (
    <div className="main-area">
      <header className="page-header">
        <div className="left-banner"><div className="sub">Base • Admin</div><h1>Company Profile</h1></div>
        <div className="actions">
          <button className="btn-ghost" onClick={()=>{ alert('HR details shown below') }}>HR Details</button>
          <button className="btn-primary" onClick={()=>setEditing(e=>!e)}>{editing ? 'Cancel' : 'Edit'}</button>
          <button className="btn-primary" onClick={()=>{ localStorage.setItem('company', JSON.stringify({name:'New Company'})); alert('Organization created (demo)') }}>Create organization</button>
        </div>
      </header>

      <div className="content-grid">
        <div className="center-panel">
          <div className="card">
            {editing ? (
              <div>
                <label>Company Name</label>
                <input value={company.name} onChange={e=>setCompany({...company, name: e.target.value})} />
                <label>Address</label>
                <input value={company.address} onChange={e=>setCompany({...company, address: e.target.value})} />
                <label>HR Contact</label>
                <input value={company.hrContact} onChange={e=>setCompany({...company, hrContact: e.target.value})} />
                <div className="row"><button className="btn-primary" onClick={save}>Save</button></div>
              </div>
            ) : (
              <div>
                <h2>{company.name}</h2>
                <div className="muted-small">{company.address}</div>
                <hr />
                <h4>HR Contact</h4>
                <div>{company.hrContact}</div>
              </div>
            )}
          </div>
        </div>

        <div className="right-panel">
          <div className="card">
            <h4>Quick Actions</h4>
            <div className="row"><button className="btn-ghost">Export Data</button><button className="btn-ghost">Import</button></div>
          </div>
        </div>
      </div>
    </div>
  )
}
