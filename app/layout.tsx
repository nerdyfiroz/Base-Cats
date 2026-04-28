import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Base Cats | Exclusive NFT Collection',
  description: 'Discover Base Cats, the most premium and exclusive feline NFT collection on the Base network.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="bg-effects">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
        </div>
        {children}
      </body>
    </html>
  )
}
