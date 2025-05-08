"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Edit, Plus, Send, Clock } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import ReportScheduleDialog from "./report-schedule-dialog"

// Importar as funções de timezone
import { formatBrazilianDateTime } from "@/lib/timezone-config"

interface ReportSchedule {
  id: number
  name: string
  frequency: string
  day_of_week: number | null
  day_of_month: number | null
  hour: number
  minute: number
  recipients: string
  formats: string
  filters: string
  active: number
  created_at: string
  last_sent: string | null
}

export default function ReportSchedules() {
  const [schedules, setSchedules] = useState<ReportSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [currentSchedule, setCurrentSchedule] = useState<ReportSchedule | null>(null)
  const [sendingReport, setSendingReport] = useState<number | null>(null)
  const { toast } = useToast()

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/reports/schedules")
      if (!response.ok) throw new Error("Erro ao buscar agendamentos")
      const data = await response.json()
      setSchedules(data)
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de agendamentos.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [])

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover este agendamento?")) return

    try {
      const response = await fetch(`/api/reports/schedules/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao remover agendamento")
      }

      toast({
        title: "Sucesso",
        description: "Agendamento removido com sucesso.",
      })

      fetchSchedules()
    } catch (error) {
      console.error("Erro ao remover agendamento:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao remover agendamento.",
        variant: "destructive",
      })
    }
  }

  const handleToggleActive = async (id: number, active: boolean) => {
    try {
      const schedule = schedules.find((s) => s.id === id)
      if (!schedule) return

      const response = await fetch(`/api/reports/schedules/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...schedule,
          name: schedule.name,
          frequency: schedule.frequency,
          dayOfWeek: schedule.day_of_week,
          dayOfMonth: schedule.day_of_month,
          hour: schedule.hour,
          minute: schedule.minute,
          recipients: schedule.recipients,
          formats: schedule.formats,
          filters: schedule.filters,
          active: active ? 1 : 0,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao atualizar agendamento")
      }

      toast({
        title: "Sucesso",
        description: `Agendamento ${active ? "ativado" : "desativado"} com sucesso.`,
      })

      fetchSchedules()
    } catch (error) {
      console.error("Erro ao atualizar agendamento:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar agendamento.",
        variant: "destructive",
      })
    }
  }

  const handleSendNow = async (id: number) => {
    try {
      setSendingReport(id)
      const response = await fetch("/api/reports/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scheduleId: id,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao enviar relatório")
      }

      toast({
        title: "Sucesso",
        description: "Relatório enviado com sucesso.",
      })

      fetchSchedules()
    } catch (error) {
      console.error("Erro ao enviar relatório:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao enviar relatório.",
        variant: "destructive",
      })
    } finally {
      setSendingReport(null)
    }
  }

  const openEditDialog = (schedule: ReportSchedule) => {
    setCurrentSchedule(schedule)
    setShowEditDialog(true)
  }

  const formatFrequency = (schedule: ReportSchedule) => {
    switch (schedule.frequency) {
      case "daily":
        return "Diário"
      case "weekly": {
        const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
        return `Semanal (${days[schedule.day_of_week || 0]})`
      }
      case "monthly":
        return `Mensal (Dia ${schedule.day_of_month})`
      case "custom":
        return "Personalizado"
      default:
        return schedule.frequency
    }
  }

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
  }

  const formatFormats = (formats: string) => {
    return formats
      .split(",")
      .map((format) => format.toUpperCase())
      .join(", ")
  }

  // Atualizar a função formatLastSent para usar o timezone correto
  const formatLastSent = (lastSent: string | null) => {
    if (!lastSent) return "Nunca"
    return formatBrazilianDateTime(lastSent)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Agendamentos de Relatórios</CardTitle>
            <CardDescription>Configure o envio automático de relatórios por e-mail</CardDescription>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Agendamento
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-4">Carregando agendamentos...</p>
          ) : schedules.length === 0 ? (
            <p className="text-center py-4">Nenhum agendamento configurado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Frequência</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Destinatários</TableHead>
                  <TableHead>Formatos</TableHead>
                  <TableHead>Último Envio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">{schedule.name}</TableCell>
                    <TableCell>{formatFrequency(schedule)}</TableCell>
                    <TableCell>{formatTime(schedule.hour, schedule.minute)}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={schedule.recipients}>
                      {schedule.recipients}
                    </TableCell>
                    <TableCell>{formatFormats(schedule.formats)}</TableCell>
                    <TableCell>{formatLastSent(schedule.last_sent)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={schedule.active === 1}
                          onCheckedChange={(checked) => handleToggleActive(schedule.id, checked)}
                        />
                        <span>{schedule.active === 1 ? "Ativo" : "Inativo"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSendNow(schedule.id)}
                          disabled={sendingReport === schedule.id}
                          className="text-green-500 hover:text-green-700 hover:bg-green-100"
                          title="Enviar agora"
                        >
                          {sendingReport === schedule.id ? (
                            <Clock className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(schedule)}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-100"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-100"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para adicionar agendamento */}
      <ReportScheduleDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSave={fetchSchedules} />

      {/* Diálogo para editar agendamento */}
      {currentSchedule && (
        <ReportScheduleDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSave={fetchSchedules}
          schedule={currentSchedule}
        />
      )}
    </>
  )
}
