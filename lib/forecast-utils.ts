import {
  startOfDay,
  endOfDay,
  format,
  parseISO,
  isWithinInterval,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  addDays,
  addWeeks,
  addMonths,
} from "date-fns"
import { ptBR } from "date-fns/locale"

// Tipo para os dados de previsão
export type ForecastData = {
  chartData: Array<{
    name: string
    atual: number | null
    previsao: number | null
  }>
  trend: number
  endPrediction: number
  confidence: number
}

// Função principal para calcular previsões
export function calculateForecast(votes: any[], period: "day" | "week" | "month" | "year"): ForecastData {
  // Se não houver dados suficientes, retornar dados simulados
  if (!votes || votes.length < 5) {
    return getSimulatedForecast(period)
  }

  // Agrupar votos por período
  const groupedData = groupVotesByPeriod(votes, period)

  // Calcular índice de satisfação para cada período
  const satisfactionByPeriod = calculateSatisfactionByPeriod(groupedData)

  // Preparar dados para o gráfico
  const chartData = prepareChartData(satisfactionByPeriod, period)

  // Calcular tendência (inclinação da linha de tendência)
  const trend = calculateTrend(satisfactionByPeriod)

  // Prever o valor final do período
  const endPrediction = calculateEndPrediction(satisfactionByPeriod, trend)

  // Calcular confiabilidade da previsão
  const confidence = calculateConfidence(votes.length, period)

  return {
    chartData,
    trend,
    endPrediction,
    confidence,
  }
}

// Agrupar votos por período (dia, semana, mês, ano)
function groupVotesByPeriod(votes: any[], period: "day" | "week" | "month" | "year") {
  const now = new Date()
  const grouped: Record<string, any[]> = {}

  // Definir intervalos de tempo com base no período
  const intervals = getTimeIntervals(now, period)

  // Inicializar grupos vazios
  intervals.forEach((interval) => {
    grouped[interval.key] = []
  })

  // Agrupar votos nos intervalos
  votes.forEach((vote) => {
    const voteDate = parseISO(vote.created_at)

    for (const interval of intervals) {
      if (isWithinInterval(voteDate, { start: interval.start, end: interval.end })) {
        if (!grouped[interval.key]) {
          grouped[interval.key] = []
        }
        grouped[interval.key].push(vote)
        break
      }
    }
  })

  return grouped
}

// Obter intervalos de tempo para o período selecionado
function getTimeIntervals(now: Date, period: "day" | "week" | "month" | "year") {
  const intervals = []

  switch (period) {
    case "day":
      // Dividir o dia em intervalos de 2 horas
      for (let i = 0; i < 12; i++) {
        const hour = i * 2
        const start = new Date(now)
        start.setHours(hour, 0, 0, 0)
        const end = new Date(now)
        end.setHours(hour + 1, 59, 59, 999)

        // Formatar a hora para exibição
        const hourFormatted = `${hour.toString().padStart(2, "0")}:00`

        intervals.push({
          key: hourFormatted,
          start,
          end,
          label: hourFormatted,
        })
      }
      break

    case "week":
      // Dividir a semana em dias
      const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 })

      for (let i = 0; i < 7; i++) {
        const day = addDays(startOfCurrentWeek, i)
        intervals.push({
          key: format(day, "EEEE", { locale: ptBR }),
          start: startOfDay(day),
          end: endOfDay(day),
          label: format(day, "EEEE", { locale: ptBR }),
        })
      }
      break

    case "month":
      // Dividir o mês em semanas
      const startOfCurrentMonth = startOfMonth(now)

      for (let i = 0; i < 5; i++) {
        const weekStart = addWeeks(startOfCurrentMonth, i)
        const weekEnd = endOfWeek(addWeeks(startOfCurrentMonth, i), { weekStartsOn: 1 })

        // Verificar se ainda estamos no mesmo mês
        if (weekStart.getMonth() === startOfCurrentMonth.getMonth()) {
          intervals.push({
            key: `Semana ${i + 1}`,
            start: weekStart,
            end: weekEnd,
            label: `Semana ${i + 1}`,
          })
        }
      }
      break

    case "year":
      // Dividir o ano em meses
      const startOfCurrentYear = startOfYear(now)

      for (let i = 0; i < 12; i++) {
        const month = addMonths(startOfCurrentYear, i)
        intervals.push({
          key: format(month, "MMM", { locale: ptBR }),
          start: startOfMonth(month),
          end: endOfMonth(month),
          label: format(month, "MMM", { locale: ptBR }),
        })
      }
      break
  }

  return intervals
}

