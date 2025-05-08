"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface EmailSettings {
  id: number
  smtp_host: string
  smtp_port: number
  from_email: string
  from_name: string
  created_at: string
  updated_at: string
}

export default function EmailSettings() {
  const [settings, setSettings] = useState<EmailSettings | null>(null)
  const [formData, setFormData] = useState({
    smtp_host: "",
    smtp_port: 25,
    from_email: "",
    from_name: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null)
  const { toast } = useToast()

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/reports/email-settings")
      if (!response.ok) throw new Error("Erro ao buscar configurações")
      const data = await response.json()
      setSettings(data)
      setFormData({
        smtp_host: data.smtp_host,
        smtp_port: data.smtp_port,
        from_email: data.from_email,
        from_name: data.from_name || "",
      })
    } catch (error) {
      console.error("Erro ao buscar configurações:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações de e-mail.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value, 10)
    if (!isNaN(value)) {
      setFormData((prev) => ({ ...prev, smtp_port: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setTestResult(null)

    try {
      // Validar dados
      if (!formData.smtp_host.trim() || !formData.from_email.trim()) {
        throw new Error("Todos os campos obrigatórios devem ser preenchidos")
      }

      // Validar porta
      if (formData.smtp_port < 1 || formData.smtp_port > 65535) {
        throw new Error("Porta SMTP inválida")
      }

      // Validar e-mail
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.from_email)) {
        throw new Error("E-mail de origem inválido")
      }

      const response = await fetch("/api/reports/email-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao salvar configurações")
      }

      toast({
        title: "Sucesso",
        description: "Configurações de e-mail salvas com sucesso.",
      })

      fetchSettings()
    } catch (error) {
      console.error("Erro ao salvar configurações:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar configurações.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/reports/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao testar conexão")
      }

      setTestResult({ success: true })
      toast({
        title: "Sucesso",
        description: "Conexão com o servidor SMTP estabelecida com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao testar conexão:", error)
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Erro ao testar conexão",
      })
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao testar conexão.",
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurações de E-mail</CardTitle>
          <CardDescription>Configure o servidor SMTP para envio de relatórios</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-4">Carregando configurações...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de E-mail</CardTitle>
        <CardDescription>Configure o servidor SMTP para envio de relatórios</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="smtp_host" className="text-right">
              Servidor SMTP*
            </Label>
            <Input
              id="smtp_host"
              name="smtp_host"
              placeholder="smtp.exemplo.com"
              value={formData.smtp_host}
              onChange={handleInputChange}
              className="col-span-3"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="smtp_port" className="text-right">
              Porta SMTP*
            </Label>
            <Input
              id="smtp_port"
              name="smtp_port"
              type="number"
              min="1"
              max="65535"
              value={formData.smtp_port}
              onChange={handlePortChange}
              className="col-span-3"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="from_email" className="text-right">
              E-mail de Origem*
            </Label>
            <Input
              id="from_email"
              name="from_email"
              placeholder="noreply@exemplo.com"
              value={formData.from_email}
              onChange={handleInputChange}
              className="col-span-3"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="from_name" className="text-right">
              Nome de Exibição
            </Label>
            <Input
              id="from_name"
              name="from_name"
              placeholder="CBF Refeitório"
              value={formData.from_name}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>

          {testResult && (
            <Alert variant={testResult.success ? "default" : "destructive"} className="mt-4">
              {testResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription>
                {testResult.success
                  ? "Conexão com o servidor SMTP estabelecida com sucesso."
                  : `Erro ao conectar ao servidor SMTP: ${testResult.error}`}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleTestConnection} disabled={testing || saving}>
              {testing ? "Testando..." : "Testar Conexão"}
            </Button>
            <Button type="submit" disabled={testing || saving}>
              {saving ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between border-t px-6 py-4">
        <p className="text-sm text-muted-foreground">
          Última atualização: {settings?.updated_at ? new Date(settings.updated_at).toLocaleString("pt-BR") : "N/A"}
        </p>
        <p className="text-sm text-muted-foreground">Nota: Este servidor SMTP não requer autenticação.</p>
      </CardFooter>
    </Card>
  )
}
