import { getVotes, getVoteStats } from "./db"
import * as XLSX from "xlsx"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { createCanvas } from "canvas"
import { logDebug } from "./debug-utils"

// Function to generate report data and attachments
export async function generateReport(schedule: any) {
  logDebug("Starting report generation with schedule:", schedule)

  // Parse filters from the schedule
  const filters = JSON.parse(schedule.filters || "{}")
  logDebug("Using filters:", filters)

  // Get data for the report
  const votes = await getVotes(filters)
  logDebug(`Retrieved ${votes.length} votes`)

  const stats = await getVoteStats(filters)
  logDebug("Retrieved stats:", stats)

  // Generate attachments based on requested formats
  const formats = schedule.formats.split(",")
  const attachments = []
  const now = new Date()
  const dateStr = format(now, "yyyy-MM-dd", { locale: ptBR })

  // Generate each requested format
  if (formats.includes("xlsx")) {
    logDebug("Generating Excel report")
    const buffer = await generateExcelReport(votes, stats)
    attachments.push({
      filename: `relatorio-cbf-${dateStr}.xlsx`,
      content: buffer,
    })
  }

  if (formats.includes("csv")) {
    logDebug("Generating CSV report")
    const buffer = await generateCsvReport(votes)
    attachments.push({
      filename: `relatorio-cbf-${dateStr}.csv`,
      content: buffer,
      encoding: "utf8", // Garantir que o encoding seja UTF-8
    })
  }

  if (formats.includes("png")) {
    try {
      logDebug("Generating PNG chart report")
      const chartBuffer = await generatePngReport(stats)
      attachments.push({
        filename: `grafico-cbf-${dateStr}.png`,
        content: chartBuffer,
      })

      // Verificar se há um dashboard screenshot para incluir
      if (schedule.includeDashboardScreenshot) {
        logDebug("Generating dashboard screenshot")
        const dashboardBuffer = await generateDashboardScreenshot(filters)
        if (dashboardBuffer) {
          attachments.push({
            filename: `dashboard-cbf-${dateStr}.png`,
            content: dashboardBuffer,
          })
        }
      }
    } catch (error) {
      console.error("Error generating PNG:", error)
    }
  }

  // Calculate summary information
  const summary = {
    period: getPeriodText(filters),
    totalVotes: stats.totalVotes,
    satisfactionIndex: calculateSatisfactionIndex(stats.ratingCounts),
  }

  logDebug("Report generation complete. Summary:", summary)
  logDebug(`Generated ${attachments.length} attachments`)

  return {
    attachments,
    summary,
  }
}

// Helper function to generate Excel report
async function generateExcelReport(votes: any[], stats: any) {
  // Create worksheet with vote data
  const votesWorksheet = XLSX.utils.json_to_sheet(
    votes.map((vote) => ({
      ID: vote.id,
      Data: new Date(vote.created_at).toLocaleString("pt-BR"),
      Avaliação: formatRating(vote.rating),
      Motivo: formatReason(vote.reason),
      Comentário: vote.comment || "",
      Local: vote.location_name || vote.location,
    })),
  )

  // Create worksheet with statistics
  const statsData = [
    { Métrica: "Total de Votos", Valor: stats.totalVotes },
    { Métrica: "Avaliações Ótimas", Valor: getRatingCount(stats.ratingCounts, "otimo") },
    { Métrica: "Avaliações Regulares", Valor: getRatingCount(stats.ratingCounts, "regular") },
    { Métrica: "Avaliações Ruins", Valor: getRatingCount(stats.ratingCounts, "ruim") },
    { Métrica: "Índice de Satisfação", Valor: `${calculateSatisfactionIndex(stats.ratingCounts)}%` },
  ]
  const statsWorksheet = XLSX.utils.json_to_sheet(statsData)

  // Create workbook and add worksheets
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, votesWorksheet, "Avaliações")
  XLSX.utils.book_append_sheet(workbook, statsWorksheet, "Estatísticas")

  // Convert to buffer
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
  return buffer
}

// Helper function to generate CSV report
async function generateCsvReport(votes: any[]) {
  // Convert votes to CSV format
  const headers = ["ID", "Data", "Avaliação", "Motivo", "Comentário", "Local"]
  const rows = votes.map((vote) => [
    vote.id,
    new Date(vote.created_at).toLocaleString("pt-BR"),
    formatRating(vote.rating),
    formatReason(vote.reason),
    vote.comment || "",
    vote.location_name || vote.location,
  ])

  // Build CSV string with proper escaping for UTF-8
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ].join("\n")

  // Adicionar BOM (Byte Order Mark) para garantir que o Excel reconheça como UTF-8
  const BOM = new Uint8Array([0xef, 0xbb, 0xbf])
  const buffer = Buffer.concat([Buffer.from(BOM), Buffer.from(csvContent, "utf-8")])

  return buffer
}

