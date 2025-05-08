import type React from "react"
import type { Metadata } from "next"
import Image from "next/image"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "Dashboard - CBF Refeitório",
  description: "Dashboard de análise de satisfação do refeitório da CBF",
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <>
      <div className="flex min-h-screen flex-col">
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <div className="bg-white rounded-full p-1 mr-4">
              <Image src="/logo-cbf.png" width={40} height={40} alt="CBF Logo" className="mx-auto" />
            </div>
            <div className="ml-auto flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">Departamento de Tecnologia da Informação</span>
            </div>
          </div>
        </div>
        {children}
      </div>
      <Toaster />
    </>
  )
}
