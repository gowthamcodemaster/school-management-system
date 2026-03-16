import { Button } from '../components/Button'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-sans text-center">
        <h1 className="text-4xl font-bold mb-4">
          School Management System
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Production-grade platform built with Next.js 14, TypeScript, and Tailwind CSS
        </p>
        
        <div className="flex gap-4 justify-center mb-12">
          <Button variant="default" size="lg">
            Get Started
          </Button>
          <Button variant="outline" size="lg">
            View Documentation
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 border rounded-lg hover:border-primary transition-colors">
            <h3 className="text-xl font-semibold mb-2">📚 Student Management</h3>
            <p className="text-sm text-muted-foreground">
              Complete admission, attendance, and academic tracking system
            </p>
          </div>
          
          <div className="p-6 border rounded-lg hover:border-primary transition-colors">
            <h3 className="text-xl font-semibold mb-2">🤖 AI-Powered</h3>
            <p className="text-sm text-muted-foreground">
              Automated timetable generation and exam seating arrangements
            </p>
          </div>
          
          <div className="p-6 border rounded-lg hover:border-primary transition-colors">
            <h3 className="text-xl font-semibold mb-2">📊 Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Real-time insights and comprehensive reporting dashboard
            </p>
          </div>
        </div>

        <div className="mt-12 text-sm text-muted-foreground">
          <p>Built with ❤️ using modern web technologies</p>
          <div className="flex gap-4 justify-center mt-4">
            <span className="px-3 py-1 bg-secondary rounded-full">Next.js 14</span>
            <span className="px-3 py-1 bg-secondary rounded-full">TypeScript</span>
            <span className="px-3 py-1 bg-secondary rounded-full">Tailwind CSS</span>
            <span className="px-3 py-1 bg-secondary rounded-full">Prisma</span>
          </div>
        </div>
      </div>
    </main>
  )
}