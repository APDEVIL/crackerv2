import type { Metadata } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { Toaster } from 'sonner'
import { StoreProvider } from '@/lib/store'
import { TRPCReactProvider } from '@/trpc/react'
import '@/styles/globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['700', '900'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500'],
})

export const metadata: Metadata = {
  title: {
    default: 'DS Cracker — Cracker Market',
    template: '%s | DS Cracker',
  },
  description: 'Premium crackers for Diwali. Safe, vibrant, unforgettable.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="min-h-screen bg-[#faf7f4] font-sans antialiased">
        <TRPCReactProvider>
          <StoreProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                classNames: {
                  toast: 'font-sans text-sm',
                },
              }}
            />
          </StoreProvider>
        </TRPCReactProvider>
      </body>
    </html>
  )
}
