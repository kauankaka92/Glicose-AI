import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Glicose AI',
  description: 'Sistema de monitoramento de glicose com IA',
  manifest: '/manifest.json',
  themeColor: '#007aff',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Glicose AI',
  },
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}