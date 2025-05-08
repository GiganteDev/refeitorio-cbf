"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTimezone } from "@/contexts/timezone-context"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface FeedbackStats {
  totalVotes: number
  ratingCounts: { rating: string; count: number }[]
  badReasons: { reason: string; count: number }[]
}

interface FeedbackAnalysisProps {
  period?: string
  cafeteriaCode?: string
  from?: Date
  to?: Date
  data?: Array<{ name: string; value: number; color: string }>
}

export function FeedbackAnalysis({ period, cafeteriaCode, from, to, data }: FeedbackAnalysisProps) {
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [loading, setLoading] = useState(!data)
  const { toast } = useToast()
  const { formatDate } = useTimezone()

  useEffect(() => {
    // If data is provided directly, skip the fetch
    if (data) {
      setLoading(false)
      return
    }

    async function fetchStats() {
      try {
        setLoading(true)
        const url = new URL("/api/stats", window.location.origin)

        // Adicionar parâmetros de consulta
        if (period) {
          url.searchParams.append("period", period)
        }

        if (cafeteriaCode && cafeteriaCode !== "all") {
          url.searchParams.append("location", cafeteriaCode)
        }

        if (from) {
          url.searchParams.append("from", from.toISOString())
        }

        if (to) {
          url.searchParams.append("to", to.toISOString())
        }

        const response = await fetch(url.toString())

        if (!response.ok) {
          throw new Error("Falha ao buscar estatísticas")
        }

        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar as estatísticas",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (!data) {
      fetchStats()
    }
  }, [period, cafeteriaCode, from, to, toast, data])

  function getPercentage(count: number): string {
    if (!stats || stats.totalVotes === 0) return "0%"
    return `${Math.round((count / stats.totalVotes) * 100)}%`
  }

  function getPeriodText(): string {
    if (from && to) {
      return `${formatDate(from)} a ${formatDate(to)}`
    }

    switch (period) {
      case "day":
        return "Hoje"
      case "week":
        return "Últimos 7 dias"
      case "month":
        return "Últimos 30 dias"
      case "quarter":
        return "Últimos 3 meses"
      case "year":
        return "Último ano"
      default:
        return "Período selecionado"
    }
  }

  function getReasonText(reason: string): string {
    switch (reason) {
      case "food":
        return "Comida"
      case "service":
        return "Atendimento"
      case "other":
        return "Outro"
      default:
        return reason || "Não especificado"
    }
  }

  // Render pie chart if data is provided directly
  if (data) {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} avaliações`, "Quantidade"]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p>Carregando estatísticas...</p>
        </div>
      ) : !stats ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-muted-foreground">Nenhum dado disponível</p>
        </div>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{stats.totalVotes}</div>
                  <div className="text-sm text-muted-foreground">Total de Avaliações</div>
                </div>

                {stats.ratingCounts.map((item) => {
                  const rating = item.rating
                  const count = item.count
                  const percentage = getPercentage(count)

                  let bgColor = "bg-gray-100"
                  let textColor = "text-gray-800"

                  if (rating === "otimo") {
                    bgColor = "bg-green-100"
                    textColor = "text-green-800"
                  } else if (rating === "regular") {
                    bgColor = "bg-yellow-100"
                    textColor = "text-yellow-800"
                  } else if (rating === "ruim") {
                    bgColor = "bg-red-100"
                    textColor = "text-red-800"
                  }

                  return (
                    <div key={rating} className={`${bgColor} rounded-lg p-4 text-center`}>
                      <div className={`text-2xl font-bold ${textColor}`}>
                        {count} <span className="text-sm">({percentage})</span>
                      </div>
                      <div className={`text-sm ${textColor}`}>
                        {rating === "otimo" ? "Ótimo" : rating === "regular" ? "Regular" : "Ruim"}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Gráfico de barras simples */}
              <div className="mt-6">
                <div className="text-sm font-medium mb-2">Distribuição de Avaliações</div>
                <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden flex">
                  {stats.ratingCounts.map((item) => {
                    const rating = item.rating
                    const count = item.count
                    const percentage = stats.totalVotes > 0 ? (count / stats.totalVotes) * 100 : 0

                    let bgColor = "bg-gray-500"

                    if (rating === "otimo") {
                      bgColor = "bg-green-500"
                    } else if (rating === "regular") {
                      bgColor = "bg-yellow-400"
                    } else if (rating === "ruim") {
                      bgColor = "bg-red-500"
                    }

                    return (
                      <div
                        key={rating}
                        className={`${bgColor} h-full`}
                        style={{ width: `${percentage}%` }}
                        title={`${rating}: ${count} (${Math.round(percentage)}%)`}
                      />
                    )
                  })}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <div>0%</div>
                  <div>50%</div>
                  <div>100%</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details">
            <div className="space-y-6">
              {/* Razões para avaliações ruins */}
              {stats.badReasons && stats.badReasons.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Razões para Avaliações Ruins</h3>
                  <div className="space-y-2">
                    {stats.badReasons.map((item) => (
                      <div key={item.reason} className="flex justify-between items-center">
                        <div>{getReasonText(item.reason)}</div>
                        <div className="flex items-center">
                          <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-2">
                            <div
                              className="bg-red-500 h-2.5 rounded-full"
                              style={{
                                width: `${
                                  stats.ratingCounts.find((r) => r.rating === "ruim")?.count
                                    ? (item.count / stats.ratingCounts.find((r) => r.rating === "ruim")!.count) * 100
                                    : 0
                                }%`,
                              }}
                            ></div>
                          </div>
                          <div className="text-sm">{item.count}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Estatísticas detalhadas */}
              <div>
                <h3 className="text-lg font-medium mb-2">Estatísticas Detalhadas</h3>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="py-1">Total de avaliações:</td>
                      <td className="text-right font-medium">{stats.totalVotes}</td>
                    </tr>
                    {stats.ratingCounts.map((item) => (
                      <tr key={item.rating}>
                        <td className="py-1">
                          {item.rating === "otimo" ? "Ótimo" : item.rating === "regular" ? "Regular" : "Ruim"}:
                        </td>
                        <td className="text-right font-medium">
                          {item.count} ({getPercentage(item.count)})
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </>
  )
}
