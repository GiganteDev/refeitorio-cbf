import { NextResponse } from "next/server"
import { getEmailSettings, updateEmailSettings } from "@/lib/db"
import { checkAdminRole } from "@/lib/auth-utils"

export async function GET(request: Request) {
  try {
    // Verificar se o usuário é administrador
    const isAdmin = await checkAdminRole(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem gerenciar configurações de e-mail." },
        { status: 403 },
      )
    }

    const settings = await getEmailSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error("Erro ao buscar configurações de e-mail:", error)
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    // Verificar se o usuário é administrador
    const isAdmin = await checkAdminRole(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem gerenciar configurações de e-mail." },
        { status: 403 },
      )
    }

    const data = await request.json()

    // Validar dados obrigatórios
    if (!data.smtp_host || !data.smtp_port || !data.from_email) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    // Validar porta SMTP
    if (isNaN(data.smtp_port) || data.smtp_port < 1 || data.smtp_port > 65535) {
      return NextResponse.json({ error: "Porta SMTP inválida" }, { status: 400 })
    }

    // Validar e-mail de origem
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.from_email)) {
      return NextResponse.json({ error: "E-mail de origem inválido" }, { status: 400 })
    }

    const result = await updateEmailSettings({
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
    console.error("Erro ao atualizar configurações de e-mail:", error)
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 })
  }
}
