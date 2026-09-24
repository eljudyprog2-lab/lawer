import { beforeEach, describe, expect, it, vi } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import { apiClient } from '../client'
import {
  buildCompanyFormData,
  createCompany,
  deleteCompany,
  fetchCompanies,
  fetchCompany,
  updateCompany,
} from '../companies'

const mock = new MockAdapter(apiClient)

const sampleCompany = {
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

describe('companies service', () => {
  beforeEach(() => {
    mock.reset()
  })

  it('fetchCompanies returns list from API response', async () => {
    mock.onGet('/companies').reply(200, { status: true, data: [sampleCompany] })
    const list = await fetchCompanies()
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('Law Office three')
    expect(list[0].subscription_plan).toBe('professional')
  })

  it('fetchCompany returns a single record', async () => {
    mock.onGet('/companies/4').reply(200, { status: true, data: sampleCompany })
    const company = await fetchCompany(4)
    expect(company.id).toBe(4)
    expect(company.email).toBe('lawofficethree@test.com')
  })

  it('createCompany posts multipart FormData with required fields', async () => {
    mock.onPost('/companies').reply((config) => {
      expect(config.data).toBeInstanceOf(FormData)
      expect(config.data.get('name')).toBe('New Firm')
      expect(config.data.get('email')).toBe('new@firm.com')
      expect(config.data.get('subscription_plan')).toBe('basic')
      return [201, { status: true, data: { ...sampleCompany, id: 99, name: 'New Firm' } }]
    })

    const result = await createCompany({
      name: 'New Firm',
      email: 'new@firm.com',
      phone: '01000000000',
      address: 'Riyadh',
      subscription_plan: 'basic',
      subscription_start: '2026-01-01',
      subscription_end: '2027-01-01',
      status: 'active',
    })

    expect(result?.data?.id ?? result?.id).toBe(99)
  })

  it('updateCompany sends PUT method spoofing', async () => {
    mock.onPost('/companies/4').reply((config) => {
      expect(config.data).toBeInstanceOf(FormData)
      expect(config.data.get('_method')).toBe('PUT')
      expect(config.data.get('name')).toBe('Updated Firm')
      return [200, { status: true, data: { ...sampleCompany, name: 'Updated Firm' } }]
    })

    const result = await updateCompany(4, {
      name: 'Updated Firm',
      email: sampleCompany.email,
      phone: sampleCompany.phone,
      address: sampleCompany.address,
      subscription_plan: sampleCompany.subscription_plan,
      subscription_start: '2026-07-15',
      subscription_end: '2027-07-15',
      status: 'active',
    })

    expect(result?.data?.name ?? result?.name).toBe('Updated Firm')
  })

  it('deleteCompany calls DELETE /companies/{id}', async () => {
    mock.onDelete('/companies/4').reply(200, { status: true })
    const result = await deleteCompany(4)
    expect(result.status).toBe(true)
  })

  it('buildCompanyFormData omits logo unless File provided', () => {
    const withoutLogo = buildCompanyFormData({
      name: 'A',
      email: 'a@b.com',
      phone: '1',
      address: 'x',
      subscription_plan: 'trial',
      subscription_start: '2026-01-01',
      subscription_end: '2026-02-01',
      status: 'active',
    })
    expect(withoutLogo.has('logo')).toBe(false)

    const file = new File(['x'], 'logo.png', { type: 'image/png' })
    const withLogo = buildCompanyFormData({
      name: 'A',
      email: 'a@b.com',
      phone: '1',
      address: 'x',
      subscription_plan: 'trial',
      subscription_start: '2026-01-01',
      subscription_end: '2026-02-01',
      status: 'active',
      logo: file,
    })
    expect(withLogo.get('logo')).toBeInstanceOf(File)
  })
})
