import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { TimezoneProvider } from "@/contexts/timezone-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "CBF - Pesquisa de Satisfação",
  description: "Sistema de pesquisa de satisfação para refeitórios da CBF",
    generator: 'v0.dev',
  favicon: "/favicon.ico",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/logo-cbf.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/logo-cbf.png" />
        <meta name="theme-color" content="#ffffff" />
      </head>

      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <TimezoneProvider>
            {children}
            <Toaster />
          </TimezoneProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}


import './globals.css'