// Helper function to generate PNG report
async function generatePngReport(stats: any) {
  // Create a canvas
  const width = 800
  const height = 400
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")

  // Fill background
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, width, height)

  // Draw title
  ctx.fillStyle = "#000000"
  ctx.font = "bold 24px Arial"
  ctx.fillText("Relatório de Satisfação", 20, 40)

  // Draw statistics
  ctx.font = "18px Arial"
  ctx.fillText(`Total de Avaliações: ${stats.totalVotes}`, 20, 80)
  ctx.fillText(`Índice de Satisfação: ${calculateSatisfactionIndex(stats.ratingCounts)}%`, 20, 110)

  // Draw pie chart if there's data
  if (stats.totalVotes > 0) {
    drawPieChart(ctx, stats.ratingCounts, 400, 200, 150)
  } else {
    ctx.fillText("Sem dados para exibir", 400, 200)
  }

  // Convert canvas to buffer
  return canvas.toBuffer("image/png")
}

// Nova função para gerar screenshot do dashboard
async function generateDashboardScreenshot(filters: any) {
  // Esta função seria chamada no servidor, mas o html2canvas só funciona no navegador
  // Portanto, precisamos de uma abordagem diferente para o servidor

  // No ambiente de servidor, podemos usar uma biblioteca como puppeteer
  // Mas para simplificar, vamos apenas gerar uma imagem com os dados do filtro

  const width = 1200
  const height = 800
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")

  // Fill background
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, width, height)

  // Draw title
  ctx.fillStyle = "#000000"
  ctx.font = "bold 32px Arial"
  ctx.fillText("Dashboard CBF - Captura Completa", 20, 50)

  // Draw filter information
  ctx.font = "18px Arial"
  ctx.fillText(`Período: ${getPeriodText(filters)}`, 20, 100)
  ctx.fillText(`Local: ${filters.location || "Todos"}`, 20, 130)

  // Draw current date
  const now = new Date()
  ctx.fillText(`Gerado em: ${now.toLocaleString("pt-BR")}`, 20, 160)

  // Draw a note
  ctx.fillStyle = "#666666"
  ctx.font = "16px Arial"
  ctx.fillText("Esta é uma representação do dashboard. Para visualização completa, acesse o sistema.", 20, 200)

  // Convert canvas to buffer
  return canvas.toBuffer("image/png")
}

// Helper function to draw a pie chart
function drawPieChart(ctx: any, ratingCounts: any[], x: number, y: number, radius: number) {
  const total = ratingCounts.reduce((sum, item) => sum + item.count, 0)
  if (total === 0) return

  const colors = {
    otimo: "#4ade80", // green
    regular: "#facc15", // yellow
    ruim: "#f87171", // red
  }

  let startAngle = 0

  // Draw pie slices
  ratingCounts.forEach((item) => {
    if (item.count === 0) return

    const sliceAngle = (item.count / total) * 2 * Math.PI

    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.arc(x, y, radius, startAngle, startAngle + sliceAngle)
    ctx.closePath()

    ctx.fillStyle = colors[item.rating as keyof typeof colors] || "#cccccc"
    ctx.fill()

    // Draw label
    const labelAngle = startAngle + sliceAngle / 2
    const labelX = x + Math.cos(labelAngle) * (radius * 0.7)
    const labelY = y + Math.sin(labelAngle) * (radius * 0.7)

    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 16px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(`${Math.round((item.count / total) * 100)}%`, labelX, labelY)

    startAngle += sliceAngle
  })

  // Draw legend
  ctx.font = "14px Arial"
  ctx.textAlign = "left"
  ctx.textBaseline = "middle"

  let legendY = y + radius + 30
  Object.entries(colors).forEach(([rating, color], index) => {
    const count = getRatingCount(ratingCounts, rating)
    if (count === 0) return

    ctx.fillStyle = color
    ctx.fillRect(x - radius, legendY, 20, 20)

    ctx.fillStyle = "#000000"
    ctx.fillText(`${formatRating(rating)}: ${count}`, x - radius + 30, legendY + 10)

    legendY += 30
  })
}

// Helper functions
function formatRating(rating: string) {
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

function formatReason(reason: string | null) {
  if (!reason) return "-"
  switch (reason) {
    case "food":
      return "Comida"
    case "service":
      return "Atendimento"
    case "other":
      return "Outros"
    default:
      return reason
  }
}

function getRatingCount(ratingCounts: any[] = [], rating: string) {
  if (!ratingCounts) return 0
  const found = ratingCounts.find((item) => item.rating === rating)
  return found ? found.count : 0
}

function calculateSatisfactionIndex(ratingCounts: any[] = []) {
  if (!ratingCounts || ratingCounts.length === 0) return 0

  const totalVotes = ratingCounts.reduce((sum, item) => sum + item.count, 0)
  if (totalVotes === 0) return 0

  // Weights: Ótimo = 100, Regular = 50, Ruim = 0
  const weightedSum = ratingCounts.reduce((sum, item) => {
    const weight = item.rating === "otimo" ? 100 : item.rating === "regular" ? 50 : 0
    return sum + item.count * weight
  }, 0)

  return Math.round((weightedSum / (totalVotes * 100)) * 100)
}

function getPeriodText(filters: any): string {
  if (filters.from && filters.to) {
    return `${format(new Date(filters.from), "dd/MM/yyyy", { locale: ptBR })} a ${format(new Date(filters.to), "dd/MM/yyyy", { locale: ptBR })}`
  }

  switch (filters.period) {
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
