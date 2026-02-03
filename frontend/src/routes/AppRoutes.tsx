import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '../pages/Login'
import HRDashboard from '../pages/HRDashboard'
import HRManagement from '../pages/HRManagement'
import PolicyList from '../pages/PolicyList'
import PolicyDetails from '../pages/PolicyDetails'
import HRPendingRequests from '../pages/HRPendingRequests'
import HRReports from '../pages/HRReports'
import InsuranceMembers from '../pages/InsuranceMembers'
import EmployeesPage from '../pages/EmployeesPage'
import SingleEntry from '../pages/SingleEntry'
import BulkImport from '../pages/BulkImport'
import BulkSuccess from '../pages/BulkSuccess'
import EmployeeDashboard from '../pages/EmployeeDashboard'
import EmployeeDependents from '../pages/EmployeeDependents'
import EmployeeProfile from '../pages/EmployeeProfile'
import CompanyProfile from '../pages/CompanyProfile'
import Unauthorized from '../pages/Unauthorized'
import Layout from '../components/Layout'
import ProtectedRoute from '../components/ProtectedRoute'
import HRProtectedRoute from '../components/HRProtectedRoute'

export default function AppRoutes(){
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login/>} />
      <Route path="/unauthorized" element={<Unauthorized/>} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* HR Protected Routes - Wrapped with HRProtectedRoute */}
      <Route element={<HRProtectedRoute />}>
        {/* HR Dashboard & Management */}
        <Route path="/hr/dashboard" element={
          <Layout><HRDashboard/></Layout>
        } />

        <Route path="/hr/management" element={
          <Layout><HRManagement/></Layout>
        } />

        <Route path="/employee-management" element={
          <Layout><HRManagement/></Layout>
        } />

        {/* HR Employee Management */}
        <Route path="/hr/employees" element={
          <Layout><EmployeesPage/></Layout>
        } />

        <Route path="/hr/employees/single" element={
          <Layout><SingleEntry/></Layout>
        } />

        <Route path="/hr/employees/bulk" element={
          <Layout><BulkImport/></Layout>
        } />

        <Route path="/hr/employees/bulk/success" element={
          <Layout><BulkSuccess/></Layout>
        } />

        {/* HR Policy Management */}
        <Route path="/hr/policies" element={
          <Layout><PolicyList/></Layout>
        } />

        <Route path="/hr/policies/:id" element={
          <Layout><PolicyDetails/></Layout>
        } />

        {/* HR Insurance Members */}
        <Route path="/hr/members" element={
          <Layout><InsuranceMembers/></Layout>
        } />

        {/* HR Requests & Reports */}
        <Route path="/hr/pending-requests" element={
          <Layout><HRPendingRequests/></Layout>
        } />

        <Route path="/hr/pending" element={
          <Layout><HRPendingRequests/></Layout>
        } />

        <Route path="/hr/reports" element={
          <Layout><HRReports/></Layout>
        } />

        {/* HR Company Settings */}
        <Route path="/company" element={
          <Layout><CompanyProfile/></Layout>
        } />
      </Route>

      {/* Employee Protected Routes */}
      <Route path="/employee/dashboard" element={
        <ProtectedRoute allowedRoles={['EMPLOYEE']}>
          <Layout><EmployeeDashboard/></Layout>
        </ProtectedRoute>
      } />

      <Route path="/employee/profile" element={
        <ProtectedRoute allowedRoles={['EMPLOYEE']}>
          <Layout><EmployeeProfile/></Layout>
        </ProtectedRoute>
      } />

      <Route path="/employee" element={
        <ProtectedRoute allowedRoles={['EMPLOYEE']}>
          <Layout><EmployeeProfile/></Layout>
        </ProtectedRoute>
      } />

      <Route path="/employee/dependents" element={
        <ProtectedRoute allowedRoles={['EMPLOYEE']}>
          <Layout><EmployeeDependents/></Layout>
        </ProtectedRoute>
      } />

      <Route path="/employee/policies" element={
        <ProtectedRoute allowedRoles={['EMPLOYEE']}>
          <Layout><PolicyList/></Layout>
        </ProtectedRoute>
      } />

      {/* Catch-all - Redirect to login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
