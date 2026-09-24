import { beforeEach, describe, expect, it } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import MockAdapter from 'axios-mock-adapter'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { apiClient } from '../../api/client'
import { useClient } from '../useClients'
import { createTestQueryClient } from '../../test/testUtils'
import ClientDetailPage from '../../components/pages/ClientDetailPage'

const mock = new MockAdapter(apiClient)

const sample = {
  id: 1,
  company_id: 2,
  full_name: 'Ahmed Mohamed update',
  email: 'ahmedpdate@test.com',
  phone: '01012345666',
  national_id: '30201012345666',
  address: 'Cairo0',
  status: 'active',
  notes: 'VIP Client update',
  created_at: '2026-07-15T08:40:29.000000Z',
  updated_at: '2026-07-15T12:02:54.000000Z',
}

function hookWrapper({ children }) {
  const client = createTestQueryClient()
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function renderDetail(id = '1') {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/clients/${id}`]}>
        <Routes>
          <Route path="/clients/:id" element={<ClientDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('People — client detail page', () => {
  beforeEach(() => {
    mock.reset()
    mock.onGet('/cases').reply(200, { status: true, data: [] })
    mock.onGet('/appointments').reply(200, { status: true, data: [] })
    mock.onGet('/invoices').reply(200, { status: true, data: [] })
  })

  it('useClient loads person by id from API', async () => {
    mock.onGet('/clients/1').reply(200, { status: true, data: sample })
    const { result } = renderHook(() => useClient(1), { wrapper: hookWrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.client?.email).toBe('ahmedpdate@test.com')
  })

  it('renders client profile from API', async () => {
    mock.onGet('/clients/1').reply(200, { status: true, data: sample })
    renderDetail('1')
    expect(await screen.findByText('Ahmed Mohamed update')).toBeInTheDocument()
    expect(screen.getAllByText('ahmedpdate@test.com').length).toBeGreaterThan(0)
    expect(screen.getByText('CL-1')).toBeInTheDocument()
  })

  it('shows error state on 404', async () => {
    mock.onGet('/clients/999').reply(404, { message: 'Not found' })
    renderDetail('999')
    expect(await screen.findByText('تعذر تحميل الموكل')).toBeInTheDocument()
  })
})
