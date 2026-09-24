import { describe, expect, it } from 'vitest'
import {
  buildRegisterUserPayload,
  validateRegisterForm,
} from '../users'

describe('users register (POST /api/users)', () => {
  it('validateRegisterForm blocks empty / invalid input', () => {
    const empty = validateRegisterForm({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    })
    expect(empty.ok).toBe(false)
    expect(empty.fieldErrors.name).toBeTruthy()

    const badEmail = validateRegisterForm({
      name: 'Test',
      email: 'not-an-email',
      password: '123456',
      confirmPassword: '123456',
    })
    expect(badEmail.ok).toBe(false)
    expect(badEmail.fieldErrors.email).toBeTruthy()

    const mismatch = validateRegisterForm({
      name: 'Test',
      email: 'a@b.com',
      password: '123456',
      confirmPassword: '999999',
    })
    expect(mismatch.ok).toBe(false)
    expect(mismatch.fieldErrors.confirmPassword).toBeTruthy()
  })

  it('validateRegisterForm accepts a valid payload', () => {
    const result = validateRegisterForm({
      name: 'Ahmed Mohamed',
      email: 'ahmed@test.com',
      password: '123456',
      confirmPassword: '123456',
      phone: '01012345678',
      role: 'admin',
    })
    expect(result.ok).toBe(true)
  })

  it('buildRegisterUserPayload maps UI fields to API keys', () => {
    const payload = buildRegisterUserPayload(
      {
        name: 'Ahmed Mohamed',
        email: 'Ahmed@Test.com',
        phone: '01012345678',
        password: '123456',
        confirmPassword: '123456',
        role: 'admin',
      },
      { companyId: 2 },
    )

    expect(payload).toMatchObject({
      company_id: 2,
      full_name: 'Ahmed Mohamed',
      email: 'ahmed@test.com',
      phone: '01012345678',
      password: '123456',
      password_confirmation: '123456',
      role: 'admin',
      status: 'active',
    })
  })

  it('buildRegisterUserPayload maps lawyer and client roles', () => {
    expect(buildRegisterUserPayload({ name: 'L', email: 'l@t.com', password: '123456', confirmPassword: '123456', role: 'lawyer' }, { companyId: 2 }).role).toBe('lawyer')
    expect(buildRegisterUserPayload({ name: 'C', email: 'c@t.com', password: '123456', confirmPassword: '123456', role: 'client' }, { companyId: 2 }).role).toBe('secretary')
  })
})
