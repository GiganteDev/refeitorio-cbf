"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useTimezone } from "@/contexts/timezone-context"

interface Vote {
  id: number
  rating: string
  reason: string | null
  comment: string | null
  location: string
  location_name?: string
  created_at: string
}

export default function RecentVotes({ cafeteriaCode }: { cafeteriaCode?: string }) {
  const [votes, setVotes] = useState<Vote[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { formatDateTime } = useTimezone()

  useEffect(() => {
    async function fetchRecentVotes() {
      try {
        setLoading(true)
        const url = new URL("/api/votes", window.location.origin)

        // Adicionar parâmetros de consulta
        if (cafeteriaCode && cafeteriaCode !== "all") {
          url.searchParams.append("location", cafeteriaCode)
        }

        // Limitar a 10 votos mais recentes
        url.searchParams.append("limit", "10")

        const response = await fetch(url.toString())

        if (!response.ok) {
          throw new Error("Falha ao buscar votos recentes")
        }

        const data = await response.json()
        setVotes(data.slice(0, 10)) // Garantir que temos no máximo 10 votos
      } catch (error) {
        console.error("Erro ao buscar votos recentes:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os votos recentes",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchRecentVotes()
  }, [cafeteriaCode, toast])

  function getRatingColor(rating: string) {
    switch (rating) {
      case "otimo":
        return "text-green-500"
      case "regular":
        return "text-yellow-500"
      case "ruim":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  function getRatingText(rating: string) {
    switch (rating) {
      case "otimo":
        return "Ótimo"
      case "regular":
        return "Regular"
      case "ruim":
        return "Ruim"
      default:
        return rating
    }
  }

  function getReasonText(reason: string | null) {
    if (!reason) return ""
    switch (reason) {
      case "food":
        return "Comida"
      case "service":
        return "Atendimento"
      case "other":
        return "Outro"
      default:
        return reason
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avaliações Recentes</CardTitle>
        <CardDescription>As 10 avaliações mais recentes</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p>Carregando avaliações...</p>
          </div>
        ) : votes.length === 0 ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-muted-foreground">Nenhuma avaliação encontrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {votes.map((vote) => (
              <div key={vote.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`font-bold ${getRatingColor(vote.rating)}`}>{getRatingText(vote.rating)}</span>
                    {vote.reason && (
                      <span className="text-sm text-muted-foreground ml-2">({getReasonText(vote.reason)})</span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">{formatDateTime(vote.created_at)}</div>
                </div>
                {vote.comment && <p className="mt-2 text-sm">{vote.comment}</p>}
                <div className="mt-2 text-xs text-muted-foreground">
                  Refeitório: {vote.location_name || vote.location}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
