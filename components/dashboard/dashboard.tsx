"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ModernDateRangePicker } from "@/components/dashboard/modern-date-range-picker"
import { Overview } from "@/components/dashboard/overview"
import RecentVotes from "@/components/dashboard/recent-votes"
import { FeedbackAnalysis } from "@/components/dashboard/feedback-analysis"
import { ForecastReport } from "@/components/dashboard/forecast-report"
import { RefeitorioLinks } from "@/components/dashboard/refeitorio-links"
import { Button } from "@/components/ui/button"
import { Download, FileSpreadsheet, FileImage, Filter, RefreshCw, Users, Coffee, Mail } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FilterDialog } from "@/components/dashboard/filter-dialog"
import { exportToCSV, exportToExcel, exportToPNG } from "@/lib/export-utils"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useUserRole } from "@/hooks/use-user-role"

export default function Dashboard() {
  const router = useRouter()
  // Modificar para começar do início do ano atual
  const [startDate, setStartDate] = useState<Date | null>(new Date(new Date().getFullYear(), 0, 1)) // Janeiro (mês 0) dia 1
  const [endDate, setEndDate] = useState<Date | null>(new Date())
  const [showFilters, setShowFilters] = useState(false)
  const { toast } = useToast()
  const [stats, setStats] = useState<any>(null)
  const [votes, setVotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [filter, setFilter] = useState({
    period: "month",
    location: "all",
    ratings: {
      otimo: true,
      regular: true,
      ruim: true,
    },
    minVotes: 0,
  })
  const { role, isAdmin, loading: roleLoading } = useUserRole()

  // Adicionar um estado para controlar atualizações forçadas
  const [refreshCounter, setRefreshCounter] = useState(0)

  const applyFilters = (newFilters: any) => {
    setFilter(newFilters)
    fetchData(newFilters)
  }

  // Modificar a função fetchData para incrementar o contador
  const fetchData = async (filters = filter) => {
    setLoading(true)
    try {
      // Construir query params baseados nos filtros
      const params = new URLSearchParams()
      if (filters.period) params.append("period", filters.period)
      if (filters.location && filters.location !== "all") params.append("location", filters.location)
      if (filters.minVotes) params.append("minVotes", filters.minVotes.toString())

      // Adicionar filtros de ratings
      Object.entries(filters.ratings).forEach(([rating, checked]) => {
        if (checked) params.append("ratings", rating)
      })

      // Adicionar filtros de data
      if (startDate) params.append("from", startDate.toISOString())
      if (endDate) params.append("to", endDate.toISOString())

      // Buscar estatísticas com filtros
      const statsRes = await fetch(`/api/stats?${params.toString()}`)
      if (!statsRes.ok) throw new Error("Erro ao buscar estatísticas")
      const statsData = await statsRes.json()

      // Buscar votos recentes com filtros
      const votesRes = await fetch(`/api/votes?${params.toString()}`)
      if (!votesRes.ok) throw new Error("Erro ao buscar votos")
      const votesData = await votesRes.json()

      console.log("Stats data:", statsData)
      console.log("Votes data:", votesData)

      setStats(statsData)
      setVotes(votesData)
      setRefreshCounter((prev) => prev + 1) // Incrementar o contador para forçar atualização
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do dashboard.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleExport = (type: "csv" | "excel" | "png") => {
    // Simulando exportação
    setTimeout(() => {
      toast({
        title: "Exportação concluída",
        description: `Os dados foram exportados com sucesso no formato ${type.toUpperCase()}.`,
      })
    }, 1000)

    if (type === "csv") exportToCSV(votes)
    if (type === "excel") exportToExcel(votes)
    if (type === "png") exportToPNG()
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      })
      router.push("/login")
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    }
  }

  if (roleLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <p className="text-center">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col dashboard-container">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="h-9" onClick={() => fetchData()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <FilterDialog
              open={showFilters}
              onOpenChange={setShowFilters}
              currentFilters={filter}
              onApplyFilters={applyFilters}
            />
            <Button variant="outline" size="sm" className="h-9" onClick={() => setShowFilters(true)}>
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
            <ModernDateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={(start, end) => {
                setStartDate(start)
                setEndDate(end)
                // Atualizar dados quando as datas mudarem
                setTimeout(() => fetchData(), 0)
              }}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  <span>Exportar CSV</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("excel")}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  <span>Exportar Excel</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("png")}>
                  <FileImage className="mr-2 h-4 w-4" />
                  <span>Exportar PNG</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mostrar links de administração para administradores */}
            {role === "admin" && (
              <>
                <Link href="/users">
                  <Button variant="outline" size="sm" className="h-9">
                    <Users className="mr-2 h-4 w-4" />
                    Gerenciar Usuários
                  </Button>
                </Link>
                <Link href="/cafeterias">
                  <Button variant="outline" size="sm" className="h-9">
                    <Coffee className="mr-2 h-4 w-4" />
                    Gerenciar Refeitórios
                  </Button>
                </Link>
                <Link href="/reports">
                  <Button variant="outline" size="sm" className="h-9">
                    <Mail className="mr-2 h-4 w-4" />
                    Relatórios por E-mail
                  </Button>
                </Link>
              </>
            )}

            <Button variant="outline" size="sm" className="h-9" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="report">Relatório</TabsTrigger>
          </TabsList>

          {/* Aba de Visão Geral */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Votos</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M3 3v18h18" />
                    <path d="M18 17V9" />
                    <path d="M13 17V5" />
                    <path d="M8 17v-3" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalVotes || 0}</div>
                  <p className="text-xs text-muted-foreground">Votos registrados no sistema</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Índice de Satisfação</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M16 18a4 4 0 0 0-8 0" />
                    <circle cx="12" cy="10" r="3" />
                    <path d="M17.8 18a9 9 0 1 0-11.6 0" />
                  </svg>
                </CardHeader>
                <CardContent>
                  {stats && <div className="text-2xl font-bold">{calculateSatisfactionIndex(stats.ratingCounts)}%</div>}
                  <p className="text-xs text-muted-foreground">Baseado em todas as avaliações</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avaliações Ótimas</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <path d="M2 10h20" />
                  </svg>
                </CardHeader>
                <CardContent>
                  {stats && (
                    <>
                      <div className="text-2xl font-bold">{getRatingCount(stats.ratingCounts, "otimo")}</div>
                      <p className="text-xs text-muted-foreground">
                        {getRatingPercentage(stats.ratingCounts, "otimo")}% do total de avaliações
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avaliações Negativas</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </CardHeader>
                <CardContent>
                  {stats && (
                    <>
                      <div className="text-2xl font-bold">{getRatingCount(stats.ratingCounts, "ruim")}</div>
                      <p className="text-xs text-muted-foreground">
                        {getRatingPercentage(stats.ratingCounts, "ruim")}% do total de avaliações
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Visão Geral</CardTitle>
                  <CardDescription>Distribuição de avaliações no período selecionado</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <Overview data={prepareChartData(votes)} />
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Análise de Feedback Negativo</CardTitle>
                  <CardDescription>Distribuição por categoria de problema</CardDescription>
                </CardHeader>
                <CardContent>
                  <FeedbackAnalysis data={preparePieData(stats?.badReasons)} />
                </CardContent>
              </Card>
            </div>

            {/* Adicionar o componente de links para refeitórios */}
            <RefeitorioLinks />

            <div className="grid gap-4 md:grid-cols-1">
              <RecentVotes cafeteriaCode={filter.location !== "all" ? filter.location : undefined} />
            </div>
          </TabsContent>

          {/* Nova Aba de Relatório */}
          <TabsContent value="report" className="space-y-4">
            <ForecastReport
              startDate={startDate}
              endDate={endDate}
              location={filter.location}
              filters={filter}
              refreshTrigger={refreshCounter} // Usar o contador como trigger
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Funções auxiliares para cálculos
function calculateSatisfactionIndex(ratingCounts: any[] = []) {
  if (!ratingCounts || ratingCounts.length === 0) return 0

  const totalVotes = ratingCounts.reduce((sum, item) => sum + item.count, 0)
  if (totalVotes === 0) return 0

  // Pesos: Ótimo = 100, Regular = 50, Ruim = 0
  const weightedSum = ratingCounts.reduce((sum, item) => {
    const weight = item.rating === "otimo" ? 100 : item.rating === "regular" ? 50 : 0
    return sum + item.count * weight
  }, 0)

  return Math.round((weightedSum / (totalVotes * 100)) * 100)
}

function getRatingCount(ratingCounts: any[] = [], rating: string) {
  if (!ratingCounts) return 0
  const found = ratingCounts.find((item) => item.rating === rating)
  return found ? found.count : 0
}

function getRatingPercentage(ratingCounts: any[] = [], rating: string) {
  if (!ratingCounts || ratingCounts.length === 0) return 0

  const totalVotes = ratingCounts.reduce((sum, item) => sum + item.count, 0)
  if (totalVotes === 0) return 0

  const count = getRatingCount(ratingCounts, rating)
  return Math.round((count / totalVotes) * 100)
}

function prepareChartData(votes: any[] = []) {
  if (!votes || votes.length === 0) {
    return [
      {
        name: "Sem dados",
        Ótimo: 0,
        Regular: 0,
        Ruim: 0,
      },
    ]
  }

  // Agrupar por mês
  const groupedByMonth: Record<string, { Ótimo: number; Regular: number; Ruim: number }> = {}

  votes.forEach((vote) => {
    const date = new Date(vote.created_at)
    const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`

    if (!groupedByMonth[monthYear]) {
      groupedByMonth[monthYear] = { Ótimo: 0, Regular: 0, Ruim: 0 }
    }

    if (vote.rating === "otimo") groupedByMonth[monthYear].Ótimo++
    else if (vote.rating === "regular") groupedByMonth[monthYear].Regular++
    else if (vote.rating === "ruim") groupedByMonth[monthYear].Ruim++
  })

  // Se não houver dados agrupados, retornar um valor padrão
  if (Object.keys(groupedByMonth).length === 0) {
    return [
      {
        name: "Sem dados",
        Ótimo: 0,
        Regular: 0,
        Ruim: 0,
      },
    ]
  }

  // Converter para o formato esperado pelo gráfico
  return Object.entries(groupedByMonth).map(([month, counts]) => ({
    name: month,
    ...counts,
  }))
}

function preparePieData(badReasons: any[] = []) {
  if (!badReasons || badReasons.length === 0) {
    return [
      { name: "Comida", value: 0, color: "#f87171" },
      { name: "Atendimento", value: 0, color: "#fb923c" },
      { name: "Outros", value: 0, color: "#38bdf8" },
    ]
  }

  const colors = {
    food: "#f87171",
    service: "#fb923c",
    other: "#38bdf8",
  }

  const labels = {
    food: "Comida",
    service: "Atendimento",
    other: "Outros",
  }

  return badReasons.map((item) => ({
    name: labels[item.reason as keyof typeof labels] || item.reason,
    value: item.count,
    color: colors[item.reason as keyof typeof colors] || "#a3e635",
  }))
}
