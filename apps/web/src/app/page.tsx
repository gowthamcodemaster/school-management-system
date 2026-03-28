import { Button } from '../components/Button'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-center text-center font-sans">
        <h1 className="mb-4 text-4xl font-bold">School Management System</h1>
        <p className="text-muted-foreground mb-8 text-xl">
          Production-grade platform built with Next.js 14, TypeScript, and Tailwind CSS
        </p>

        <div className="mb-12 flex justify-center gap-4">
          <Button variant="default" size="lg">
            Get Started
          </Button>
          <Button variant="outline" size="lg">
            View Documentation
          </Button>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="hover:border-primary rounded-lg border p-6 transition-colors">
            <h3 className="mb-2 text-xl font-semibold">📚 Student Management</h3>
            <p className="text-muted-foreground text-sm">
              Complete admission, attendance, and academic tracking system
            </p>
          </div>

          <div className="hover:border-primary rounded-lg border p-6 transition-colors">
            <h3 className="mb-2 text-xl font-semibold">🤖 AI-Powered</h3>
            <p className="text-muted-foreground text-sm">
              Automated timetable generation and exam seating arrangements
            </p>
          </div>

          <div className="hover:border-primary rounded-lg border p-6 transition-colors">
            <h3 className="mb-2 text-xl font-semibold">📊 Analytics</h3>
            <p className="text-muted-foreground text-sm">
              Real-time insights and comprehensive reporting dashboard
            </p>
          </div>
        </div>

        <div className="text-muted-foreground mt-12 text-sm">
          <p>Built with ❤️ using modern web technologies</p>
          <div className="mt-4 flex justify-center gap-4">
            <span className="bg-secondary rounded-full px-3 py-1">Next.js 14</span>
            <span className="bg-secondary rounded-full px-3 py-1">TypeScript</span>
            <span className="bg-secondary rounded-full px-3 py-1">Tailwind CSS</span>
            <span className="bg-secondary rounded-full px-3 py-1">Prisma</span>
          </div>
        </div>
      </div>
    </main>
  )
}
