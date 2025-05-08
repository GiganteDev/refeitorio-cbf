import { NextResponse } from "next/server"
import { getCafeteriaByCode } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    // Aguardar params antes de acessar suas propriedades
    const resolvedParams = await params
    const code = resolvedParams.code

    if (!code) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 })
    }

    const cafeteria = await getCafeteriaByCode(code)

    if (!cafeteria) {
      return NextResponse.json({ error: "Refeitório não encontrado" }, { status: 404 })
    }

    if (cafeteria.active !== 1) {
      return NextResponse.json({ error: "Refeitório inativo" }, { status: 403 })
    }

    return NextResponse.json(cafeteria)
  } catch (error) {
    console.error("Erro ao buscar refeitório:", error)
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 })
  }
}
