import { NextResponse } from "next/server"
import { getSchedulesToRun, updateReportLastSent } from "@/lib/db"
import { sendReportEmail } from "@/lib/email-service"
import { getCurrentBrazilianDate } from "@/lib/timezone-config"

// Esta rota deve ser chamada por um cron job a cada minuto
export async function GET(request: Request) {
  try {
    // Verificar token de segurança (opcional, para maior segurança)
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    // Se você quiser implementar um token de segurança
    const expectedToken = process.env.CRON_SECRET
    if (expectedToken && (!token || token !== expectedToken)) {
      return NextResponse.json({ error: "Acesso não autorizado" }, { status: 401 })
    }

    // Obter a data atual no timezone do Brasil
    const now = getCurrentBrazilianDate()

    // Buscar agendamentos que devem ser executados agora
    const schedules = await getSchedulesToRun(now)

    if (schedules.length === 0) {
      return NextResponse.json({ message: "Nenhum agendamento para executar agora" })
    }

    // Processar cada agendamento
    const results = []

    for (const schedule of schedules) {
      try {
        // Enviar e-mail
        const result = await sendReportEmail(schedule)

        // Atualizar data de último envio
        if (result.success) {
          await updateReportLastSent(schedule.id)
        }

        results.push({
          id: schedule.id,
          name: schedule.name,
          success: result.success,
          error: result.error || null,
          messageId: result.messageId || null,
        })
      } catch (error) {
        console.error(`Erro ao processar agendamento ${schedule.id}:`, error)
        results.push({
          id: schedule.id,
          name: schedule.name,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return NextResponse.json({
      processed: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    })
  } catch (error) {
    console.error("Erro ao verificar agendamentos:", error)
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 })
  }
}
