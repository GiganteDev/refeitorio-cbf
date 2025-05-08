import { NextResponse } from "next/server"
import { getVotes } from "@/lib/db"
import { calculateForecast } from "@/lib/forecast-utils"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // Extrair parâmetros de filtro
    const period = searchParams.get("period") || "day"
    const location = searchParams.get("location") || "all"

    // Não extrair outros filtros conforme solicitado
    // Apenas o filtro de local é considerado

    // Obter todos os votos históricos para análise apenas com o filtro de local
    const votes = await getVotes({
      location: location !== "all" ? location : undefined,
      // Não aplicar outros filtros
    })

    // Calcular previsões baseadas nos dados históricos filtrados
    const forecast = calculateForecast(votes, period as "day" | "week" | "month" | "year")

    return NextResponse.json(forecast)
  } catch (error) {
    console.error("Erro ao gerar previsão:", error)
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 })
  }
}
