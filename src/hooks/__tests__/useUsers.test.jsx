import { beforeEach, describe, expect, it } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import MockAdapter from 'axios-mock-adapter'
import { QueryClientProvider } from '@tanstack/react-query'
import { apiClient } from '../../api/client'
import { useUser, useUserMutations, useUsers } from '../useUsers'
import { createTestQueryClient } from '../../test/testUtils'

const mock = new MockAdapter(apiClient)

const sample = {
  id: 4,
  company_id: 2,
  full_name: 'Ahmed Mohamed',
  email: 'ahmed@test.com',
  phone: '01012345678',
  role: 'admin',
  status: 'active',
  last_login: null,
}

function wrapper({ children }) {
  const client = createTestQueryClient()
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('Section Users — useUsers hooks', () => {
  beforeEach(() => {
    mock.reset()
  })

  it('fetches and returns list from API', async () => {
    mock.onGet('/users').reply(200, { status: true, data: [sample] })
    const { result } = renderHook(() => useUsers(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.users).toHaveLength(1)
    expect(result.current.users[0].email).toBe('ahmed@test.com')
    expect(result.current.error).toBeNull()
  })

  it('shows empty list when API returns []', async () => {
    mock.onGet('/users').reply(200, { status: true, data: [] })
    const { result } = renderHook(() => useUsers(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.users).toEqual([])
  })

  it('surfaces error message on API failure', async () => {
    mock.onGet('/users').reply(500, { message: 'Server error' })
    const { result } = renderHook(() => useUsers(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBe('Server error')
  })

  it('useUser loads a single record', async () => {
    mock.onGet('/users/4').reply(200, { status: true, data: sample })
    const { result } = renderHook(() => useUser(4), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.user?.id).toBe(4)
  })

  it('create mutates then invalidates list', async () => {
    mock.onGet('/users').reply(200, { status: true, data: [] })
    mock.onPost('/users').reply(201, { status: true, data: sample })

    const { result } = renderHook(
      () => {
        const list = useUsers()
        const mutations = useUserMutations()
        return { list, mutations }
      },
      { wrapper },
    )

    await waitFor(() => expect(result.current.list.isLoading).toBe(false))

    mock.onGet('/users').reply(200, { status: true, data: [sample] })
    await result.current.mutations.create.mutateAsync({
      company_id: 2,
      full_name: sample.full_name,
      email: sample.email,
      phone: sample.phone,
      password: '123456',
      password_confirmation: '123456',
      role: 'admin',
      status: 'active',
    })

    await waitFor(() => expect(result.current.list.users).toHaveLength(1))
  })

  it('delete mutates then refreshes list', async () => {
    mock.onGet('/users').reply(200, { status: true, data: [sample] })
    mock.onDelete('/users/4').reply(200, { status: true })

    const { result } = renderHook(
      () => {
        const list = useUsers()
        const mutations = useUserMutations()
        return { list, mutations }
      },
      { wrapper },
    )

    await waitFor(() => expect(result.current.list.users).toHaveLength(1))

    mock.onGet('/users').reply(200, { status: true, data: [] })
    await result.current.mutations.remove.mutateAsync(4)

    await waitFor(() => expect(result.current.list.users).toHaveLength(0))
  })
})
