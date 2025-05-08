import { NextResponse } from "next/server"
import { updateUserRole } from "@/lib/db"
import { checkAdminRole } from "@/lib/auth-utils"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    // Verificar se o usuário é administrador
    const isAdmin = await checkAdminRole(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem alterar funções." },
        { status: 403 },
      )
    }

    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const { role } = await request.json()

    if (!role || !["admin", "readonly"].includes(role)) {
      return NextResponse.json({ error: "Função inválida" }, { status: 400 })
    }

    const result = await updateUserRole(id, role)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao atualizar função do usuário:", error)
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 })
  }
}
