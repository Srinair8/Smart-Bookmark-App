import { Toaster } from 'react-hot-toast'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Smart Bookmarks',
  description: 'Your personal bookmark manager',
}
 
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
return (
  <html lang="en">
    <body className="min-h-screen bg-gray-50">
      {children}
      <Toaster position="bottom-right" />
    </body>
  </html>
)
}