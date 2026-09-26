import { describe, it, expect } from 'vitest'
import { apiRules } from '../apiRules'
import {
  validateField,
  validateLoginIdentifier,
  validateLoginPassword,
  validateLoginRole,
  sanitizeNumeric,
  enforceMaxLength,
} from '../validators'

describe('Validators Unit Tests (driven by apiRules)', () => {
  describe('validateField - General Rules', () => {
    const sampleRule = {
      required: true,
      min: 3,
      max: 10,
      pattern: /^[a-z]+$/,
      messages: {
        required: 'مطلوب',
        min: 'أقل من 3',
        max: 'أكثر من 10',
        invalid: 'غير صالح',
      },
    }

    it('returns error when required field is empty or whitespace', () => {
      expect(validateField('', sampleRule)).toBe('مطلوب')
      expect(validateField('   ', sampleRule)).toBe('مطلوب')
      expect(validateField(null, sampleRule)).toBe('مطلوب')
      expect(validateField(undefined, sampleRule)).toBe('مطلوب')
    })

    it('returns null when optional field is empty', () => {
      const optionalRule = { ...sampleRule, required: false }
      expect(validateField('', optionalRule)).toBeNull()
      expect(validateField(null, optionalRule)).toBeNull()
    })

    it('returns error when value is below min length', () => {
      expect(validateField('ab', sampleRule)).toBe('أقل من 3')
    })

    it('returns error when value is above max length', () => {
      expect(validateField('abcdefghijk', sampleRule)).toBe('أكثر من 10')
    })

    it('returns error when value does not match regex pattern', () => {
      expect(validateField('12345', sampleRule)).toBe('غير صالح')
    })

    it('returns null when value satisfies all rules', () => {
      expect(validateField('valid', sampleRule)).toBeNull()
    })
  })

  describe('Login Field Validators', () => {
    it('validates login identifier (required, min 3, max 255)', () => {
      expect(validateLoginIdentifier('')).toBe(apiRules.login.login.messages.required)
      expect(validateLoginIdentifier('a')).toBe(apiRules.login.login.messages.min)
      expect(validateLoginIdentifier('a'.repeat(256))).toBe(apiRules.login.login.messages.max)
      expect(validateLoginIdentifier('admin@test.com')).toBeNull()
      expect(validateLoginIdentifier('01012345678')).toBeNull()
    })

    it('validates login password (required, min 6, max 100)', () => {
      expect(validateLoginPassword('')).toBe(apiRules.login.password.messages.required)
      expect(validateLoginPassword('12345')).toBe(apiRules.login.password.messages.min)
      expect(validateLoginPassword('p'.repeat(101))).toBe(apiRules.login.password.messages.max)
      expect(validateLoginPassword('123456')).toBeNull()
      expect(validateLoginPassword('strongPass@2026')).toBeNull()
    })

    it('validates login role (allowed values)', () => {
      expect(validateLoginRole('')).toBe(apiRules.login.role.messages.required)
      expect(validateLoginRole('superadmin')).toBe(apiRules.login.role.messages.invalid)
      expect(validateLoginRole('admin')).toBeNull()
      expect(validateLoginRole('lawyer')).toBeNull()
      expect(validateLoginRole('client')).toBeNull()
    })
  })

  describe('Numeric and Formatting Helpers', () => {
    it('sanitizeNumeric strips non-digits and enforces max length', () => {
      expect(sanitizeNumeric('abc010-1234 5678xyz', 11)).toBe('01012345678')
      expect(sanitizeNumeric('12345678901234567890', 5)).toBe('12345')
      expect(sanitizeNumeric(null, 5)).toBe('')
    })

    it('enforceMaxLength cuts text strictly to max length', () => {
      expect(enforceMaxLength('hello world', 5)).toBe('hello')
      expect(enforceMaxLength('test', 10)).toBe('test')
      expect(enforceMaxLength(null, 5)).toBe('')
    })

    it('validates integer and number types', () => {
      const intRule = { required: true, type: 'integer', messages: { invalid: 'رقم غير صحيح' } }
      expect(validateField('abc', intRule)).toBe('رقم غير صحيح')
      expect(validateField('12.5', intRule)).toBe('رقم غير صحيح')
      expect(validateField('15', intRule)).toBeNull()

      const doubleRule = { required: true, type: 'double', messages: { invalid: 'قيمة غير صحيحة' } }
      expect(validateField('xyz', doubleRule)).toBe('قيمة غير صحيحة')
      expect(validateField('150.75', doubleRule)).toBeNull()
    })
  })
})
