// apps/web/src/design-system/components/Alert/Alert.stories.tsx
import type { Meta, StoryObj } from '@storybook/nextjs'
import { Alert } from './Alert'

const meta = {
  title: 'Design System/Alert',
  component: Alert,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '420px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const ErrorObj: Story = {
  args: {
    variant: 'error',
    message: 'Invalid email or password. Please try again.',
  },
}

export const ErrorWithTitle: Story = {
  args: {
    variant: 'error',
    title: 'Login Failed',
    message:
      'Your account has been locked after 5 failed attempts. Please try again in 15 minutes.',
  },
}

export const Success: Story = {
  args: {
    variant: 'success',
    message: 'Password reset email sent successfully.',
  },
}

export const Warning: Story = {
  args: {
    variant: 'warning',
    message: 'Your session will expire in 5 minutes.',
  },
}

export const Info: Story = {
  args: {
    variant: 'info',
    message: 'You must complete MFA verification to continue.',
  },
}

export const NoIcon: Story = {
  args: {
    variant: 'error',
    message: 'Something went wrong.',
    showIcon: false,
  },
}
