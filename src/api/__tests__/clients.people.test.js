import { describe, expect, it } from 'vitest'
import { validateClientForm, normalizeClient, buildClientPayload } from '../clients'

describe('People — clients validation & normalize', () => {
  it('rejects empty required fields', () => {
    const result = validateClientForm({ name: '', email: '', phone: '' })
    expect(result.ok).toBe(false)
    expect(result.fieldErrors.name).toBeTruthy()
  })

  it('rejects invalid email', () => {
    const result = validateClientForm({
      name: 'Ahmed',
      email: 'bad',
      phone: '01012345678',
    })
    expect(result.ok).toBe(false)
    expect(result.fieldErrors.email).toBeTruthy()
  })

  it('accepts valid payload', () => {
    const result = validateClientForm({
      name: 'Ahmed Mohamed',
      email: 'ahmed@test.com',
      phone: '01012345678',
      nationalId: '30201012345666',
      password: 'secret12',
    })
    expect(result.ok).toBe(true)
  })

  it('normalizeClient maps API fields including dates', () => {
    const n = normalizeClient({
      id: 1,
      company_id: 2,
      full_name: 'Ahmed Mohamed update',
      email: 'ahmedpdate@test.com',
      phone: '01012345666',
      national_id: '30201012345666',
      address: 'Cairo0',
      status: 'active',
      notes: 'VIP',
      created_at: '2026-07-15T08:40:29.000000Z',
      updated_at: '2026-07-15T12:02:54.000000Z',
    })
    expect(n.name).toBe('Ahmed Mohamed update')
    expect(n.nationalId).toBe('30201012345666')
    expect(n.status).toBe('نشط')
    expect(n.registeredAt).toContain('2026-07-15')
  })

  it('buildClientPayload uses API keys', () => {
    const payload = buildClientPayload(
      {
        name: 'Test',
        email: 't@test.com',
        phone: '010',
        nationalId: '123',
        address: 'A',
        status: 'نشط',
      },
      { companyId: 2 },
    )
    expect(payload).toMatchObject({
      company_id: 2,
      full_name: 'Test',
      email: 't@test.com',
      national_id: '123',
      status: 'active',
    })
  })
})
