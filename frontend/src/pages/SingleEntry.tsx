import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api'

type Props = { onSuccess?: (res:any) => void }

export default function SingleEntry(props: Props){
  const { onSuccess } = props
  const [name, setName] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [designation, setDesignation] = useState('')
  const [doj, setDoj] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState<'male'|'female'>('male')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [dependents, setDependents] = useState<Array<{name:string,relation:string,dob?:string,gender?:string,coverageStart?:string}>>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [showDepModal, setShowDepModal] = useState(false)
  const [depForm, setDepForm] = useState({ name:'', relation:'', dob:'', gender:'', coverageStart:'' })

  const navigate = useNavigate()
  useEffect(()=>{
    const r = localStorage.getItem('role') || ''
    if (!String(r).toUpperCase().startsWith('HR')) {
      navigate('/hr/employees')
    }
  }, [])
  const [searchParams] = useSearchParams()
  const editingId = searchParams.get('id') ? Number(searchParams.get('id')) : null

  useEffect(()=>{
    if (!editingId) return
    ;(async ()=>{
      try{
        const res:any = await api.hrGetEmployee(editingId)
        if (res && res.id){
          setName(res.user?.name || '')
          setEmail(res.user?.email || '')
          setDob(res.dob || '')
          setGender((res.gender as any) || 'male')
          setMobile(res.mobile || '')
          setDesignation(res.designation || '')
          setDoj(res.doj || '')
          setEmployeeId(res.employeeId || res.externalId || '')
          setDependents((res.dependents || []).map((d:any)=>({ name: d.name || '', relation: d.relation || '', dob: d.dob || '', gender: d.gender || '', coverageStart: d.coverageStart || '' })))
        }
      }catch(err){
        console.warn('load employee failed', err)
      }
    })()
  }, [editingId])

  async function handleSubmit(e?: React.FormEvent){
    if (e) e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    console.log('SingleEntry: submit started')

    // validations
    if (!name || name.trim().length < 3) {
      const msg = 'Employee name is required (min 3 chars)'
      setErrorMessage(msg)
      console.warn('[VALIDATION] ' + msg)
      return
    }
    if (!employeeId) {
      const msg = 'Employee ID is required'
      setErrorMessage(msg)
      console.warn('[VALIDATION] ' + msg)
      return
    }
    if (!designation) {
      const msg = 'Designation is required'
      setErrorMessage(msg)
      console.warn('[VALIDATION] ' + msg)
      return
    }
    if (!doj) {
      const msg = 'Date of joining is required'
      setErrorMessage(msg)
      console.warn('[VALIDATION] ' + msg)
      return
    }
    if (new Date(doj) > new Date()) {
      const msg = 'Date of joining cannot be in the future'
      setErrorMessage(msg)
      console.warn('[VALIDATION] ' + msg)
      return
    }
    if (!dob) {
      const msg = 'Date of birth is required'
      setErrorMessage(msg)
      console.warn('[VALIDATION] ' + msg)
      return
    }
    const age = (Date.now() - new Date(dob).getTime())/(1000*60*60*24*365.25)
    if (age < 18) {
      const msg = 'Employee must be at least 18 years old'
      setErrorMessage(msg)
      console.warn('[VALIDATION] ' + msg)
      return
    }
    if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
      const msg = 'Mobile must be a 10-digit number'
      setErrorMessage(msg)
      console.warn('[VALIDATION] ' + msg)
      return
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const msg = 'Valid email is required'
      setErrorMessage(msg)
      console.warn('[VALIDATION] ' + msg)
      return
    }

    // best-effort unique check
    try{
      const all:any = await api.hrListEmployees()
      if (Array.isArray(all)){
        const conflict = all.find((it:any)=> (String(it.employeeId || it.externalId || it.id) === String(employeeId)) && (!editingId || it.id !== editingId))
        if (conflict) {
          const msg = 'Employee ID already exists'
          setErrorMessage(msg)
          console.warn('[VALIDATION] ' + msg)
          return
        }
      }
    }catch(e){ 
      console.warn('[VALIDATION] Network check failed:', e)
    }

    const payload:any = {
      name,
      email,
      password: 'changeme',
      dob: dob || undefined,
      gender: gender || undefined,
      mobile: mobile || undefined,
      employeeId: employeeId || undefined,
      designation: designation || undefined,
      doj: doj || undefined,
      dependents,
    }

    try{
      console.log('[API] Calling hrCreateEmployee with payload:', payload)
      setIsSubmitting(true)
      setErrorMessage('')
      let res:any
      if (editingId){
        console.log('[API] Mode: UPDATE employee ' + editingId)
        res = await api.hrUpdateEmployee(editingId, payload)
      }else{
        console.log('[API] Mode: CREATE new employee')
        res = await api.hrCreateEmployee(payload)
      }
      console.log('[API] Response received:', res)
      const isNonEmptyObject = res && typeof res === 'object' && Object.keys(res).length !== 0
      const isTruthyPrimitive = !!res && (typeof res !== 'object')
      if (isNonEmptyObject || isTruthyPrimitive) {
        // treat non-empty object or any truthy primitive as success
        console.log('[SUCCESS] Employee ' + (editingId ? 'updated' : 'created') + ' successfully')
        setSuccessMessage('Employee ' + (editingId ? 'updated' : 'created') + ' successfully!')
        setTimeout(() => {
          if (onSuccess) onSuccess(res)
          else navigate('/hr/employees')
        }, 1000)
      } else {
        const msg = 'Employee creation returned unexpected response'
        console.error('[ERROR] ' + msg, res)
        setErrorMessage(msg)
      }
    }catch(err:any){
      const errMsg = err?.message || err?.error || 'Request failed'
      console.error('[ERROR] API call failed:', err)
      console.error('[ERROR] Error message:', errMsg)
      setErrorMessage(errMsg)
    }finally{
      setIsSubmitting(false)
    }
  }

  // Dependents modal helpers
  function openDepModal(){
    setDepForm({ name:'', relation:'', dob:'', gender:'', coverageStart:'' })
    setShowDepModal(true)
  }
  function closeDepModal(){ setShowDepModal(false) }
  function handleDepChange(field: keyof typeof depForm, value: string){ setDepForm(s=> ({ ...s, [field]: value })) }
  function validateDependent(d:any){
    if (!d.name || d.name.trim().length < 2) return 'Dependent name required (min 2 chars)'
    if (!d.relation) return 'Relation is required'
    if (!d.dob) return 'Dependent DOB is required'
    const age = (Date.now() - new Date(d.dob).getTime())/(1000*60*60*24*365.25)
    if (d.relation.toLowerCase().includes('child') && age >= 25) return 'Child dependent must be under 25'
    return null
  }
  function saveDependentFromModal(){
    const err = validateDependent(depForm)
    if (err) return alert(err)
    if (dependents.length >= 4) return alert('Max 4 dependents allowed')
    setDependents(s=> ([ ...s, { ...depForm } ]))
    closeDepModal()
  }

  function updateDependent(i:number, field:'name'|'relation'|'dob'|'gender'|'coverageStart', value:string){
    setDependents(prev=> prev.map((d,idx)=> idx===i ? ({ ...d, [field]: value }) : d))
  }
  function removeDependent(i:number){ setDependents(prev=> prev.filter((_,idx)=> idx!==i)) }

  return (
    <div className="w-full">
      {errorMessage && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '16px',
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          color: '#991b1b',
          fontSize: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage('')}
            style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontSize: '18px' }}
          >
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '16px',
          backgroundColor: '#dcfce7',
          border: '1px solid #86efac',
          borderRadius: '8px',
          color: '#166534',
          fontSize: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>✓ {successMessage}</span>
          <button
            onClick={() => setSuccessMessage('')}
            style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', fontSize: '18px' }}
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Full name</label>
            <input value={name} onChange={e=>setName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter full name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Employee ID</label>
            <input value={employeeId} onChange={e=>setEmployeeId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter employee ID" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Designation</label>
            <input value={designation} onChange={e=>setDesignation(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter designation" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Date of joining</label>
            <input type="date" value={doj} onChange={e=>setDoj(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Date of birth</label>
            <input type="date" value={dob} onChange={e=>setDob(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
            <select value={gender} onChange={e=>setGender(e.target.value as any)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Mobile</label>
            <input value={mobile} onChange={e=>setMobile(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter mobile number" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter email address" />
          </div>
        </div>

        {/* Dependents Section */}
        <div className="pt-4 border-t border-slate-200">
          <h4 className="text-sm font-semibold text-slate-900 mb-4">Dependents</h4>
          <div className="space-y-3 mb-4">
            {dependents.length === 0 && <div className="text-center py-6 bg-slate-50 rounded-lg border border-slate-200"><p className="text-sm text-slate-500">No dependents yet</p></div>}
            {dependents.map((d, i)=> (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm">{d.name}</p>
                  <p className="text-xs text-slate-600 mt-1">{d.relation} • {d.dob ? new Date(d.dob).toLocaleDateString() : 'No DOB'}</p>
                </div>
                <button type="button" className="px-3 py-1.5 ml-4 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" onClick={()=>removeDependent(i)}>Remove</button>
              </div>
            ))}
          </div>

          <button type="button" className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" onClick={openDepModal}>+ Add dependent</button>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-6 border-t border-slate-200">
          <button type="submit" className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all shadow-md disabled:opacity-50" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Confirm'}</button>
          <button type="button" className="px-6 py-2.5 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors" onClick={()=>navigate('/hr/employees')}>Discard</button>
        </div>
      </form>

      {showDepModal && (
        <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Add Dependent</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                <input value={depForm.name} onChange={e=>handleDepChange('name', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Relation</label>
                <select value={depForm.relation} onChange={e=>handleDepChange('relation', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select relation</option>
                  <option value="spouse">Spouse</option>
                  <option value="child">Child</option>
                  <option value="parent">Parent</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date of Birth</label>
                <input type="date" value={depForm.dob} onChange={e=>handleDepChange('dob', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
                <select value={depForm.gender} onChange={e=>handleDepChange('gender', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Coverage Start Date</label>
                <input type="date" value={depForm.coverageStart} onChange={e=>handleDepChange('coverageStart', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-slate-200">
              <button className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors" onClick={closeDepModal}>Cancel</button>
              <button className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors" onClick={saveDependentFromModal}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
