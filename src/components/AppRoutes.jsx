import { Navigate, Route, Routes } from 'react-router-dom'
import { DashboardLayout } from './layout/DashboardLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleRoute } from './RoleRoute'
import DashboardPage from './pages/DashboardPage'
import CasesPage from './pages/CasesPage'
import ClientsPage from './pages/ClientsPage'
import ClientDetailPage from './pages/ClientDetailPage'
import LawyersPage from './pages/LawyersPage'
import LawyerDetailPage from './pages/LawyerDetailPage'
import DocumentsPage from './pages/DocumentsPage'
import AppointmentsPage from './pages/AppointmentsPage'
import SessionsPage from './pages/SessionsPage'
import InvoicesPage from './pages/InvoicesPage'
import ProfilePage from './pages/ProfilePage'
import NotificationsPage from './pages/NotificationsPage'
import AuthPage from './pages/AuthPage'

export function AppRoutes() {
  return (
    <Routes>
      {/* Platform-level routes (outside tenant / Dosari dashboard) */}
      <Route path="login" element={<AuthPage />} />

      {/* Tenant firm dashboard (مكتب الدوسري) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="cases" element={<CasesPage />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route element={<RoleRoute navId="lawyers" />}>
            <Route path="lawyers" element={<LawyersPage />} />
            <Route path="lawyers/:id" element={<LawyerDetailPage />} />
          </Route>
          <Route element={<RoleRoute navId="clients" />}>
            <Route path="clients" element={<ClientsPage />} />
            <Route path="clients/:id" element={<ClientDetailPage />} />
          </Route>
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