// Calcular índice de satisfação para cada período
function calculateSatisfactionByPeriod(groupedData: Record<string, any[]>) {
  const result: Record<string, number> = {}

  Object.entries(groupedData).forEach(([key, votes]) => {
    if (votes.length === 0) {
      result[key] = 0
      return
    }

    // Calcular índice de satisfação (mesmo método usado no dashboard)
    const totalVotes = votes.length

    // Contar votos por tipo
    const ratingCounts = {
      otimo: votes.filter((v) => v.rating === "otimo").length,
      regular: votes.filter((v) => v.rating === "regular").length,
      ruim: votes.filter((v) => v.rating === "ruim").length,
    }

    // Pesos: Ótimo = 100, Regular = 50, Ruim = 0
    const weightedSum = ratingCounts.otimo * 100 + ratingCounts.regular * 50 + ratingCounts.ruim * 0

    // Calcular índice de satisfação
    result[key] = totalVotes > 0 ? Math.round((weightedSum / (totalVotes * 100)) * 100) : 0
  })

  return result
}

// Preparar dados para o gráfico
function prepareChartData(satisfactionByPeriod: Record<string, number>, period: "day" | "week" | "month" | "year") {
  const now = new Date()
  const chartData = []

  // Determinar quais períodos são históricos (com dados reais) e quais são futuros (previsão)
  const keys = Object.keys(satisfactionByPeriod)

  // Determinar o ponto de corte entre dados reais e previsão
  let cutoffIndex: number

  switch (period) {
    case "day":
      const currentHour = now.getHours()
      cutoffIndex = Math.floor(currentHour / 2) + 1 // Arredondar para o próximo intervalo de 2 horas
      break
    case "week":
      cutoffIndex = now.getDay() === 0 ? 6 : now.getDay() // 0 (domingo) deve ser o último dia
      break
    case "month":
      cutoffIndex = Math.ceil(now.getDate() / 7) // Aproximadamente a semana atual
      break
    case "year":
      cutoffIndex = now.getMonth() + 1 // Mês atual (0-indexed para 1-indexed)
      break
    default:
      cutoffIndex = Math.floor(keys.length / 2)
  }

  // Calcular tendência para previsão
  const trend = calculateTrend(satisfactionByPeriod)

  // Criar dados para o gráfico
  keys.forEach((key, index) => {
    const isActual = index < cutoffIndex
    const isPrediction = index >= cutoffIndex - 1 // Sobrepor um ponto para suavizar a transição

    let predictionValue = null
    if (isPrediction) {
      // Usar o último valor real como base e aplicar a tendência
      const lastRealValue = satisfactionByPeriod[keys[Math.max(0, cutoffIndex - 1)]]
      const periodsAhead = index - (cutoffIndex - 1)
      predictionValue = Math.min(100, Math.max(0, lastRealValue + trend * periodsAhead))
    }

    chartData.push({
      name: key,
      atual: isActual ? satisfactionByPeriod[key] : null,
      previsao: isPrediction ? predictionValue : null,
    })
  })

  return chartData
}

// Atualizar a função calculateTrend para dar mais peso aos dados recentes
function calculateTrend(satisfactionByPeriod: Record<string, number>): number {
  const data = Object.entries(satisfactionByPeriod)
    .filter(([_, value]) => value > 0)
    .map(([_, value]) => value)

  // Se não houver dados suficientes, retornar tendência neutra
  if (data.length < 2) return 0

  // Calcular diferença média entre períodos consecutivos
  // Dando mais peso para as diferenças mais recentes
  let totalWeightedDiff = 0
  let totalWeight = 0

  for (let i = 1; i < data.length; i++) {
    const weight = i // Peso aumenta para períodos mais recentes
    totalWeightedDiff += (data[i] - data[i - 1]) * weight
    totalWeight += weight
  }

  return totalWeight > 0 ? totalWeightedDiff / totalWeight : 0
}

