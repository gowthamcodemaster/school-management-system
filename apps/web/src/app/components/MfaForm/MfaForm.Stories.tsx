/* eslint-disable prettier/prettier */
// apps/web/src/app/auth/login/_components/MfaForm/MfaForm.stories.tsx
import type { Meta, StoryObj } from '@storybook/nextjs'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MfaForm } from './MfaForm'

const meta2 = {
  title: 'Pages/Auth/MfaForm',
  component: MfaForm,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient()}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  args: {
    mfaToken: 'mock-token-123',
    onBack: () => {},
  },
} satisfies Meta<typeof MfaForm>

export default meta2
type Story2 = StoryObj<typeof meta2>

export const Totp: Story2 = {
  args: { mfaMethod: 'TOTP' },
}

export const EmailOtp: Story2 = {
  args: { mfaMethod: 'EMAIL_OTP' },
}
