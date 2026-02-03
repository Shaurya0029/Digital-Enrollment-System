import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'

export default function EmployeePersonal({ employeeId: propEmployeeId, onClose }: { employeeId?: number|string, onClose?: ()=>void } = {}){
  const params = useParams()
  const { employeeId } = params
  const navigate = useNavigate()
  const idNum = propEmployeeId ? Number(propEmployeeId) : (employeeId ? Number(employeeId) : null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [employee, setEmployee] = useState<any|null>(null)
  const [form, setForm] = useState({ dob: '', address: '', maritalStatus: 'single', phone: '' })
  const [currentUserId, setCurrentUserId] = useState<number|null>(null)
  const [canEdit, setCanEdit] = useState(false)
  const userRole = localStorage.getItem('role')

  useEffect(()=>{
    setLoading(true)
    
    // Get current user info
    api.getMe().then((me:any)=>{
      const currUserId = me?.employee?.id || me?.id
      setCurrentUserId(currUserId)
      
      // If no ID provided, fetch current user's employee ID
      if (!idNum) {
        if (me && me.employee && me.employee.id) {
          const empId = me.employee.id
          setCanEdit(true) // Can always edit own profile
          return api.hrGetEmployee(empId).then((res:any)=>{
            setEmployee(res)
            const dobVal = res?.dob ? (typeof res.dob === 'string' ? (new Date(res.dob).toISOString().slice(0,10)) : (new Date(res.dob).toISOString().slice(0,10))) : ''
            setForm({
              dob: dobVal,
              address: res?.address || '',
              maritalStatus: res?.maritalStatus || (res?.married ? 'married' : 'single'),
              phone: res?.phone || ''
            })
          })
        } else {
          setEmployee(null)
          setCanEdit(false)
        }
      } else {
        // If viewing another employee, only HR can edit, employees can only view their own
        const isOwnProfile = userRole === 'EMPLOYEE' && currUserId === idNum
        const isHR = userRole === 'HR'
        setCanEdit(isOwnProfile || isHR)
        
        return api.hrGetEmployee(idNum).then((res:any)=>{
          setEmployee(res)
          const dobVal = res?.dob ? (typeof res.dob === 'string' ? (new Date(res.dob).toISOString().slice(0,10)) : (new Date(res.dob).toISOString().slice(0,10))) : ''
          setForm({
            dob: dobVal,
            address: res?.address || '',
            maritalStatus: res?.maritalStatus || (res?.married ? 'married' : 'single'),
            phone: res?.phone || ''
          })
        })
      }
    }).catch(err=>{
      console.error('Failed to load current user:', err)
      setEmployee(null)
      setCanEdit(false)
    }).finally(()=>setLoading(false))
  },[employeeId, idNum, userRole])

  function validate(){
    if (!form.dob) return 'Date of birth is required'
    if (!form.address || form.address.trim() === '') return 'Address is required'
    if (!form.maritalStatus || form.maritalStatus.trim() === '') return 'Marital status is required'
    if (!form.phone || !/^[0-9\-+()\s]{7,}$/.test(form.phone)) return 'Enter a valid phone number'
    return null
  }

  async function handleSave(e:any){
    e?.preventDefault()
    const v = validate()
    if (v) return alert(v)
    if (!idNum) return alert('Missing employee id')
    setSaving(true)
    try{
      const payload:any = { dob: form.dob, address: form.address, maritalStatus: form.maritalStatus, phone: form.phone }
      const res:any = await api.hrUpdateEmployee(idNum, payload)
      console.log('hrUpdate response', res)
      if (res && (res.ok || res.employee || res.id)){
        alert('Saved')
        if (onClose) onClose()
        else navigate('/hr/employees')
      } else if (res && res.error) {
        alert('Save failed: ' + (res.error || JSON.stringify(res)))
      } else {
        alert('Save failed: ' + JSON.stringify(res))
      }
    }catch(err:any){ alert(err.message || 'Request failed') }
    finally{ setSaving(false) }
  }

  return (
    <div className="main-area">
      <header className="page-header">
        <div className="left-banner">
          <div className="sub">Employee • Profile</div>
          <h1>Personal Details</h1>
          <div className="muted-small">Please complete your personal details</div>
        </div>
        <div className="actions">
          <button className="btn-ghost" onClick={()=>{ if (onClose) onClose(); else navigate('/hr/employees') }}>Back</button>
        </div>
      </header>

      <div style={{padding:20}}>
        {loading && <div className="muted-small">Loading employee…</div>}
        {!loading && !canEdit && (
          <div className="muted-small" style={{padding: '20px', backgroundColor: '#fef3c7', borderRadius: '8px', color: '#92400e', marginBottom: '20px'}}>
            You can only view your own profile. Contact HR for other employee information.
          </div>
        )}
        {!loading && (
          <div className="form-card" style={{maxWidth:720}}>
            <form onSubmit={handleSave} style={{display:'grid',gap:12}}>
              <label>Date of birth</label>
              <input type="date" value={form.dob} onChange={e=>setForm({...form, dob: e.target.value})} disabled={!canEdit} />

              <label>Address</label>
              <input placeholder="Street, City, State, ZIP" value={form.address} onChange={e=>setForm({...form, address: e.target.value})} disabled={!canEdit} />

              <label>Marital status</label>
              <select value={form.maritalStatus} onChange={e=>setForm({...form, maritalStatus: e.target.value})} disabled={!canEdit}>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
              </select>

              <label>Phone number</label>
              <input placeholder="Phone number" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} disabled={!canEdit} />

              <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
                <button type="button" className="btn-ghost" onClick={()=>{ if (onClose) onClose(); else navigate('/hr/employees') }}>Back</button>
                {canEdit && (
                  <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
