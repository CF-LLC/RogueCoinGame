import type React from "react"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Web3Provider } from "@/contexts/web3-context"
import { Header } from "@/components/header"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata = {
  title: "RogueCoin - Crash Game",
  description: "On-chain crash game powered by RogueCoin (RGC)",
  other: {
    'Content-Security-Policy': process.env.NODE_ENV === 'development' 
      ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'; object-src 'none';"
      : "script-src 'self' 'unsafe-inline'; object-src 'none';",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}>
      <body suppressHydrationWarning={true}>
        <Web3Provider>
          <Header />
          <main className="min-h-screen bg-background">{children}</main>
        </Web3Provider>
      </body>
    </html>
  )
}
