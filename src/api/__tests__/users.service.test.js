import { beforeEach, describe, expect, it } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import { apiClient } from '../client'
import {
  buildUserPayload,
  createUser,
  deleteUser,
  fetchUser,
  fetchUsers,
  normalizeUser,
  updateUser,
} from '../users'

const mock = new MockAdapter(apiClient)

const sampleUser = {
  id: 4,
  company_id: 2,
  full_name: 'Ahmed Mohamed',
  email: 'ahmed@test.com',
  phone: '01012345678',
  role: 'admin',
  status: 'active',
  last_login: null,
}

describe('Section Users — users service', () => {
  beforeEach(() => {
    mock.reset()
  })

  it('fetchUsers returns list from API response', async () => {
    mock.onGet('/users').reply(200, { status: true, data: [sampleUser] })
    const list = await fetchUsers()
    expect(list).toHaveLength(1)
    expect(list[0].email).toBe('ahmed@test.com')
    expect(list[0].role).toBe('admin')
  })

  it('fetchUser returns a single record', async () => {
    mock.onGet('/users/4').reply(200, { status: true, data: sampleUser })
    const user = await fetchUser(4)
    expect(user.id).toBe(4)
    expect(user.full_name).toBe('Ahmed Mohamed')
  })

  it('create: submits correct payload to API', async () => {
    mock.onPost('/users').reply((config) => {
      const body = JSON.parse(config.data)
      expect(body.full_name).toBe('New User')
      expect(body.email).toBe('new@test.com')
      expect(body.password).toBe('123456')
      expect(body.role).toBe('admin')
      expect(body.company_id).toBe(2)
      return [201, { status: true, data: { ...sampleUser, id: 99, ...body } }]
    })

    const created = await createUser({
      company_id: 2,
      full_name: 'New User',
      email: 'new@test.com',
      phone: '01000000000',
      password: '123456',
      password_confirmation: '123456',
      role: 'admin',
      status: 'active',
    })
    expect(created.id).toBe(99)
  })

  it('update: sends PUT with updated fields', async () => {
    mock.onPut('/users/4').reply((config) => {
      const body = JSON.parse(config.data)
      expect(body.full_name).toBe('Ahmed Updated')
      expect(body.password).toBeUndefined()
      return [200, { status: true, data: { ...sampleUser, full_name: 'Ahmed Updated' } }]
    })

    const updated = await updateUser(4, {
      full_name: 'Ahmed Updated',
      email: sampleUser.email,
      phone: sampleUser.phone,
      role: 'admin',
      status: 'active',
    })
    expect(updated.full_name).toBe('Ahmed Updated')
  })

  it('delete: calls DELETE /users/{id}', async () => {
    mock.onDelete('/users/4').reply(200, { status: true })
    const result = await deleteUser(4)
    expect(result.status).toBe(true)
  })

  it('normalizeUser maps API fields for UI', () => {
    const n = normalizeUser(sampleUser)
    expect(n.name).toBe('Ahmed Mohamed')
    expect(n.roleLabel).toBe('المستشار العام')
    expect(n.statusLabel).toBe('نشط')
  })

  it('buildUserPayload omits password on update when empty', () => {
    const payload = buildUserPayload(
      { full_name: 'A', email: 'a@b.com', phone: '1', role: 'admin', status: 'active', password: '' },
      { companyId: 2, isUpdate: true },
    )
    expect(payload.password).toBeUndefined()
    expect(payload.company_id).toBe(2)
  })
})
