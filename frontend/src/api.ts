const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000'

async function request(path: string, opts: RequestInit = {}){
  const headers = opts.headers ? new Headers(opts.headers as any) : new Headers()
  const token = localStorage.getItem('token')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(API_BASE + path, {...opts, headers})
  const text = await res.text()
  
  // Handle unauthorized / forbidden centrally: clear token and notify app
  if (res.status === 401 || res.status === 403) {
    // Only clear token and redirect on actual auth failures (not on resource access issues)
    // Check if this is truly an authentication error vs authorization error
    const isAuthFailure = res.status === 401 || (res.status === 403 && path !== '/me' && !path.includes('dependents'))
    
    if (isAuthFailure) {
      localStorage.removeItem('token')
      localStorage.removeItem('role')
      localStorage.removeItem('employeeId')
      window.dispatchEvent(new Event('auth-change'))
    }
    
    // Try to parse JSON error body to surface a readable message
    try {
      const parsed = JSON.parse(text)
      const msg = parsed && (parsed.error || parsed.message) ? (parsed.error || parsed.message) : text
      throw new Error(msg)
    } catch {
      throw new Error(text || 'Access denied')
    }
  }
  try { return JSON.parse(text) } catch { return text }
}

export async function login(emailOrId:string, password:string, role:string){
  return request('/auth/login', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ emailOrId, password, role }) })
}

export async function requestOtp(email:string, role?:string){
  return request('/auth/request-otp', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email, role }) })
}

export async function verifyOtp(email:string, code:string, role?:string){
  return request('/auth/verify-otp', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email, code, role }) })
}

export async function getPolicies(){
  return request('/policies')
}

export async function getPolicy(id:number){
  return request(`/policies/${id}`)
}

export async function hrRegister(payload:any){
  // demo wrapper for HR registration — backend route may differ
  return request('/auth/register', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
}

export async function createPolicy(payload:{policyNumber:string,name:string,description?:string}){
  return request('/policies', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
}

export async function updatePolicy(id:number, payload:{policyNumber?:string,name?:string,description?:string}){
  return request(`/policies/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
}

export async function deletePolicy(id:number){
  return request(`/policies/${id}`, { method: 'DELETE' })
}

export async function getMe(){
  return request('/me')
}

export async function updateProfile(payload:any){
  return request('/me', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
}

export async function changePassword(payload:{currentPassword:string,newPassword:string}){
  return request('/auth/change-password', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
}

export async function hrListEmployees(){
  return request('/hr/employees')
}

export async function hrGetEmployee(id:number){
  return request(`/hr/employees/${id}`)
}

export async function getDependents(employeeId?:number){
  const q = employeeId ? `?employeeId=${employeeId}` : ''
  return request('/dependents' + q)
}

export async function hrCreateEmployee(payload:any){
  return request('/hr/employee', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
}

export async function hrUpdateEmployee(id:number, payload:any){
  return request(`/hr/employee/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
}

export async function hrBulkCreate(payload:any[]){
  return request('/hr/employee/bulk', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
}

export async function getEmployees(){
  return request('/employees')
}

export async function getEmployeeById(id:number){
  return request(`/employees/${id}`)
}

export async function deleteEmployee(id:number){
  return request(`/employees/${id}`, { method: 'DELETE' })
}

export async function hrDeleteEmployee(id:number){
  return request(`/hr/employee/${id}`, { method: 'DELETE' })
}

export async function createDependent(employeeId:number, payload:any){
  return request('/dependents', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...payload, employeeId}) })
}

export async function updateDependent(dependentId:number, payload:any){
  return request(`/dependents/${dependentId}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
}

export async function deleteDependent(dependentId:number, employeeId:number){
  return request(`/dependents/${dependentId}`, { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({employeeId}) })
}

export async function updateEmployee(id:number, payload:any){
  return request(`/employees/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
}

export async function assignPolicy(dependentIdOrEmployeeId:number, policyIdOrPayload:number | any){
  // Handle both dependent and employee policy assignment
  if (typeof policyIdOrPayload === 'number') {
    // Employee policy assignment (legacy)
    return request(`/employees/${dependentIdOrEmployeeId}/policies/${policyIdOrPayload}`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({}) })
  } else {
    // Dependent policy assignment
    const payload = policyIdOrPayload
    return request(`/dependents/${dependentIdOrEmployeeId}/policy`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
  }
}

export default { request, login, requestOtp, verifyOtp, getPolicies, getPolicy, createPolicy, updatePolicy, deletePolicy, getMe, updateProfile, changePassword, hrRegister, hrListEmployees, hrGetEmployee, getDependents, hrCreateEmployee, hrUpdateEmployee, hrDeleteEmployee, createDependent, updateDependent, deleteDependent, hrBulkCreate, updateEmployee, assignPolicy, getEmployees, getEmployeeById, deleteEmployee }
