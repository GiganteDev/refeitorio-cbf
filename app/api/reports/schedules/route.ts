import { NextResponse } from "next/server"
import { getReportSchedules, addReportSchedule } from "@/lib/db"
import { checkAdminRole } from "@/lib/auth-utils"

export async function GET(request: Request) {
  try {
    // Verificar se o usuário é administrador
    const isAdmin = await checkAdminRole(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem gerenciar agendamentos." },
        { status: 403 },
      )
    }

    const schedules = await getReportSchedules()
    return NextResponse.json(schedules)
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error)
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Verificar se o usuário é administrador
    const isAdmin = await checkAdminRole(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem gerenciar agendamentos." },
        { status: 403 },
      )
    }

    const data = await request.json()

    // Validar dados obrigatórios
    if (!data.name || !data.frequency || !data.recipients || !data.formats) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    // Validar frequência e dias específicos
    if (data.frequency === "weekly" && (data.dayOfWeek === undefined || data.dayOfWeek === null)) {
      return NextResponse.json({ error: "Dia da semana é obrigatório para frequência semanal" }, { status: 400 })
    }

    if (data.frequency === "monthly" && (data.dayOfMonth === undefined || data.dayOfMonth === null)) {
      return NextResponse.json({ error: "Dia do mês é obrigatório para frequência mensal" }, { status: 400 })
    }

    // Validar hora e minuto
    if (data.hour === undefined || data.minute === undefined) {
      return NextResponse.json({ error: "Hora e minuto são obrigatórios" }, { status: 400 })
    }

    // Validar lista de e-mails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const emails = data.recipients.split(",").map((email: string) => email.trim())
    const invalidEmails = emails.filter((email: string) => !emailRegex.test(email))

    if (invalidEmails.length > 0) {
      return NextResponse.json(
        {
          error: `E-mails inválidos: ${invalidEmails.join(", ")}`,
        },
        { status: 400 },
      )
    }

    const result = await addReportSchedule({
      name: data.name,
      frequency: data.frequency,
      dayOfWeek: data.dayOfWeek,
      dayOfMonth: data.dayOfMonth,
      hour: data.hour,
      minute: data.minute,
      recipients: data.recipients,
      formats: data.formats,
      filters: data.filters || "{}",
      active: data.active !== undefined ? data.active : 1,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, id: result.id }, { status: 201 })
  } catch (error) {
    console.error("Erro ao adicionar agendamento:", error)
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 })
  }
}
