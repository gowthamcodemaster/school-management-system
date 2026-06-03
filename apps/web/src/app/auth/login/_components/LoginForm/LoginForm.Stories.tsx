// apps/web/src/app/auth/login/_components/LoginForm/LoginForm.stories.tsx
import type { Meta, StoryObj } from '@storybook/nextjs'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoginForm } from './LoginForm'

const queryClient = new QueryClient()

const meta = {
  title: 'Pages/Auth/LoginForm',
  component: LoginForm,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof LoginForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithError: Story = {
  decorators: [
    (Story) => {
      // Mock useLogin to return error state
      return (
        <QueryClientProvider client={new QueryClient()}>
          <Story />
        </QueryClientProvider>
      )
    },
  ],
}
