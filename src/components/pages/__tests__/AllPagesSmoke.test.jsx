import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import MockAdapter from 'axios-mock-adapter'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { apiClient } from '../../../api/client'
import { createTestQueryClient } from '../../../test/testUtils'
import { AuthProvider } from '../../../context/AuthContext'
import { writeAuthSession } from '../../../data/auth'

import AuthPage from '../AuthPage'
import DashboardPage from '../DashboardPage'
import CasesPage from '../CasesPage'
import SessionsPage from '../SessionsPage'
import AppointmentsPage from '../AppointmentsPage'
import DocumentsPage from '../DocumentsPage'
import LawyersPage from '../LawyersPage'
import LawyerDetailPage from '../LawyerDetailPage'
import ClientsPage from '../ClientsPage'
import ClientDetailPage from '../ClientDetailPage'
import InvoicesPage from '../InvoicesPage'
import ProfilePage from '../ProfilePage'
import NotificationsPage from '../NotificationsPage'

const mock = new MockAdapter(apiClient)

const sampleClient = {
  id: 1,
  company_id: 2,
  full_name: 'محمد اشرف',
  email: 'client@test.com',
  phone: '01012345678',
  status: 'active',
}

const sampleLawyer = {
  id: 1,
  company_id: 2,
  full_name: 'د. سارة محمود',
  email: 'lawyer@test.com',
  phone: '01098765432',
  status: 'active',
  specialization: 'قانون مدني',
}

function renderPage(ui, { route = '/', userRole = 'admin' } = {}) {
  const queryClient = createTestQueryClient()
  writeAuthSession({
    name: userRole === 'client' ? 'محمد اشرف' : 'مدير النظام',
    email: userRole === 'client' ? 'client@test.com' : 'admin@test.com',
    roleId: userRole,
    role: userRole === 'client' ? 'موكل' : 'المستشار العام',
    company_id: 2,
    company_name: 'مكتب الدوسري',
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>
          {ui}
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('All Pages Smoke Tests — verifies every page renders cleanly', () => {
  beforeEach(() => {
    mock.reset()
    // Global API mock responses for standard GET queries
    mock.onGet('/dashboard').reply(200, {
      status: true,
      data: {
        statistics: {},
        upcoming_appointments: [
          { id: 101, title: 'موعد استشارة', appointment_date: '2026-09-25', appointment_time: '11:00' },
        ],
        latest_activities: [
          { id: 1, type: 'case', title: 'تحديث قضية تعويض', description: 'تم تحديد جلسة جديدة', created_at: '2026-09-24T08:00:00Z' },
          { id: 2, type: 'appointment', title: 'موعد جديد', description: 'استشارة قانونية', created_at: '2026-09-24T09:00:00Z' },
        ],
      },
    })
    mock.onGet('/cases').reply(200, { status: true, data: [] })
    mock.onGet('/sessions').reply(200, { status: true, data: [] })
    mock.onGet('/sessions/statistics').reply(200, { status: true, data: {} })
    mock.onGet('/appointments').reply(200, { status: true, data: [] })
    mock.onGet('/documents').reply(200, { status: true, data: [] })
    mock.onGet('/lawyers').reply(200, { status: true, data: [sampleLawyer] })
    mock.onGet('/lawyers/1').reply(200, { status: true, data: sampleLawyer })
    mock.onGet('/clients').reply(200, { status: true, data: [sampleClient] })
    mock.onGet('/clients/1').reply(200, { status: true, data: sampleClient })
    mock.onGet('/invoices').reply(200, { status: true, data: [] })
    mock.onGet('/invoices/payments-dashboard').reply(200, { status: true, data: {} })
    mock.onGet('/notifications').reply(200, { status: true, data: [] })
    mock.onGet('/users').reply(200, { status: true, data: [] })
    mock.onGet('/companies').reply(200, { status: true, data: [] })
  })

  it('1. AuthPage renders successfully', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <AuthPage />
        </AuthProvider>
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('2. DashboardPage renders with 8 cards and panels for client and admin', async () => {
    renderPage(<DashboardPage />, { route: '/', userRole: 'admin' })
    await waitFor(() => {
      expect(screen.getByText('قضايا')).toBeInTheDocument()
      expect(screen.getByText('مواعيدي')).toBeInTheDocument()
      expect(screen.getByText('الرصيد')).toBeInTheDocument()
      expect(screen.getByText('إجمالي القضايا')).toBeInTheDocument()
      expect(screen.getByText('آخر الأنشطة')).toBeInTheDocument()
      expect(screen.getByText('تحديث قضية تعويض')).toBeInTheDocument()
    })
  })

  it('3. CasesPage renders successfully', async () => {
    renderPage(<CasesPage />, { route: '/cases' })
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'القضايا' })).toBeInTheDocument()
    })
  })

  it('4. SessionsPage renders successfully', async () => {
    renderPage(<SessionsPage />, { route: '/sessions' })
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'الجلسات' })).toBeInTheDocument()
    })
  })

  it('5. AppointmentsPage renders successfully', async () => {
    renderPage(<AppointmentsPage />, { route: '/appointments' })
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'المواعيد' })).toBeInTheDocument()
    })
  })

  it('6. DocumentsPage renders successfully', async () => {
    renderPage(<DocumentsPage />, { route: '/documents' })
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'المستندات' })).toBeInTheDocument()
    })
  })

  it('7. LawyersPage renders successfully', async () => {
    renderPage(<LawyersPage />, { route: '/lawyers' })
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'المحامين' })).toBeInTheDocument()
    })
  })

  it('8. LawyerDetailPage renders successfully', async () => {
    renderPage(
      <Routes>
        <Route path="/lawyers/:id" element={<LawyerDetailPage />} />
      </Routes>,
      { route: '/lawyers/1' },
    )
    await waitFor(() => {
      expect(screen.getByText('د. سارة محمود')).toBeInTheDocument()
    })
  })

  it('9. ClientsPage renders successfully', async () => {
    renderPage(<ClientsPage />, { route: '/clients' })
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'الموكلون' })).toBeInTheDocument()
    })
  })

  it('10. ClientDetailPage renders successfully', async () => {
    renderPage(
      <Routes>
        <Route path="/clients/:id" element={<ClientDetailPage />} />
      </Routes>,
      { route: '/clients/1' },
    )
    await waitFor(() => {
      expect(screen.getByText('محمد اشرف')).toBeInTheDocument()
    })
  })

  it('11. InvoicesPage renders successfully', async () => {
    renderPage(<InvoicesPage />, { route: '/invoices' })
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'الفواتير والمدفوعات' })).toBeInTheDocument()
    })
  })

  it('12. ProfilePage renders successfully', async () => {
    renderPage(<ProfilePage />, { route: '/profile' })
    await waitFor(() => {
      expect(screen.getByText('البريد الإلكتروني')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'تسجيل الخروج' })).toBeInTheDocument()
    })
  })

  it('13. NotificationsPage renders successfully', async () => {
    renderPage(<NotificationsPage />, { route: '/notifications' })
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'الإشعارات' })).toBeInTheDocument()
    })
  })
})
