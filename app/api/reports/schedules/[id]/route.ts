import { NextResponse } from "next/server"
import { getReportScheduleById, updateReportSchedule, deleteReportSchedule } from "@/lib/db"
import { checkAdminRole } from "@/lib/auth-utils"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Verificar se o usuário é administrador
    const isAdmin = await checkAdminRole(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem gerenciar agendamentos." },
        { status: 403 },
      )
    }

    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const schedule = await getReportScheduleById(id)
    if (!schedule) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 })
    }

    return NextResponse.json(schedule)
  } catch (error) {
    console.error("Erro ao buscar agendamento:", error)
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    // Verificar se o usuário é administrador
    const isAdmin = await checkAdminRole(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem gerenciar agendamentos." },
        { status: 403 },
      )
    }

    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
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

    const result = await updateReportSchedule(id, {
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao atualizar agendamento:", error)
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Verificar se o usuário é administrador
    const isAdmin = await checkAdminRole(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem gerenciar agendamentos." },
        { status: 403 },
      )
    }

    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const result = await deleteReportSchedule(id)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Erro ao excluir agendamento:", error)
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 })
  }
}
