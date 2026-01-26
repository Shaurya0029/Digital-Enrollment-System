import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function BulkSuccess(){
  const location:any = useLocation()
  const navigate = useNavigate()
  const data = location.state || { createdCount: 0, errors: [] }

  return (
    <div className="container">
      <h2>Bulk Import Result</h2>
      <p>Created: {data.createdCount}</p>
      {Array.isArray(data.created) && (
        <section>
          <h3>Created Samples</h3>
          <ul>
            {data.created.slice(0,10).map((c:any,i:number)=>(<li key={i}>{c.user?.email || 'id:'+c.id}</li>))}
          </ul>
        </section>
      )}
      {Array.isArray(data.errors) && data.errors.length>0 && (
        <section>
          <h3>Errors</h3>
          <ul>
            {data.errors.map((e:any,i:number)=>(<li key={i}>{e.error} — {JSON.stringify(e.item)}</li>))}
          </ul>
        </section>
      )}

      <div style={{marginTop:12}}>
        <button onClick={()=>navigate('/hr/employees')}>Back to Employees</button>
      </div>
    </div>
  )
}
