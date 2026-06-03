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

jest.mock('../../../../../lib/hooks/useAuth', () => ({
  useMfaVerify: jest.fn(),
  useSendOtp: jest.fn(),
}))

import { useMfaVerify, useSendOtp } from '../../../../../lib/hooks/useAuth'

const mockMutate = jest.fn()
const mockSendOtpMutate = jest.fn()

const defaultVerifyMutation = {
  mutate: mockMutate,
  isPending: false,
  isError: false,
  error: null,
}

const defaultSendOtpMutation = {
  mutate: mockSendOtpMutate,
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
    ;(useMfaVerify as jest.Mock).mockReturnValue(defaultVerifyMutation)
    ;(useSendOtp as jest.Mock).mockReturnValue(defaultSendOtpMutation)
  })

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

  it('TC-014: renders switch method button for TOTP', () => {
    renderWithQuery(<MfaForm {...defaultProps} mfaMethod="TOTP" />)
    expect(screen.getByRole('button', { name: /use email/i })).toBeInTheDocument()
  })

  it('TC-014: switches to EMAIL_OTP when switch button clicked', async () => {
    renderWithQuery(<MfaForm {...defaultProps} mfaMethod="TOTP" />)
    fireEvent.click(screen.getByRole('button', { name: /use email/i }))
    await waitFor(() => {
      expect(mockSendOtpMutate).toHaveBeenCalledWith({
        mfaToken: defaultProps.mfaToken,
      })
    })
  })

  it('TC-014: shows switch to TOTP button when on EMAIL_OTP', () => {
    renderWithQuery(<MfaForm {...defaultProps} mfaMethod="EMAIL_OTP" />)
    expect(screen.getByRole('button', { name: /use authenticator/i })).toBeInTheDocument()
  })

  it('TC-015: renders resend button when method is EMAIL_OTP', () => {
    renderWithQuery(<MfaForm {...defaultProps} mfaMethod="EMAIL_OTP" />)
    expect(screen.getByRole('button', { name: /resend/i })).toBeInTheDocument()
  })

  it('TC-015: calls sendOtp mutation when resend clicked', async () => {
    renderWithQuery(<MfaForm {...defaultProps} mfaMethod="EMAIL_OTP" />)
    fireEvent.click(screen.getByRole('button', { name: /resend/i }))
    await waitFor(() => {
      expect(mockSendOtpMutate).toHaveBeenCalledWith({
        mfaToken: defaultProps.mfaToken,
      })
    })
  })

  it('TC-022: disables resend button during cooldown', async () => {
    renderWithQuery(<MfaForm {...defaultProps} mfaMethod="EMAIL_OTP" />)
    fireEvent.click(screen.getByRole('button', { name: /resend/i }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /resend in/i })).toBeDisabled()
    })
  })

  it('TC-022: shows countdown on resend button', async () => {
    renderWithQuery(<MfaForm {...defaultProps} mfaMethod="EMAIL_OTP" />)
    fireEvent.click(screen.getByRole('button', { name: /resend/i }))
    await waitFor(() => {
      expect(screen.getByText(/resend in \d+s/i)).toBeInTheDocument()
    })
  })

  it('does not render resend button for TOTP', () => {
    renderWithQuery(<MfaForm {...defaultProps} mfaMethod="TOTP" />)
    expect(screen.queryByRole('button', { name: /resend/i })).not.toBeInTheDocument()
  })

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

  it('shows loading state during verification', () => {
    ;(useMfaVerify as jest.Mock).mockReturnValue({
      ...defaultVerifyMutation,
      isPending: true,
    })
    renderWithQuery(<MfaForm {...defaultProps} />)
    expect(screen.getByRole('button', { name: /verifying/i })).toBeDisabled()
  })

  it('TC-017: shows error alert when verification fails', () => {
    ;(useMfaVerify as jest.Mock).mockReturnValue({
      ...defaultVerifyMutation,
      isError: true,
      error: new Error('Invalid verification code'),
    })
    renderWithQuery(<MfaForm {...defaultProps} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Invalid verification code')).toBeInTheDocument()
  })

  it('calls onBack when back button is clicked', () => {
    const onBack = jest.fn()
    renderWithQuery(<MfaForm {...defaultProps} onBack={onBack} />)
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
