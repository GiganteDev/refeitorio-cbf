import { NextResponse } from "next/server"
import { getCafeterias, addCafeteria } from "@/lib/db"
import { checkAdminRole } from "@/lib/auth-utils"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const showAll = searchParams.get("all") === "true"

    const cafeterias = await getCafeterias(!showAll) // Se showAll for true, não filtra por ativos
    return NextResponse.json(cafeterias)
  } catch (error) {
    console.error("Erro ao buscar refeitórios:", error)
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Verificar se o usuário é administrador
    const isAdmin = await checkAdminRole(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem adicionar refeitórios." },
        { status: 403 },
      )
    }

    const data = await request.json()

    if (!data.code || !data.name) {
      return NextResponse.json({ error: "Código e nome são obrigatórios" }, { status: 400 })
    }

    // Validar formato do código (apenas letras, números e underscores)
    const codeRegex = /^[a-zA-Z0-9_]+$/
    if (!codeRegex.test(data.code)) {
      return NextResponse.json({ error: "O código deve conter apenas letras, números e underscores" }, { status: 400 })
    }

    // Validar IP se fornecido
    if (data.authorizedIp) {
      const ipv4Regex =
        /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
      if (!ipv4Regex.test(data.authorizedIp)) {
        return NextResponse.json({ error: "Formato de IP inválido" }, { status: 400 })
      }
    }

    const result = await addCafeteria({
      code: data.code,
      name: data.name,
      description: data.description,
      authorizedIp: data.authorizedIp,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error("Erro ao adicionar refeitório:", error)
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 })
  }
}
