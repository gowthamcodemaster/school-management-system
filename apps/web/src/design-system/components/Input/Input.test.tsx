// apps/web/src/design-system/components/Input/Input.test.tsx
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Input } from './Input'

describe('Input', () => {
  // ── Rendering ────────────────────────────────────────────────
  it('renders an input element', () => {
    render(<Input data-testid="input" />)
    expect(screen.getByTestId('input')).toBeInTheDocument()
  })

  it('renders with a label when provided', () => {
    render(<Input label="Email address" />)
    expect(screen.getByText('Email address')).toBeInTheDocument()
  })

  it('renders label associated with input via htmlFor', () => {
    render(<Input id="email" label="Email address" />)
    const label = screen.getByText('Email address')
    expect(label).toHaveAttribute('for', 'email')
  })

  it('renders with placeholder text', () => {
    render(<Input placeholder="Enter your email" />)
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
  })

  it('renders with a helper text when provided', () => {
    render(<Input helperText="We will never share your email" />)
    expect(screen.getByText('We will never share your email')).toBeInTheDocument()
  })

  // ── Error state ──────────────────────────────────────────────
  it('renders error message when error prop is provided', () => {
    render(<Input error="Email is required" />)
    expect(screen.getByText('Email is required')).toBeInTheDocument()
  })

  it('applies error styling when error prop is provided', () => {
    render(<Input data-testid="input" error="Required" />)
    const input = screen.getByTestId('input')
    expect(input).toHaveClass('border-destructive')
  })

  it('shows error icon when error prop is provided', () => {
    render(<Input error="Required" data-testid="input" />)
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument()
  })

  it('does not render error message when error is not provided', () => {
    render(<Input data-testid="input" />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  // ── Password type ─────────────────────────────────────────────
  it('renders password toggle button when type is password', () => {
    render(<Input type="password" />)
    expect(screen.getByRole('button', { name: /show password/i })).toBeInTheDocument()
  })

  it('toggles password visibility when toggle button is clicked', () => {
    render(<Input type="password" data-testid="input" />)
    const input = screen.getByTestId('input')
    const toggle = screen.getByRole('button', { name: /show password/i })

    expect(input).toHaveAttribute('type', 'password')
    fireEvent.click(toggle)
    expect(input).toHaveAttribute('type', 'text')
    fireEvent.click(toggle)
    expect(input).toHaveAttribute('type', 'password')
  })

  // ── Disabled state ────────────────────────────────────────────
  it('is disabled when disabled prop is provided', () => {
    render(<Input data-testid="input" disabled />)
    expect(screen.getByTestId('input')).toBeDisabled()
  })

  // ── Required ──────────────────────────────────────────────────
  it('shows required indicator when required prop is provided', () => {
    render(<Input label="Email" required />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  // ── User interaction ──────────────────────────────────────────
  it('calls onChange when user types', () => {
    const handleChange = jest.fn()
    render(<Input data-testid="input" onChange={handleChange} />)
    fireEvent.change(screen.getByTestId('input'), { target: { value: 'test@email.com' } })
    expect(handleChange).toHaveBeenCalledTimes(1)
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>()
    render(<Input ref={ref} data-testid="input" />)
    expect(ref.current).toBe(screen.getByTestId('input'))
  })
})
