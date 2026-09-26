import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MockAdapter from 'axios-mock-adapter'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { apiClient } from '../../../api/client'
import { createTestQueryClient } from '../../../test/testUtils'
import { AuthProvider } from '../../../context/AuthContext'
import { writeAuthSession } from '../../../data/auth'
import ManageListsPage from '../ManageListsPage'
import ListDetailPage from '../ListDetailPage'
import { apiRules } from '../../../validation/apiRules'

const mock = new MockAdapter(apiClient)

const sampleTypes = [
  { id: 1, company_id: 2, name: 'قضايا مدنية' },
  { id: 2, company_id: 2, name: 'قضايا تجارية' },
]

const sampleCategories = [
  { id: 1, company_id: 2, name: 'القضايا التجارية' },
  { id: 2, company_id: 2, name: 'القضايا الصناعية' },
]

const sampleCases = [
  { id: 10, case_number: 'CASE-001', type_id: 1, category_id: 2 },
]

function renderWithProviders(ui, { route = '/manage-lists' } = {}) {
  const queryClient = createTestQueryClient()
  writeAuthSession({
    name: 'مدير النظام',
    email: 'admin@test.com',
    roleId: 'admin',
    role: 'المستشار العام',
    company_id: 2,
    company_name: 'مكتب الدوسري',
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path="/manage-lists" element={<ManageListsPage />} />
            <Route path="/manage-lists/:listKey" element={<ListDetailPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

describe('Manage Lists Feature Tests', () => {
  beforeEach(() => {
    mock.reset()
    mock.onGet(/\/case-types/).reply(200, { status: true, data: sampleTypes })
    mock.onGet(/\/case-categories/).reply(200, { status: true, data: sampleCategories })
    mock.onGet(/\/cases/).reply(200, { status: true, data: sampleCases })
  })

  describe('ManageListsPage (Overview)', () => {
    it('renders page header and stat cards', async () => {
      renderWithProviders(<ManageListsPage />)

      expect(screen.getByText('مجموعات الخيارات والقوائم المنسدلة')).toBeInTheDocument()
      expect(screen.getByText('إجمالي مجموعات القوائم')).toBeInTheDocument()
      expect(screen.getByText('قوائم مدعومة بالكامل (CRUD)')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByText('أنواع القضايا (Case Types)')).toBeInTheDocument()
        expect(screen.getByText('تصنيفات ودرجات التقاضي (Case Categories)')).toBeInTheDocument()
      })
    })

    it('filters groups by search query', async () => {
      renderWithProviders(<ManageListsPage />)

      await waitFor(() => {
        expect(screen.getByText('أنواع القضايا (Case Types)')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('بحث في مجموعات الخيارات...')
      fireEvent.change(searchInput, { target: { value: 'مدنية' } })

      expect(screen.getByText('أنواع القضايا (Case Types)')).toBeInTheDocument()
      expect(screen.queryByText('حالات الفواتير والتحصيل (Invoice Statuses)')).not.toBeInTheDocument()
    })
  })

  describe('ListDetailPage (CRUD and Validation)', () => {
    it('renders detail page for case-types with existing options', async () => {
      renderWithProviders(<ListDetailPage />, { route: '/manage-lists/case-types' })

      await waitFor(() => {
        expect(screen.getByText(/إدارة خيارات: أنواع القضايا/)).toBeInTheDocument()
        expect(screen.getByText('قضايا مدنية')).toBeInTheDocument()
        expect(screen.getByText('قضايا تجارية')).toBeInTheDocument()
      })
    })

    it('validates name input field according to apiRules', async () => {
      renderWithProviders(<ListDetailPage />, { route: '/manage-lists/case-types' })

      await waitFor(() => {
        expect(screen.getByText('حفظ وإدراج بالقائمة')).toBeInTheDocument()
      })

      // Submit with empty name in Quick Add form
      const submitBtn = screen.getByText('حفظ وإدراج بالقائمة')
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(screen.getByText(apiRules.lookups.name.messages.required)).toBeInTheDocument()
      })
    })

    it('shows reference warning in Delete modal when item is linked to a case', async () => {
      renderWithProviders(<ListDetailPage />, { route: '/manage-lists/case-types' })

      await waitFor(() => {
        expect(screen.getByText('قضايا مدنية')).toBeInTheDocument()
      })

      // Type 1 is referenced in sampleCases (type_id: 1)
      const deleteButtons = screen.getAllByTitle('حذف هذا الخيار')
      fireEvent.click(deleteButtons[0]) // First option is ID 1 (قضايا مدنية)

      await waitFor(() => {
        expect(screen.getByText('تأكيد حذف خيار من القائمة')).toBeInTheDocument()
        expect(screen.getByText(/تنبيه ارتباط السجلات في النظام/)).toBeInTheDocument()
        expect(screen.getByText(/هذا الخيار مستخدم حالياً في/)).toBeInTheDocument()
      })
    })

    it('submits create option to live API client', async () => {
      mock.onPost(/\/case-types/).reply(201, {
        status: true,
        data: { id: 3, company_id: 2, name: 'قضايا عمالية' },
      })

      renderWithProviders(<ListDetailPage />, { route: '/manage-lists/case-types' })

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/نوع قضية جديد/)).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText(/نوع قضية جديد/)
      fireEvent.change(input, { target: { value: 'قضايا عمالية' } })

      const submitBtn = screen.getByText('حفظ وإدراج بالقائمة')
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(mock.history.post.length).toBe(1)
        expect(JSON.parse(mock.history.post[0].data).name).toBe('قضايا عمالية')
      })
    })
  })
})
