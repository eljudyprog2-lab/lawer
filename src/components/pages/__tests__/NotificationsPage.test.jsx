import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MockAdapter from 'axios-mock-adapter'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { apiClient } from '../../../api/client'
import { createTestQueryClient } from '../../../test/testUtils'
import { AuthProvider } from '../../../context/AuthContext'
import { ToastProvider } from '../../../context/ToastContext'
import { writeAuthSession } from '../../../data/auth'
import NotificationsPage from '../NotificationsPage'

const mock = new MockAdapter(apiClient)

const sampleNotifications = [
  {
    id: 1,
    company_id: 4,
    user_id: 2,
    title: 'موعد جلسة جديدة',
    message: 'لديك جلسة غداً في محكمة القاهرة الجديدة',
    type: 'session',
    reference_id: 7,
    is_read: false,
    read_at: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 2,
    company_id: 4,
    user_id: 2,
    title: 'تم سداد الفاتورة',
    message: 'تم سداد دفعة بقيمة 5000 ريال للفاتورة INV-2026-001',
    type: 'payment',
    reference_id: 10,
    is_read: true,
    read_at: new Date(Date.now() - 1800000).toISOString(),
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
]

function renderNotificationsPage() {
  const queryClient = createTestQueryClient()
  writeAuthSession({
    name: 'مدير النظام',
    email: 'admin@test.com',
    roleId: 'admin',
    role: 'المستشار العام',
    company_id: 4,
    company_name: 'مكتب المحاماة',
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/notifications']}>
        <ToastProvider>
          <AuthProvider>
            <NotificationsPage />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('NotificationsPage Feature Tests', () => {
  beforeEach(() => {
    mock.reset()
  })

  it('renders notifications list with unread counter', async () => {
    mock.onGet('/notifications').reply(200, { status: true, data: sampleNotifications })
    renderNotificationsPage()

    expect(await screen.findByText('موعد جلسة جديدة')).toBeInTheDocument()
    expect(screen.getByText('تم سداد الفاتورة')).toBeInTheDocument()
    expect(screen.getByText('1 غير مقروء')).toBeInTheDocument()
    expect(screen.getByText('لديك جلسة غداً في محكمة القاهرة الجديدة')).toBeInTheDocument()
  })

  it('renders empty state when no notifications exist', async () => {
    mock.onGet('/notifications').reply(200, { status: true, data: [] })
    renderNotificationsPage()

    expect(await screen.findByText('لا توجد إشعارات حالياً')).toBeInTheDocument()
  })

  it('renders error state on API failure and retries successfully', async () => {
    mock.onGet('/notifications').replyOnce(500, { message: 'Server error loading notifications' })
    mock.onGet('/notifications').reply(200, { status: true, data: sampleNotifications })

    renderNotificationsPage()

    expect(await screen.findByText(/Server error loading notifications|حدث خطأ غير متوقع/)).toBeInTheDocument()

    const retryBtn = screen.getByRole('button', { name: /إعادة المحاولة/i })
    fireEvent.click(retryBtn)

    expect(await screen.findByText('موعد جلسة جديدة')).toBeInTheDocument()
  })

  it('marks an unread notification as read on click', async () => {
    const user = userEvent.setup()
    mock.onGet('/notifications').reply(200, { status: true, data: sampleNotifications })
    mock.onPut('/notifications/1/mark-as-read').reply(200, {
      status: true,
      data: { ...sampleNotifications[0], is_read: true, read_at: new Date().toISOString() },
    })

    renderNotificationsPage()

    const unreadItem = await screen.findByText('موعد جلسة جديدة')
    await user.click(unreadItem)

    await waitFor(() => {
      expect(mock.history.put.some((req) => req.url.includes('/notifications/1/mark-as-read'))).toBe(true)
    })
  })

  it('marks all unread notifications as read when clicking mark all', async () => {
    const user = userEvent.setup()
    mock.onGet('/notifications').reply(200, { status: true, data: sampleNotifications })
    mock.onPut('/notifications/1/mark-as-read').reply(200, {
      status: true,
      data: { ...sampleNotifications[0], is_read: true },
    })

    renderNotificationsPage()

    const markAllBtn = await screen.findByRole('button', { name: /قراءة الكل/i })
    await user.click(markAllBtn)

    await waitFor(() => {
      expect(mock.history.put.some((req) => req.url.includes('/notifications/1/mark-as-read'))).toBe(true)
    })
  })

  it('deletes notification after confirmation', async () => {
    const user = userEvent.setup()
    mock.onGet('/notifications').reply(200, { status: true, data: sampleNotifications })
    mock.onDelete('/notifications/1').reply(200, { status: true, message: 'Deleted' })

    renderNotificationsPage()

    const deleteBtn = await screen.findByRole('button', { name: 'حذف موعد جلسة جديدة' })
    await user.click(deleteBtn)

    expect(screen.getByText('تأكيد حذف الإشعار')).toBeInTheDocument()

    const confirmBtn = screen.getByRole('button', { name: 'حذف الإشعار' })
    await user.click(confirmBtn)

    await waitFor(() => {
      expect(mock.history.delete.some((req) => req.url.includes('/notifications/1'))).toBe(true)
    })
  })
})
