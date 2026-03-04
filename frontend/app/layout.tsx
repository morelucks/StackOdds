import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Providers } from "@/components/providers/providers"
import { BottomNav } from "@/components/layout/bottom-nav"
import { Footer } from "@/components/layout/footer"

export const metadata: Metadata = {
  title: "StackOdds | The World's Largest Prediction Market",
  description: "Trade on real-world events with StackOdds - the world's largest prediction market platform",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
  other: {
    "talentapp:project_verification": "a976751c9979f2970e0e58cbbd230bb55b1043dab1e9e5940c52abf032dbc1e12a0587ac4dced8739e8e16c23000ad35b58564b350ec4bc06d19b0b493a58f96",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased pb-24 md:pb-0`}>
        <Providers>
          {children}
          <Footer />
          <BottomNav />
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
