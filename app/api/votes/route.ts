import { NextResponse } from "next/server"
import { saveVote, getVotes, type VoteData, getCafeteriaByCode } from "@/lib/db"
import { formatISOBrazilian } from "@/lib/timezone-config"

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as VoteData

    // Obter o IP do cliente
    const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1"

    // Verificar se o refeitório existe e está ativo
    if (!data.location) {
      return NextResponse.json({ error: "Refeitório não especificado" }, { status: 400 })
    }

    const cafeteria = await getCafeteriaByCode(data.location)
    if (!cafeteria) {
      return NextResponse.json({ error: "Refeitório não encontrado" }, { status: 404 })
    }

    if (cafeteria.active !== 1) {
      return NextResponse.json({ error: "Refeitório inativo" }, { status: 403 })
    }

    // Verificar se o IP está autorizado (se houver restrição)
    if (cafeteria.authorized_ip && clientIp !== cafeteria.authorized_ip) {
      console.log(
        `Tentativa de voto de IP não autorizado: ${clientIp} para refeitório ${data.location} (IP autorizado: ${cafeteria.authorized_ip})`,
      )
      return NextResponse.json(
        { error: "Este dispositivo não está autorizado a enviar avaliações para este refeitório" },
        { status: 403 },
      )
    }

    // Validação básica
    if (!data.rating || !["otimo", "regular", "ruim"].includes(data.rating)) {
      return NextResponse.json({ error: "Avaliação inválida" }, { status: 400 })
    }

    // Se for uma avaliação ruim, deve ter uma razão
    if (data.rating === "ruim" && !data.reason) {
      return NextResponse.json({ error: "Razão é obrigatória para avaliação ruim" }, { status: 400 })
    }

    // Se a razão for 'other', deve ter um comentário
    if (data.reason === "other" && !data.comment) {
      return NextResponse.json({ error: 'Comentário é obrigatório para "Outros"' }, { status: 400 })
    }

    // Usar o timestamp fornecido pelo cliente (já no fuso horário brasileiro) ou gerar um novo
    const timestamp = data.timestamp || formatISOBrazilian(new Date())

    // Salvar o voto com o timestamp brasileiro
    const voteData = {
      ...data,
      created_at: timestamp,
    }

    const id = await saveVote(voteData)

    return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (error) {
    console.error("Erro ao salvar voto:", error)
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 })
  }
}

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

    // Passar os filtros para a função getVotes
    const votes = await getVotes({
      period,
      location,
      minVotes: minVotes ? Number.parseInt(minVotes) : undefined,
      ratings: ratings.length > 0 ? ratings : undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    })

    return NextResponse.json(votes)
  } catch (error) {
    console.error("Erro ao buscar votos:", error)
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 })
  }
}
