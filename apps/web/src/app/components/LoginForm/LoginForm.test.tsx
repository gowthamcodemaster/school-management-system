/* eslint-disable prettier/prettier */
// apps/web/src/app/auth/login/_components/LoginForm/LoginForm.test.tsx
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoginForm } from './LoginForm'

// ── Mocks ──────────────────────────────────────────────────────────
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('../../../lib/hooks/useAuth', () => ({
  useLogin: jest.fn(),
}))

import { useLogin } from '../../../lib/hooks/useAuth'

const mockMutate = jest.fn()
const defaultUseMutation = {
  mutate: mockMutate,
  isPending: false,
  isError: false,
  error: null,
  data: undefined,
}

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useLogin as jest.Mock).mockReturnValue(defaultUseMutation)
  })

  // ── Rendering ──────────────────────────────────────────────────
  it('renders email input', () => {
    renderWithQuery(<LoginForm />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('renders password input', () => {
    renderWithQuery(<LoginForm />)
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
  })

  it('renders sign in button', () => {
    renderWithQuery(<LoginForm />)
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders forgot password link', () => {
    renderWithQuery(<LoginForm />)
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument()
  })

  it('renders logo', () => {
    renderWithQuery(<LoginForm />)
    expect(screen.getByTestId('logo')).toBeInTheDocument()
  })

  // ── Validation — TC-006, TC-007, TC-008 ───────────────────────
  it('TC-006: shows error when email is empty on submit', async () => {
    renderWithQuery(<LoginForm />)
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
    })
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('TC-007: shows error when password is empty on submit', async () => {
    renderWithQuery(<LoginForm />)
    await userEvent.type(screen.getByLabelText(/email/i), 'admin@test.com')
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByText('Password is required')).toBeInTheDocument()
    })
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('TC-008: shows error for invalid email format', async () => {
    renderWithQuery(<LoginForm />)
    await userEvent.type(screen.getByLabelText(/email/i), 'notanemail')
    await userEvent.type(screen.getByLabelText(/^password/i), 'Password123!')
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    })
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('shows error when password is less than 8 characters', async () => {
    renderWithQuery(<LoginForm />)
    await userEvent.type(screen.getByLabelText(/email/i), 'admin@test.com')
    await userEvent.type(screen.getByLabelText(/^password/i), 'short')
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
    })
  })

  // ── Submission — TC-001 ────────────────────────────────────────
  it('TC-001: calls login mutation with correct values on valid submit', async () => {
    renderWithQuery(<LoginForm />)
    await userEvent.type(screen.getByLabelText(/email/i), 'admin@vidyadhara.com')
    await userEvent.type(screen.getByLabelText(/^password/i), 'ValidPassword123!')
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        email: 'admin@vidyadhara.com',
        password: 'ValidPassword123!',
      })
    })
  })

  // ── Loading state — TC-002 ─────────────────────────────────────
  it('TC-002: shows loading state and disables button during submission', () => {
    ;(useLogin as jest.Mock).mockReturnValue({
      ...defaultUseMutation,
      isPending: true,
    })
    renderWithQuery(<LoginForm />)
    const button = screen.getByRole('button', { name: /signing in/i })
    expect(button).toBeDisabled()
  })

  // ── Error state — TC-004 ───────────────────────────────────────
  it('TC-004: shows error alert when login fails', () => {
    ;(useLogin as jest.Mock).mockReturnValue({
      ...defaultUseMutation,
      isError: true,
      error: new Error('Invalid credentials'),
    })
    renderWithQuery(<LoginForm />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
  })

  // ── Account locked — TC-009 ────────────────────────────────────
  it('TC-009: shows account locked message when account is locked', () => {
    ;(useLogin as jest.Mock).mockReturnValue({
      ...defaultUseMutation,
      isError: true,
      error: new Error('Account is locked due to too many failed attempts'),
    })
    renderWithQuery(<LoginForm />)
    expect(screen.getByText(/locked/i)).toBeInTheDocument()
  })

  // ── MFA required ───────────────────────────────────────────────
  it('calls onMfaRequired when server returns mfaRequired', async () => {
    const onMfaRequired = jest.fn()
    ;(useLogin as jest.Mock).mockReturnValue({
      ...defaultUseMutation,
      isError: false,
      data: { mfaRequired: true, mfaMethod: 'TOTP', mfaToken: 'partial-token' },
    })
    renderWithQuery(<LoginForm onMfaRequired={onMfaRequired} />)
  })
})
