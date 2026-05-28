/* eslint-disable prettier/prettier */
// apps/web/src/app/auth/login/_components/MfaForm/MfaForm.test.tsx
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MfaForm } from './MfaForm'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('../../../lib/hooks/useAuth', () => ({
  useMfaVerify: jest.fn(),
}))

import { useMfaVerify } from '../../../lib/hooks/useAuth'

const mockMutate = jest.fn()
const defaultUseMutation = {
  mutate: mockMutate,
  isPending: false,
  isError: false,
  error: null,
}

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

const defaultProps = {
  mfaToken: 'partial-token-123',
  mfaMethod: 'TOTP' as const,
  onBack: jest.fn(),
}

describe('MfaForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useMfaVerify as jest.Mock).mockReturnValue(defaultUseMutation)
  })

  // ── Rendering ──────────────────────────────────────────────────
  it('renders MFA code input', () => {
    renderWithQuery(<MfaForm {...defaultProps} />)
    expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument()
  })

  it('renders verify button', () => {
    renderWithQuery(<MfaForm {...defaultProps} />)
    expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument()
  })

  it('renders back button', () => {
    renderWithQuery(<MfaForm {...defaultProps} />)
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
  })

  it('shows TOTP instructions when method is TOTP', () => {
    renderWithQuery(<MfaForm {...defaultProps} mfaMethod="TOTP" />)
    expect(screen.getByText(/authenticator app/i)).toBeInTheDocument()
  })

  it('shows email OTP instructions when method is EMAIL_OTP', () => {
    renderWithQuery(<MfaForm {...defaultProps} mfaMethod="EMAIL_OTP" />)
    expect(screen.getByText(/email/i)).toBeInTheDocument()
  })

  // ── Validation — TC-017, TC-019 ────────────────────────────────
  it('TC-017: shows error when code is empty on submit', async () => {
    renderWithQuery(<MfaForm {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /verify/i }))
    await waitFor(() => {
      expect(screen.getByText(/code is required/i)).toBeInTheDocument()
    })
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('shows error when code is not 6 digits', async () => {
    renderWithQuery(<MfaForm {...defaultProps} />)
    await userEvent.type(screen.getByLabelText(/verification code/i), '123')
    fireEvent.click(screen.getByRole('button', { name: /verify/i }))
    await waitFor(() => {
      expect(screen.getByText(/6 digits/i)).toBeInTheDocument()
    })
  })

  it('shows error when code contains non-numeric characters', async () => {
    renderWithQuery(<MfaForm {...defaultProps} />)
    await userEvent.type(screen.getByLabelText(/verification code/i), 'abcdef')
    fireEvent.click(screen.getByRole('button', { name: /verify/i }))
    await waitFor(() => {
      expect(screen.getByText(/only numbers/i)).toBeInTheDocument()
    })
  })

  // ── Submission ─────────────────────────────────────────────────
  it('calls verify mutation with correct values', async () => {
    renderWithQuery(<MfaForm {...defaultProps} />)
    await userEvent.type(screen.getByLabelText(/verification code/i), '123456')
    fireEvent.click(screen.getByRole('button', { name: /verify/i }))
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        code: '123456',
        mfaToken: 'partial-token-123',
        method: 'TOTP',
      })
    })
  })

  // ── Loading state ──────────────────────────────────────────────
  it('shows loading state during verification', () => {
    ;(useMfaVerify as jest.Mock).mockReturnValue({
      ...defaultUseMutation,
      isPending: true,
    })
    renderWithQuery(<MfaForm {...defaultProps} />)
    expect(screen.getByRole('button', { name: /verifying/i })).toBeDisabled()
  })

  // ── Error state — TC-017 ───────────────────────────────────────
  it('TC-017: shows error alert when verification fails', () => {
    ;(useMfaVerify as jest.Mock).mockReturnValue({
      ...defaultUseMutation,
      isError: true,
      error: new Error('Invalid verification code'),
    })
    renderWithQuery(<MfaForm {...defaultProps} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Invalid verification code')).toBeInTheDocument()
  })

  // ── Back button ────────────────────────────────────────────────
  it('calls onBack when back button is clicked', () => {
    const onBack = jest.fn()
    renderWithQuery(<MfaForm {...defaultProps} onBack={onBack} />)
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
