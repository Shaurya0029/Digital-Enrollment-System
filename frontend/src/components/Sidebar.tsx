import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Users,
  Shield,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Menu,
  X,
  LayoutDashboard,
  User,
  Heart,
  Clock,
} from 'lucide-react'

interface NavItem {
  icon: React.ReactNode
  label: string
  path: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

export default function Sidebar() {
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [userRole, setUserRole] = useState<'HR' | 'EMPLOYEE' | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const location = useLocation()

  useEffect(() => {
    // Get user role from localStorage
    const storedRole = localStorage.getItem('role')
    const storedUser = localStorage.getItem('user')
    
    if (storedRole) {
      setUserRole(storedRole as 'HR' | 'EMPLOYEE')
    }
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        setUserName(user.name || user.email?.split('@')[0] || 'User')
      } catch (e) {
        console.error('Error parsing user:', e)
      }
    }
  }, [])

  const isActive = (path: string) => location.pathname === path

  const handleLogout = () => {
    // Confirm logout
    if (!window.confirm('Are you sure you want to logout?')) {
      return
    }
    
    // Clear authentication data from localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('user')
    localStorage.removeItem('employeeId')
    
    // Dispatch auth-change event to notify all components
    window.dispatchEvent(new Event('auth-change'))
    
    // Redirect to login
    navigate('/login', { replace: true })
  }

  // Role-based navigation
  const navSections: NavSection[] = userRole === 'HR' ? 
    [
      {
        title: 'CORE',
        items: [
          {
            icon: <LayoutDashboard size={20} />,
            label: 'Dashboard',
            path: '/hr/dashboard',
          },
          {
            icon: <Users size={20} />,
            label: 'Employee Management',
            path: '/employee-management',
          },
        ],
      },
      {
        title: 'INSURANCE',
        items: [
          {
            icon: <Shield size={20} />,
            label: 'Insurance Members',
            path: '/hr/members',
          },
          {
            icon: <FileText size={20} />,
            label: 'Policies',
            path: '/hr/policies',
          },
          {
            icon: <BarChart3 size={20} />,
            label: 'Reports',
            path: '/hr/reports',
          },
        ],
      },
    ]
    : [
      {
        title: 'NAVIGATION',
        items: [
          {
            icon: <LayoutDashboard size={20} />,
            label: 'Dashboard',
            path: '/employee/dashboard',
          },
          {
            icon: <Shield size={20} />,
            label: 'Insurance Members',
            path: '/hr/members',
          },
          {
            icon: <FileText size={20} />,
            label: 'Policies',
            path: '/employee/policies',
          },
        ],
      },
    ]

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-950 
        border-r border-slate-700/50 transition-all duration-300 ease-out shadow-2xl
        ${collapsed ? 'w-20' : 'w-64'} z-50`}
    >
      {/* Top Section - Branding */}
      <div className="flex flex-col items-center pt-6 pb-8 px-4 border-b border-slate-700/30">
        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 bg-slate-800 hover:bg-slate-700 text-white p-1.5 rounded-full 
            border border-slate-700 transition-colors shadow-lg"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={16} /> : <Menu size={16} />}
        </button>

        {/* Logo / App Icon */}
        <div
          className="w-12 h-12 rounded-xl bg-linear-to-br from-purple-500 via-purple-600 to-blue-600 
          flex items-center justify-center text-white font-bold text-lg shadow-lg mb-3"
        >
          PP
        </div>

        {/* Branding Text */}
        <div className="text-center">
          <h1
            className={`font-bold text-white transition-all duration-300 ${
              collapsed ? 'text-0 h-0' : 'text-base'
            }`}
          >
            Prisha Policy
          </h1>
          <p
            className={`text-xs text-purple-300 font-medium transition-all duration-300 ${
              collapsed ? 'text-0 h-0' : ''
            }`}
          >
            {userRole === 'HR' ? 'HR Portal' : 'Employee Portal'}
          </p>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-6 scrollbar-hide">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-2">
            {/* Section Header */}
            <h3
              className={`text-xs font-bold text-slate-400 uppercase tracking-widest px-3 py-2 
              transition-all duration-300 ${collapsed ? 'opacity-0 h-0' : ''}`}
            >
              {section.title}
            </h3>

            {/* Menu Items */}
            <div className="space-y-1.5">
              {section.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : ''}
                  className={`relative flex items-center gap-3 px-3 py-3 rounded-lg 
                  transition-all duration-200 ease-out group
                  ${
                    isActive(item.path)
                      ? 'bg-linear-to-r from-purple-600/40 to-blue-600/40 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/40'
                  }
                  `}
                >
                  {/* Left Border Indicator for Active */}
                  {isActive(item.path) && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-linear-to-b from-purple-400 to-blue-400 rounded-r-full" />
                  )}

                  {/* Icon */}
                  <span
                    className={`shrink-0 text-slate-300 group-hover:text-white transition-colors
                    ${isActive(item.path) ? 'text-purple-300' : ''}`}
                  >
                    {item.icon}
                  </span>

                  {/* Label */}
                  <span
                    className={`font-medium text-sm whitespace-nowrap transition-all duration-300 
                    ${collapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}
                  >
                    {item.label}
                  </span>

                  {/* Tooltip on Collapse */}
                  {collapsed && (
                    <div
                      className="absolute left-full ml-2 px-3 py-2 bg-slate-900 text-white text-xs 
                      rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 
                      transition-opacity duration-200 pointer-events-none z-50 shadow-lg border border-slate-700"
                    >
                      {item.label}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Section - User Info & Logout */}
      <div
        className="border-t border-slate-700/30 px-3 py-4 space-y-3 bg-linear-to-t 
        from-slate-950 to-transparent"
      >
        {/* User Info */}
        <div
          className={`flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/50 
          border border-slate-700/30 transition-all duration-300
          ${collapsed ? 'justify-center' : ''}`}
        >
          <div
            className="w-10 h-10 rounded-full bg-linear-to-br from-purple-400 to-blue-500 
            flex items-center justify-center text-white font-semibold text-sm shrink-0"
          >
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{userName || 'User'}</p>
              <p className="text-xs text-slate-400 truncate capitalize">
                {userRole ? userRole.toLowerCase() : 'user'}
              </p>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg 
          bg-slate-700/30 hover:bg-red-600/30 text-slate-300 hover:text-red-300 
          transition-colors duration-200 font-medium text-sm group
          ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Logout' : ''}
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
          {collapsed && (
            <div
              className="absolute left-full ml-2 px-3 py-2 bg-slate-900 text-white text-xs 
              rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 
              transition-opacity duration-200 pointer-events-none z-50 shadow-lg border border-slate-700"
            >
              Logout
            </div>
          )}
        </button>
      </div>
    </aside>
  )
}
