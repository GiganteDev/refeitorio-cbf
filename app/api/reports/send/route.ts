import { NextResponse } from "next/server"
import { getReportScheduleById, updateReportLastSent } from "@/lib/db"
import { sendReportEmail } from "@/lib/email-service"
import { checkAdminRole } from "@/lib/auth-utils"

export async function POST(request: Request) {
  try {
    // Verificar se o usuário é administrador
    const isAdmin = await checkAdminRole(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem enviar relatórios manualmente." },
        { status: 403 },
      )
    }

    const { scheduleId } = await request.json()

    if (!scheduleId) {
      return NextResponse.json({ error: "ID do agendamento é obrigatório" }, { status: 400 })
    }

    // Buscar agendamento
    const schedule = await getReportScheduleById(Number(scheduleId))
    if (!schedule) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 })
    }

    // Enviar e-mail
    const result = await sendReportEmail(schedule)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Atualizar data de último envio
    await updateReportLastSent(Number(scheduleId))

    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch (error) {
    console.error("Erro ao enviar relatório:", error)
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 })
  }
}
