import React from 'react'
import Sidebar from './Sidebar'

export default function Layout({ children }: { children: React.ReactNode }){
  return (
    <div className="page-wrap">
      <Sidebar />
      <main className="main-area">
        {children}
      </main>
    </div>
  )
}
