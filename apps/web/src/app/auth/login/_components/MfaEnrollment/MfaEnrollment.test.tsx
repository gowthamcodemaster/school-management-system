/* eslint-disable prettier/prettier */
// apps/web/src/app/auth/login/_components/MfaEnrollment/MfaEnrollment.test.tsx
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MfaEnrollment } from './MfaEnrollment'

// ── Mocks ──────────────────────────────────────────────────────────
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('../../../../../lib/hooks/useAuth', () => ({
  useMfaSetup: jest.fn(),
  useMfaSetupVerify: jest.fn(),
}))

import { useMfaSetup, useMfaSetupVerify } from '../../../../../lib/hooks/useAuth'

const mockSetupData = {
  secret: 'JBSWY3DPEHPK3PXP',
  qrCode: 'data:image/png;base64,abc123',
}

const defaultSetupMutation = {
  data: mockSetupData,
  isPending: false,
  isError: false,
  error: null,
  mutate: jest.fn(),
}

const defaultVerifyMutation = {
  mutate: jest.fn(),
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
  accessToken: 'valid-access-token',
  onComplete: jest.fn(),
  onSkip: jest.fn(),
}

describe('MfaEnrollment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useMfaSetup as jest.Mock).mockReturnValue(defaultSetupMutation)
    ;(useMfaSetupVerify as jest.Mock).mockReturnValue(defaultVerifyMutation)
  })

  // ── Rendering ──────────────────────────────────────────────────
  it('TC-016: renders the QR code image', () => {
    renderWithQuery(<MfaEnrollment {...defaultProps} />)
    const qrImage = screen.getByRole('img', { name: /qr code/i })
    expect(qrImage).toBeInTheDocument()
    expect(qrImage).toHaveAttribute('src', mockSetupData.qrCode)
  })

  it('TC-016: renders the TOTP secret for manual entry', () => {
    renderWithQuery(<MfaEnrollment {...defaultProps} />)
    expect(screen.getByText(mockSetupData.secret)).toBeInTheDocument()
  })

  it('renders setup instructions', () => {
    renderWithQuery(<MfaEnrollment {...defaultProps} />)
    expect(screen.getByText(/authenticator/i)).toBeInTheDocument()
  })

  it('renders verification code input', () => {
    renderWithQuery(<MfaEnrollment {...defaultProps} />)
    expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument()
  })

  it('renders verify button', () => {
    renderWithQuery(<MfaEnrollment {...defaultProps} />)
    expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument()
  })

  it('renders skip button', () => {
    renderWithQuery(<MfaEnrollment {...defaultProps} />)
    expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument()
  })

  // ── Loading state ──────────────────────────────────────────────
  it('shows loading state while fetching QR code', () => {
    ;(useMfaSetup as jest.Mock).mockReturnValue({
      ...defaultSetupMutation,
      data: undefined,
      isPending: true,
    })
    renderWithQuery(<MfaEnrollment {...defaultProps} />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  // ── Validation ─────────────────────────────────────────────────
  it('shows error when code is empty on submit', async () => {
    renderWithQuery(<MfaEnrollment {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /verify/i }))
    await waitFor(() => {
      expect(screen.getByText(/code is required/i)).toBeInTheDocument()
    })
    expect(defaultVerifyMutation.mutate).not.toHaveBeenCalled()
  })

  it('shows error when code is not 6 digits', async () => {
    renderWithQuery(<MfaEnrollment {...defaultProps} />)
    await userEvent.type(screen.getByLabelText(/verification code/i), '123')
    fireEvent.click(screen.getByRole('button', { name: /verify/i }))
    await waitFor(() => {
      expect(screen.getByText(/6 digits/i)).toBeInTheDocument()
    })
  })

  // ── Submission ─────────────────────────────────────────────────
  it('TC-016: calls verify mutation with correct values', async () => {
    renderWithQuery(<MfaEnrollment {...defaultProps} />)
    await userEvent.type(screen.getByLabelText(/verification code/i), '123456')
    fireEvent.click(screen.getByRole('button', { name: /verify/i }))
    await waitFor(() => {
      expect(defaultVerifyMutation.mutate).toHaveBeenCalledWith({
        code: '123456',
        accessToken: defaultProps.accessToken,
      })
    })
  })

  // ── Loading during verify ──────────────────────────────────────
  it('shows loading state during verification', () => {
    ;(useMfaSetupVerify as jest.Mock).mockReturnValue({
      ...defaultVerifyMutation,
      isPending: true,
    })
    renderWithQuery(<MfaEnrollment {...defaultProps} />)
    expect(screen.getByRole('button', { name: /verifying/i })).toBeDisabled()
  })

  // ── Error state ────────────────────────────────────────────────
  it('shows error alert when verification fails', () => {
    ;(useMfaSetupVerify as jest.Mock).mockReturnValue({
      ...defaultVerifyMutation,
      isError: true,
      error: new Error('Invalid verification code'),
    })
    renderWithQuery(<MfaEnrollment {...defaultProps} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Invalid verification code')).toBeInTheDocument()
  })

  // ── Copy secret ────────────────────────────────────────────────
  it('renders copy button for manual secret entry', () => {
    renderWithQuery(<MfaEnrollment {...defaultProps} />)
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument()
  })

  // ── Skip ───────────────────────────────────────────────────────
  it('calls onSkip when skip button is clicked', () => {
    const onSkip = jest.fn()
    renderWithQuery(<MfaEnrollment {...defaultProps} onSkip={onSkip} />)
    fireEvent.click(screen.getByRole('button', { name: /skip/i }))
    expect(onSkip).toHaveBeenCalledTimes(1)
  })

  // ── Success ────────────────────────────────────────────────────
  it('calls onComplete when verification succeeds', () => {
    const onComplete = jest.fn()
    ;(useMfaSetupVerify as jest.Mock).mockReturnValue({
      ...defaultVerifyMutation,
      isSuccess: true,
      data: { accessToken: 'full-token' },
    })
    renderWithQuery(<MfaEnrollment {...defaultProps} onComplete={onComplete} />)
    expect(onComplete).toHaveBeenCalled()
  })
})
