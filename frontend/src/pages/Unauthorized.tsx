import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Unauthorized(){
  const navigate = useNavigate()
  return (
    <div style={{padding:32}}>
      <h2>Unauthorized</h2>
      <p>You do not have permission to view this page.</p>
      <div style={{marginTop:16}}>
        <button onClick={()=>navigate(-1)}>Go back</button>
      </div>
    </div>
  )
}
