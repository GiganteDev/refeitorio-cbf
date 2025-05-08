"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import ReportSchedules from "./report-schedules"
import EmailSettings from "./email-settings"

export default function ReportManagement() {
  const [activeTab, setActiveTab] = useState("schedules")
  const { toast } = useToast()

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Gerenciamento de Relatórios</h2>
          <div className="flex items-center space-x-2">
            <Link href="/dashboard">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Dashboard
              </Button>
            </Link>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="schedules">Agendamentos</TabsTrigger>
            <TabsTrigger value="settings">Configurações de E-mail</TabsTrigger>
          </TabsList>

          <TabsContent value="schedules" className="space-y-4">
            <ReportSchedules />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <EmailSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
