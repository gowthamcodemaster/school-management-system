// apps/web/src/app/auth/login/_components/MfaEnrollment/MfaEnrollment.stories.tsx
import type { Meta, StoryObj } from '@storybook/nextjs'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MfaEnrollment } from './MfaEnrollment'

const meta = {
  title: 'Pages/Auth/MfaEnrollment',
  component: MfaEnrollment,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}
      >
        <Story />
      </QueryClientProvider>
    ),
  ],
  args: {
    accessToken: 'mock-access-token',
    onComplete: () => {},
    onSkip: () => {},
  },
} satisfies Meta<typeof MfaEnrollment>

export default meta
type Story = StoryObj<typeof meta>

// Idle state before the backend responds with QR code data.
export const Default: Story = {}

// Different access token — e.g. after a fresh login step.
export const WithDifferentToken: Story = {
  args: { accessToken: 'another-valid-token' },
}
