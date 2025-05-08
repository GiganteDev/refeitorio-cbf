"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { FilterDialog } from "@/components/dashboard/filter-dialog"

interface ReportScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
  schedule?: any
}

export default function ReportScheduleDialog({ open, onOpenChange, onSave, schedule }: ReportScheduleDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    frequency: "daily",
    dayOfWeek: 1, // Segunda-feira
    dayOfMonth: 1,
    hour: 8,
    minute: 0,
    recipients: "",
    formats: "xlsx,csv,png",
    filters: "{}",
    active: true,
    includeDashboardScreenshot: true, // Nova opção para incluir screenshot do dashboard
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedFormats, setSelectedFormats] = useState({
    xlsx: true,
    csv: true,
    png: true,
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Preencher formulário com dados do agendamento existente
  useEffect(() => {
    if (schedule) {
      setFormData({
        name: schedule.name,
        frequency: schedule.frequency,
        dayOfWeek: schedule.day_of_week !== null ? schedule.day_of_week : 1,
        dayOfMonth: schedule.day_of_month !== null ? schedule.day_of_month : 1,
        hour: schedule.hour,
        minute: schedule.minute,
        recipients: schedule.recipients,
        formats: schedule.formats,
        filters: schedule.filters,
        active: schedule.active === 1,
        includeDashboardScreenshot: schedule.include_dashboard_screenshot === 1,
      })

      // Atualizar formatos selecionados
      const formats = schedule.formats.split(",")
      setSelectedFormats({
        xlsx: formats.includes("xlsx"),
        csv: formats.includes("csv"),
        png: formats.includes("png"),
      })
    } else {
      // Resetar formulário para valores padrão
      setFormData({
        name: "",
        frequency: "daily",
        dayOfWeek: 1,
        dayOfMonth: 1,
        hour: 8,
        minute: 0,
        recipients: "",
        formats: "xlsx,csv,png",
        filters: "{}",
        active: true,
        includeDashboardScreenshot: true,
      })
      setSelectedFormats({
        xlsx: true,
        csv: true,
        png: true,
      })
    }
  }, [schedule, open])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (name: string, value: string) => {
    const numValue = Number.parseInt(value, 10)
    if (!isNaN(numValue)) {
      setFormData((prev) => ({ ...prev, [name]: numValue }))
    }
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleFormatChange = (format: string, checked: boolean) => {
    setSelectedFormats((prev) => ({ ...prev, [format]: checked }))

    // Atualizar string de formatos
    const newFormats = { ...selectedFormats, [format]: checked }
    const formatString = Object.entries(newFormats)
      .filter(([_, isSelected]) => isSelected)
      .map(([format]) => format)
      .join(",")

    setFormData((prev) => ({ ...prev, formats: formatString }))
  }

  // Update the handleApplyFilters function to ensure it properly sets the filters
  const handleApplyFilters = (filters: any) => {
    console.log("Applying filters:", filters)
    setFormData((prev) => ({ ...prev, filters: JSON.stringify(filters) }))
  }

  // Atualizar a função handleSubmit para incluir o timezone
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validar dados
      if (!formData.name.trim()) {
        throw new Error("Nome é obrigatório")
      }

      if (!formData.recipients.trim()) {
        throw new Error("Destinatários são obrigatórios")
      }

      // Validar e-mails
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const emails = formData.recipients.split(",").map((email) => email.trim())
      const invalidEmails = emails.filter((email) => !emailRegex.test(email))

      if (invalidEmails.length > 0) {
        throw new Error(`E-mails inválidos: ${invalidEmails.join(", ")}`)
      }

      // Validar formatos
      if (!formData.formats) {
        throw new Error("Selecione pelo menos um formato")
      }

      // Preparar dados para envio
      const payload = {
        name: formData.name,
        frequency: formData.frequency,
        dayOfWeek: formData.frequency === "weekly" ? formData.dayOfWeek : null,
        dayOfMonth: formData.frequency === "monthly" ? formData.dayOfMonth : null,
        hour: formData.hour,
        minute: formData.minute,
        recipients: formData.recipients,
        formats: formData.formats,
        filters: formData.filters,
        active: formData.active ? 1 : 0,
        includeDashboardScreenshot: formData.includeDashboardScreenshot ? 1 : 0,
        timezone: "America/Sao_Paulo", // Adicionar o timezone
      }

      // Enviar requisição
      const url = schedule ? `/api/reports/schedules/${schedule.id}` : "/api/reports/schedules"

      const method = schedule ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao salvar agendamento")
      }

      toast({
        title: "Sucesso",
        description: `Agendamento ${schedule ? "atualizado" : "adicionado"} com sucesso.`,
      })

      onOpenChange(false)
      onSave()
    } catch (error) {
      console.error("Erro ao salvar agendamento:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar agendamento.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Parse the filters JSON string to an object for the FilterDialog
  const getParsedFilters = () => {
    try {
      const parsedFilters = JSON.parse(formData.filters || "{}")

      // Ensure the ratings object exists with default values
      if (!parsedFilters.ratings) {
        parsedFilters.ratings = {
          otimo: true,
          regular: true,
          ruim: true,
        }
      }

      return parsedFilters
    } catch (e) {
      // Return default filters if parsing fails
      return {
        period: "month",
        location: "all",
        ratings: {
          otimo: true,
          regular: true,
          ruim: true,
        },
        minVotes: 0,
      }
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{schedule ? "Editar" : "Novo"} Agendamento de Relatório</DialogTitle>
            <DialogDescription>Configure quando e como os relatórios serão enviados por e-mail.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome*
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Nome do agendamento"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="frequency" className="text-right">
                Frequência*
              </Label>
              <Select value={formData.frequency} onValueChange={(value) => handleSelectChange("frequency", value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione a frequência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.frequency === "weekly" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dayOfWeek" className="text-right">
                  Dia da Semana*
                </Label>
                <Select
                  value={formData.dayOfWeek.toString()}
                  onValueChange={(value) => handleNumberChange("dayOfWeek", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione o dia da semana" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Domingo</SelectItem>
                    <SelectItem value="1">Segunda-feira</SelectItem>
                    <SelectItem value="2">Terça-feira</SelectItem>
                    <SelectItem value="3">Quarta-feira</SelectItem>
                    <SelectItem value="4">Quinta-feira</SelectItem>
                    <SelectItem value="5">Sexta-feira</SelectItem>
                    <SelectItem value="6">Sábado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.frequency === "monthly" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dayOfMonth" className="text-right">
                  Dia do Mês*
                </Label>
                <Select
                  value={formData.dayOfMonth.toString()}
                  onValueChange={(value) => handleNumberChange("dayOfMonth", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione o dia do mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Horário*
              </Label>
              <div className="col-span-3 flex gap-2">
                <Select value={formData.hour.toString()} onValueChange={(value) => handleNumberChange("hour", value)}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Hora" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                      <SelectItem key={hour} value={hour.toString()}>
                        {hour.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="flex items-center">:</span>
                <Select
                  value={formData.minute.toString()}
                  onValueChange={(value) => handleNumberChange("minute", value)}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Minuto" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                      <SelectItem key={minute} value={minute.toString()}>
                        {minute.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="recipients" className="text-right">
                Destinatários*
              </Label>
              <Textarea
                id="recipients"
                name="recipients"
                placeholder="email1@exemplo.com, email2@exemplo.com"
                value={formData.recipients}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Formatos*</Label>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="xlsx"
                    checked={selectedFormats.xlsx}
                    onCheckedChange={(checked) => handleFormatChange("xlsx", checked === true)}
                  />
                  <Label htmlFor="xlsx">Excel (XLSX)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="csv"
                    checked={selectedFormats.csv}
                    onCheckedChange={(checked) => handleFormatChange("csv", checked === true)}
                  />
                  <Label htmlFor="csv">CSV</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="png"
                    checked={selectedFormats.png}
                    onCheckedChange={(checked) => handleFormatChange("png", checked === true)}
                  />
                  <Label htmlFor="png">Gráfico (PNG)</Label>
                </div>
              </div>
            </div>

            {/* Nova opção para incluir screenshot do dashboard */}
            {selectedFormats.png && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="includeDashboardScreenshot" className="text-right">
                  Incluir Dashboard
                </Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Switch
                    id="includeDashboardScreenshot"
                    checked={formData.includeDashboardScreenshot}
                    onCheckedChange={(checked) => handleSwitchChange("includeDashboardScreenshot", checked)}
                  />
                  <Label htmlFor="includeDashboardScreenshot">
                    {formData.includeDashboardScreenshot ? "Sim" : "Não"}
                  </Label>
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Filtros</Label>
              <Button type="button" variant="outline" onClick={() => setShowFilters(true)} className="col-span-3">
                Configurar Filtros
              </Button>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="active" className="text-right">
                Ativo
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => handleSwitchChange("active", checked)}
                />
                <Label htmlFor="active">{formData.active ? "Sim" : "Não"}</Label>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <FilterDialog
        open={showFilters}
        onOpenChange={setShowFilters}
        currentFilters={getParsedFilters()}
        onApplyFilters={handleApplyFilters}
      />
    </>
  )
}
