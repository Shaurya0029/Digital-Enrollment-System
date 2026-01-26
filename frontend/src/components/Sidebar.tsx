import React from 'react'
import { Link } from 'react-router-dom'

export default function Sidebar(){
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="logo">PP</div>
        <div className="brand">Prisha Policy</div>
      </div>

      <nav className="sidebar-nav">
        <ul>
          <li><Link to="/hr/management"><span className="link-text">HR Management</span></Link></li>
          <li><Link to="/hr/dashboard"><span className="link-text">HR Dashboard</span></Link></li>
          <li><Link to="/hr/employees"><span className="link-text">Insurance Members</span></Link></li>
          <li><Link to="/employee/dashboard"><span className="link-text">Employee Dashboard</span></Link></li>
        </ul>
      </nav>

      <div className="sidebar-footer">
      </div>
    </aside>
  )
}
