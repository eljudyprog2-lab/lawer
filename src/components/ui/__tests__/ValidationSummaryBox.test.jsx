import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ValidationSummaryBox } from '../ValidationSummaryBox'

describe('ValidationSummaryBox', () => {
  it('renders nothing when errors is null or empty', () => {
    const { container } = render(<ValidationSummaryBox errors={null} />)
    expect(container.firstChild).toBeNull()

    const { container: emptyArr } = render(<ValidationSummaryBox errors={[]} />)
    expect(emptyArr.firstChild).toBeNull()

    const { container: emptyObj } = render(<ValidationSummaryBox errors={{}} />)
    expect(emptyObj.firstChild).toBeNull()
  })

  it('renders a single error message cleanly', () => {
    render(<ValidationSummaryBox errors="البريد الإلكتروني مطلوب" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('البريد الإلكتروني مطلوب')).toBeInTheDocument()
  })

  it('renders multiple errors as a bullet list', () => {
    const errors = {
      name: 'الاسم الكامل مطلوب',
      email: 'البريد الإلكتروني غير صالح',
      password: 'كلمة المرور يجب أن لا تقل عن 6 أحرف',
    }
    render(<ValidationSummaryBox errors={errors} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('الاسم الكامل مطلوب')).toBeInTheDocument()
    expect(screen.getByText('البريد الإلكتروني غير صالح')).toBeInTheDocument()
    expect(screen.getByText('كلمة المرور يجب أن لا تقل عن 6 أحرف')).toBeInTheDocument()
    const listItems = screen.getAllByRole('listitem')
    expect(listItems).toHaveLength(3)
  })

  it('filters out falsy and duplicate errors', () => {
    const errors = ['حقل مطلوب', '', null, 'حقل مطلوب', undefined]
    render(<ValidationSummaryBox errors={errors} />)
    expect(screen.getByText('حقل مطلوب')).toBeInTheDocument()
    expect(screen.queryByRole('list')).toBeNull() // single error after dedup
  })
})
