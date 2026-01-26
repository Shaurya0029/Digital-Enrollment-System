import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '../pages/Login'
import HRDashboard from '../pages/HRDashboard'
import Unauthorized from '../pages/Unauthorized'
import EmployeeDashboard from '../pages/EmployeeDashboard'
import EmployeeDependents from '../pages/EmployeeDependents'
import Dependents from '../pages/Dependents'
import EmployeesPage from '../pages/EmployeesPage'
import SingleEntry from '../pages/SingleEntry'
import EmployeePersonal from '../pages/EmployeePersonal'
import BulkImport from '../pages/BulkImport'
import BulkSuccess from '../pages/BulkSuccess'
import Layout from '../components/Layout'
import HRManagement from '../pages/HRManagement'
import PolicyList from '../pages/PolicyList'
import PolicyDetails from '../pages/PolicyDetails'
import CompanyProfile from '../pages/CompanyProfile'
import ProtectedRoute from '../components/ProtectedRoute'

export default function AppRoutes(){
  return (
    <Routes>
      <Route path="/login" element={<Login/>} />

      <Route path="/hr/dashboard" element={
        <ProtectedRoute allowedRoles={[ 'HR' ]}>
          <Layout><HRDashboard/></Layout>
        </ProtectedRoute>
      } />

      <Route path="/hr/management" element={
        <ProtectedRoute allowedRoles={[ 'HR' ]}>
          <Layout><HRManagement/></Layout>
        </ProtectedRoute>
      } />

      <Route path="/hr/employees" element={
        <ProtectedRoute allowedRoles={[ 'HR' ]}>
          <Layout><EmployeesPage/></Layout>
        </ProtectedRoute>
      } />

      <Route path="/hr/employees/single" element={
        <ProtectedRoute allowedRoles={[ 'HR' ]}>
          <Layout><SingleEntry/></Layout>
        </ProtectedRoute>
      } />

      <Route path="/hr/employees/bulk" element={
        <ProtectedRoute allowedRoles={[ 'HR' ]}>
          <Layout><BulkImport/></Layout>
        </ProtectedRoute>
      } />

      <Route path="/hr/employees/bulk/success" element={
        <ProtectedRoute allowedRoles={[ 'HR' ]}>
          <Layout><BulkSuccess/></Layout>
        </ProtectedRoute>
      } />

      <Route path="/hr/employees/personal/:employeeId" element={
        <ProtectedRoute allowedRoles={[ 'HR' ]}>
          <Layout><EmployeePersonal/></Layout>
        </ProtectedRoute>
      } />

      <Route path="/employee/dashboard" element={
        <ProtectedRoute allowedRoles={[ 'EMPLOYEE' ]}>
          <Layout><EmployeeDashboard/></Layout>
        </ProtectedRoute>
      } />

      <Route path="/employee" element={
        <ProtectedRoute allowedRoles={[ 'EMPLOYEE' ]}>
          <Layout><EmployeePersonal/></Layout>
        </ProtectedRoute>
      } />

      <Route path="/employee/dependents" element={
        <ProtectedRoute allowedRoles={[ 'EMPLOYEE' ]}>
          <Layout><EmployeeDependents/></Layout>
        </ProtectedRoute>
      } />

      <Route path="/employees/:employeeId/dependents" element={
        <ProtectedRoute allowedRoles={[ 'HR','EMPLOYEE' ]}>
          <Layout><Dependents/></Layout>
        </ProtectedRoute>
      } />

      <Route path="/unauthorized" element={<Unauthorized/>} />

      <Route path="/hr/policies" element={
        <ProtectedRoute allowedRoles={[ 'HR' ]}>
          <Layout><PolicyList/></Layout>
        </ProtectedRoute>
      } />

      <Route path="/hr/policies/:id" element={
        <ProtectedRoute allowedRoles={[ 'HR' ]}>
          <Layout><PolicyDetails/></Layout>
        </ProtectedRoute>
      } />

      <Route path="/company" element={
        <ProtectedRoute allowedRoles={[ 'HR' ]}>
          <Layout><CompanyProfile/></Layout>
        </ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
