import { NextResponse } from "next/server"
import { updateCafeteria, deleteCafeteria, getCafeteriaById } from "@/lib/db"
import { checkAdminRole } from "@/lib/auth-utils"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const cafeteria = await getCafeteriaById(id)

    if (!cafeteria) {
      return NextResponse.json({ error: "Refeitório não encontrado" }, { status: 404 })
    }

    return NextResponse.json(cafeteria)
  } catch (error) {
    console.error("Erro ao buscar refeitório:", error)
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    // Verificar se o usuário é administrador
    const isAdmin = await checkAdminRole(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem editar refeitórios." },
        { status: 403 },
      )
    }

    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const data = await request.json()

    if (!data.name) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }

    // Validar IP se fornecido
    if (data.authorizedIp) {
      const ipv4Regex =
        /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
      if (!ipv4Regex.test(data.authorizedIp)) {
        return NextResponse.json({ error: "Formato de IP inválido" }, { status: 400 })
      }
    }

    const result = await updateCafeteria(id, {
      name: data.name,
      description: data.description,
      active: data.active,
      authorizedIp: data.authorizedIp,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao atualizar refeitório:", error)
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Verificar se o usuário é administrador
    const isAdmin = await checkAdminRole(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem remover refeitórios." },
        { status: 403 },
      )
    }

    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const result = await deleteCafeteria(id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Erro ao remover refeitório:", error)
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 })
  }
}
