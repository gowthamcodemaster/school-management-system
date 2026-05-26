// apps/web/src/design-system/components/Alert/Alert.test.tsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Alert } from './Alert'

describe('Alert', () => {
  // ── Rendering ─────────────────────────────────────────────────
  it('renders alert with message', () => {
    render(<Alert message="Something went wrong" />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('has role="alert" for accessibility', () => {
    render(<Alert message="Error occurred" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('renders title when provided', () => {
    render(<Alert title="Login Failed" message="Invalid credentials" />)
    expect(screen.getByText('Login Failed')).toBeInTheDocument()
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
  })

  // ── Variants ──────────────────────────────────────────────────
  it('renders error variant by default', () => {
    const { container } = render(<Alert message="Error" />)
    expect(container.firstChild).toHaveClass('bg-destructive/10')
  })

  it('renders success variant correctly', () => {
    const { container } = render(<Alert variant="success" message="Success" />)
    expect(container.firstChild).toHaveClass('bg-green-50')
  })

  it('renders warning variant correctly', () => {
    const { container } = render(<Alert variant="warning" message="Warning" />)
    expect(container.firstChild).toHaveClass('bg-yellow-50')
  })

  it('renders info variant correctly', () => {
    const { container } = render(<Alert variant="info" message="Info" />)
    expect(container.firstChild).toHaveClass('bg-blue-50')
  })

  // ── Icon ──────────────────────────────────────────────────────
  it('renders an icon by default', () => {
    render(<Alert message="Error" />)
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument()
  })

  it('does not render icon when showIcon is false', () => {
    render(<Alert message="Error" showIcon={false} />)
    expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument()
  })

  // ── Not rendered ──────────────────────────────────────────────
  it('does not render when message is empty', () => {
    const { container } = render(<Alert message="" />)
    expect(container.firstChild).toBeNull()
  })
})
