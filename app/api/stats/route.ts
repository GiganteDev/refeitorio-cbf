import { NextResponse } from "next/server"
import { getVoteStats } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // Extrair parâmetros de filtro
    const period = searchParams.get("period")
    const location = searchParams.get("location")
    const minVotes = searchParams.get("minVotes")
    const ratings = searchParams.getAll("ratings")
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    // Passar os filtros para a função getVoteStats
    const stats = await getVoteStats({
      period,
      location,
      minVotes: minVotes ? Number.parseInt(minVotes) : undefined,
      ratings: ratings.length > 0 ? ratings : undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    })

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error)
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 })
  }
}
