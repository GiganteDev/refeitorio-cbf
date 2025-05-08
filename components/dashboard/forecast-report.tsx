"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import type { ForecastData } from "@/lib/forecast-utils"

type ForecastReportProps = {
  startDate: Date | null
  endDate: Date | null
  location: string
  filters: {
    period: string
    ratings: {
      otimo: boolean
      regular: boolean
      ruim: boolean
    }
    minVotes: number
  }
  refreshTrigger: number // Adicionar um trigger para forçar atualização
}

export function ForecastReport({ startDate, endDate, location, filters, refreshTrigger }: ForecastReportProps) {
  const [forecastPeriod, setForecastPeriod] = useState<"day" | "week" | "month" | "year">("day")
  const [forecastData, setForecastData] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(true)

  // Buscar dados de previsão da API
  useEffect(() => {
    const fetchForecastData = async () => {
      setLoading(true)
      try {
        // Construir query params - APENAS com o filtro de local
        const params = new URLSearchParams()
        params.append("period", forecastPeriod)
        params.append("location", location)

        // Não adicionar outros filtros conforme solicitado
        // Apenas o filtro de local é considerado

        const response = await fetch(`/api/forecast?${params.toString()}`)
        if (!response.ok) throw new Error("Erro ao buscar dados de previsão")

        const data = await response.json()
        setForecastData(data)
      } catch (error) {
        console.error("Erro ao buscar dados de previsão:", error)
        // Em caso de erro, manter os dados anteriores ou definir como null
      } finally {
        setLoading(false)
      }
    }

    fetchForecastData()
  }, [forecastPeriod, location, refreshTrigger]) // Remover startDate, endDate e filters das dependências

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  // Se não temos dados, mostrar mensagem
  if (!forecastData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Não foi possível carregar os dados de previsão.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs value={forecastPeriod} onValueChange={(v) => setForecastPeriod(v as any)}>
        <TabsList className="grid grid-cols-4 w-full md:w-[400px]">
          <TabsTrigger value="day">Dia</TabsTrigger>
          <TabsTrigger value="week">Semana</TabsTrigger>
          <TabsTrigger value="month">Mês</TabsTrigger>
          <TabsTrigger value="year">Ano</TabsTrigger>
        </TabsList>

        <TabsContent value={forecastPeriod} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Previsão de Satisfação - {getPeriodTitle(forecastPeriod)}</CardTitle>
              <CardDescription>Projeção baseada nos dados históricos e tendências atuais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecastData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, "Satisfação"]} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="atual"
                      name="Dados Atuais"
                      stroke="#4ade80"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="previsao"
                      name="Previsão"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 4 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Tendência de Satisfação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center">
              {forecastData.trend.toFixed(1)}%{getTrendIcon(forecastData.trend)}
            </div>
            <p className="text-sm text-muted-foreground">Comparado com o período anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Previsão para o Final do Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{forecastData.endPrediction}%</div>
            <p className="text-sm text-muted-foreground">Índice de satisfação esperado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Confiabilidade da Previsão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{forecastData.confidence}%</div>
            <p className="text-sm text-muted-foreground">Baseado no volume de dados disponíveis</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function getPeriodTitle(period: string) {
  switch (period) {
    case "day":
      return "Final do Dia"
    case "week":
      return "Final da Semana"
    case "month":
      return "Final do Mês"
    case "year":
      return "Final do Ano"
    default:
      return "Período"
  }
}

function getTrendIcon(trend: number) {
  if (trend > 0) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6 ml-2 text-green-500"
      >
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    )
  } else if (trend < 0) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6 ml-2 text-red-500"
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    )
  }
  return null
}
