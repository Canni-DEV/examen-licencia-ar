import { ReactNode } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
      <Footer />
    </div>
  )
}
