import type { Metadata } from 'next'
import { Montserrat, Ezra } from 'next/font/google'
import './globals.css'
import ClientLayout from '@/components/ClientLayout'

const primary = Montserrat({
  subsets: ['latin'],
  variable: '--font-primary',
  weight: ['400', '500', '600', '700'],
})

const display = Ezra({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Glicose AI',
  description: 'Gerenciamento inteligente de glicose',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${primary.variable} ${display.variable}`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}