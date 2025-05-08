import { NextResponse } from "next/server"
import { removeAuthorizedUser } from "@/lib/db"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    await removeAuthorizedUser(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao remover usuário:", error)
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 })
  }
}
