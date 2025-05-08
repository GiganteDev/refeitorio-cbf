import { NextResponse } from "next/server"
import { checkAdminRole } from "@/lib/auth-utils"
import { testEmailConnection } from "@/lib/email-service"

export async function POST(request: Request) {
  try {
    // Verificar se o usuário é administrador
    const isAdmin = await checkAdminRole(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem testar configurações de e-mail." },
        { status: 403 },
      )
    }

    const data = await request.json()

    // Validar dados obrigatórios
    if (!data.smtp_host || !data.smtp_port || !data.from_email) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    // Testar conexão SMTP
    const result = await testEmailConnection({
      smtp_host: data.smtp_host,
      smtp_port: Number(data.smtp_port),
      from_email: data.from_email,
      from_name: data.from_name,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao testar configurações de e-mail:", error)
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 })
  }
}
