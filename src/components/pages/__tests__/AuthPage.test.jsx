import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MockAdapter from 'axios-mock-adapter'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { apiClient } from '../../../api/client'
import { createTestQueryClient } from '../../../test/testUtils'
import { AuthProvider } from '../../../context/AuthContext'
import AuthPage from '../AuthPage'
import { apiRules } from '../../../validation/apiRules'

const mock = new MockAdapter(apiClient)

function renderAuthPage() {
  localStorage.clear()
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/" element={<div data-testid="home-page">Home</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('AuthPage Login Component Tests', () => {
  beforeEach(() => {
    mock.reset()
    localStorage.clear()
  })

  it('renders login form inputs with correct maxLength and disabled submit button when empty', () => {
    renderAuthPage()

    const loginInput = screen.getByPlaceholderText('admin@test.com')
    const passwordInput = screen.getByPlaceholderText('••••••••')
    const submitBtn = screen.getByRole('button', { name: /دخول/i })

    expect(loginInput).toBeInTheDocument()
    expect(passwordInput).toBeInTheDocument()

    // Enforce maxLength
    expect(loginInput).toHaveAttribute('maxLength', String(apiRules.login.login.max))
    expect(passwordInput).toHaveAttribute('maxLength', String(apiRules.login.password.max))

    // Button disabled when empty
    expect(submitBtn).toBeDisabled()
  })

  it('shows error state when password is less than 6 characters on blur', async () => {
    renderAuthPage()

    const passwordInput = screen.getByPlaceholderText('••••••••')

    fireEvent.change(passwordInput, { target: { value: '123' } })
    fireEvent.blur(passwordInput)

    await waitFor(() => {
      expect(passwordInput).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByText(apiRules.login.password.messages.min)).toBeInTheDocument()
    })
  })

  it('enables submit button when valid inputs are entered, and successfully logs in', async () => {
    mock.onPost('/login').reply(200, {
      status: true,
      token: 'jwt_token_mock_123',
      company_id: 2,
      user: {
        id: 1,
        full_name: 'أحمد علي',
        email: 'admin@test.com',
        role: 'admin',
        company_id: 2,
      },
    })

    renderAuthPage()

    const loginInput = screen.getByPlaceholderText('admin@test.com')
    const passwordInput = screen.getByPlaceholderText('••••••••')
    const submitBtn = screen.getByRole('button', { name: /دخول/i })

    fireEvent.change(loginInput, { target: { value: 'admin@test.com' } })
    fireEvent.change(passwordInput, { target: { value: '123456' } })

    await waitFor(() => {
      expect(submitBtn).not.toBeDisabled()
    })

    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mock.history.post.length).toBe(1)
      expect(JSON.parse(mock.history.post[0].data)).toEqual({
        login: 'admin@test.com',
        password: '123456',
        role: 'admin',
      })
      expect(screen.getByTestId('home-page')).toBeInTheDocument()
    })
  })

  it('displays server error banner when API returns 401 wrong credentials', async () => {
    mock.onPost('/login').reply(401, {
      status: false,
      message: 'بيانات تسجيل الدخول أو نوع الحساب غير صحيح',
    })

    renderAuthPage()

    const loginInput = screen.getByPlaceholderText('admin@test.com')
    const passwordInput = screen.getByPlaceholderText('••••••••')
    const submitBtn = screen.getByRole('button', { name: /دخول/i })

    fireEvent.change(loginInput, { target: { value: 'wrong@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongPass' } })

    await waitFor(() => {
      expect(submitBtn).not.toBeDisabled()
    })

    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('بيانات تسجيل الدخول أو نوع الحساب غير صحيح')
    })
  })

  it('toggles password visibility between password and text when clicking eye button', () => {
    renderAuthPage()

    const passwordInput = screen.getByPlaceholderText('••••••••')
    const toggleBtn = screen.getByRole('button', { name: /إظهار كلمة المرور/i })

    expect(passwordInput).toHaveAttribute('type', 'password')

    fireEvent.click(toggleBtn)
    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: /إخفاء كلمة المرور/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /إخفاء كلمة المرور/i }))
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(screen.getByRole('button', { name: /إظهار كلمة المرور/i })).toBeInTheDocument()
  })
})