// Melhorar a função calculateEndPrediction para ser mais precisa
function calculateEndPrediction(satisfactionByPeriod: Record<string, number>, trend: number): number {
  const values = Object.values(satisfactionByPeriod).filter((v) => v > 0)

  // Se não houver dados, retornar valor neutro
  if (values.length === 0) return 75

  // Pegar o último valor conhecido
  const lastValue = values[values.length - 1]

  // Calcular quantos períodos faltam até o final
  const periodsLeft = Object.keys(satisfactionByPeriod).length - values.length

  // Aplicar a tendência para prever o valor final, com um fator de amortecimento
  // para evitar previsões muito extremas
  const dampingFactor = Math.min(1, 0.8 + values.length / 20) // Fator de amortecimento baseado na quantidade de dados
  const prediction = lastValue + trend * periodsLeft * dampingFactor

  // Garantir que o valor esteja entre 0 e 100
  return Math.min(100, Math.max(0, Math.round(prediction)))
}

// Calcular confiabilidade da previsão
function calculateConfidence(dataPoints: number, period: "day" | "week" | "month" | "year"): number {
  // Definir limites mínimos para confiabilidade máxima
  const thresholds = {
    day: 50, // 50 votos por dia para confiabilidade máxima
    week: 200, // 200 votos por semana
    month: 800, // 800 votos por mês
    year: 5000, // 5000 votos por ano
  }

  const threshold = thresholds[period]

  // Calcular confiabilidade como porcentagem do limite
  const rawConfidence = Math.min(100, Math.round((dataPoints / threshold) * 100))

  // Garantir um mínimo de confiabilidade para não mostrar valores muito baixos
  return Math.max(40, rawConfidence)
}

// Função para gerar dados simulados quando não há dados suficientes
function getSimulatedForecast(period: "day" | "week" | "month" | "year"): ForecastData {
  // Dados base para cada período
  const baseData: Record<string, any[]> = {
    day: [
      { name: "08:00", atual: 85, previsao: null },
      { name: "10:00", atual: 78, previsao: null },
      { name: "12:00", atual: 82, previsao: null },
      { name: "14:00", atual: 75, previsao: null },
      { name: "16:00", atual: null, previsao: 80 },
      { name: "18:00", atual: null, previsao: 83 },
      { name: "20:00", atual: null, previsao: 85 },
    ],
    week: [
      { name: "Segunda", atual: 82, previsao: null },
      { name: "Terça", atual: 78, previsao: null },
      { name: "Quarta", atual: 80, previsao: null },
      { name: "Quinta", atual: null, previsao: 81 },
      { name: "Sexta", atual: null, previsao: 83 },
      { name: "Sábado", atual: null, previsao: 75 },
      { name: "Domingo", atual: null, previsao: 70 },
    ],
    month: [
      { name: "Semana 1", atual: 79, previsao: null },
      { name: "Semana 2", atual: 81, previsao: null },
      { name: "Semana 3", atual: null, previsao: 82 },
      { name: "Semana 4", atual: null, previsao: 84 },
    ],
    year: [
      { name: "Jan", atual: 75, previsao: null },
      { name: "Fev", atual: 78, previsao: null },
      { name: "Mar", atual: 80, previsao: null },
      { name: "Abr", atual: 82, previsao: null },
      { name: "Mai", atual: 79, previsao: null },
      { name: "Jun", atual: 81, previsao: null },
      { name: "Jul", atual: null, previsao: 83 },
      { name: "Ago", atual: null, previsao: 84 },
      { name: "Set", atual: null, previsao: 85 },
      { name: "Out", atual: null, previsao: 83 },
      { name: "Nov", atual: null, previsao: 82 },
      { name: "Dez", atual: null, previsao: 86 },
    ],
  }

  // Simulação de tendência
  const baseTrend: Record<string, number> = {
    day: 3.5,
    week: 1.2,
    month: 2.8,
    year: 0.9,
  }

  // Simulação de previsão para o final do período
  const basePrediction: Record<string, number> = {
    day: 83,
    week: 81,
    month: 84,
    year: 86,
  }

  // Simulação de confiabilidade da previsão
  const baseConfidence: Record<string, number> = {
    day: 92,
    week: 85,
    month: 78,
    year: 65,
  }

  return {
    chartData: baseData[period],
    trend: baseTrend[period],
    endPrediction: basePrediction[period],
    confidence: baseConfidence[period],
  }
}
