import { beforeEach, describe, expect, it } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import MockAdapter from 'axios-mock-adapter'
import { QueryClientProvider } from '@tanstack/react-query'
import { apiClient } from '../../api/client'
import { useCompanies, useCompany, useCompanyMutations } from '../useCompanies'
import { createTestQueryClient } from '../../test/testUtils'

const mock = new MockAdapter(apiClient)

const sample = {
  id: 4,
  name: 'Law Office three',
  email: 'lawofficethree@test.com',
  phone: '01011121133',
  address: 'Cairo',
  logo: null,
  subscription_plan: 'professional',
  subscription_start: '2026-07-15T00:00:00.000000Z',
  subscription_end: '2027-07-15T00:00:00.000000Z',
  status: 'active',
}

function wrapper({ children }) {
  const client = createTestQueryClient()
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useCompanies hooks', () => {
  beforeEach(() => {
    mock.reset()
  })

  it('useCompanies loads list from API', async () => {
    mock.onGet('/companies').reply(200, { status: true, data: [sample] })
    const { result } = renderHook(() => useCompanies(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.companies).toHaveLength(1)
    expect(result.current.companies[0].name).toBe('Law Office three')
    expect(result.current.error).toBeNull()
  })

  it('useCompanies surfaces API error message', async () => {
    mock.onGet('/companies').reply(500, { message: 'Server error' })
    const { result } = renderHook(() => useCompanies(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBe('Server error')
    expect(result.current.companies).toEqual([])
  })

  it('useCompany loads a single record', async () => {
    mock.onGet('/companies/4').reply(200, { status: true, data: sample })
    const { result } = renderHook(() => useCompany(4), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.company?.id).toBe(4)
  })

  it('useCompanyMutations.create invalidates list after success', async () => {
    mock.onGet('/companies').reply(200, { status: true, data: [] })
    mock.onPost('/companies').reply(201, { status: true, data: sample })

    const { result } = renderHook(
      () => {
        const list = useCompanies()
        const mutations = useCompanyMutations()
        return { list, mutations }
      },
      { wrapper },
    )

    await waitFor(() => expect(result.current.list.isLoading).toBe(false))

    mock.onGet('/companies').reply(200, { status: true, data: [sample] })
    await result.current.mutations.create.mutateAsync({
      name: sample.name,
      email: sample.email,
      phone: sample.phone,
      address: sample.address,
      subscription_plan: sample.subscription_plan,
      subscription_start: '2026-07-15',
      subscription_end: '2027-07-15',
      status: 'active',
    })

    await waitFor(() => expect(result.current.list.companies).toHaveLength(1))
  })
})
