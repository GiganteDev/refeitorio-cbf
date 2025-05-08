import * as XLSX from "xlsx"
import html2canvas from "html2canvas"

// Funções de exportação
export function exportToCSV(data: any[] = []) {
  if (!data || data.length === 0) {
    console.warn("Sem dados para exportar")
    return
  }

  // Converter dados para CSV
  const headers = Object.keys(data[0]).join(",")
  const rows = data.map((item) => Object.values(item).join(","))
  const csv = [headers, ...rows].join("\n")

  // Criar blob e link para download - CORRIGIDO: Especificar UTF-8 com BOM
  const BOM = new Uint8Array([0xef, 0xbb, 0xbf]) // BOM para UTF-8
  const blob = new Blob([BOM, csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `cbf-survey-export-${new Date().toISOString().split("T")[0]}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportToExcel(data: any[] = []) {
  if (!data || data.length === 0) {
    console.warn("Sem dados para exportar")
    return
  }

  // Preparar os dados para o formato Excel
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Avaliações")

  // Gerar o arquivo Excel e fazer o download
  XLSX.writeFile(workbook, `cbf-survey-export-${new Date().toISOString().split("T")[0]}.xlsx`)
}

export function exportToPNG() {
  // Capturar o elemento do dashboard
  const dashboardElement = document.querySelector(".dashboard-container")

  if (!dashboardElement) {
    console.error("Elemento do dashboard não encontrado")
    return
  }

  // Usar html2canvas para capturar o dashboard
  html2canvas(dashboardElement as HTMLElement)
    .then((canvas) => {
      // Converter o canvas para uma URL de dados
      const imageUrl = canvas.toDataURL("image/png")

      // Criar um link para download
      const link = document.createElement("a")
      link.href = imageUrl
      link.download = `cbf-dashboard-${new Date().toISOString().split("T")[0]}.png`
      link.click()
    })
    .catch((err) => {
      console.error("Erro ao capturar a tela:", err)
    })
}

// Nova função para capturar o dashboard como canvas
export async function captureDashboardAsCanvas(): Promise<HTMLCanvasElement | null> {
  try {
    const dashboardElement = document.querySelector(".dashboard-container")
    if (!dashboardElement) {
      console.error("Elemento do dashboard não encontrado")
      return null
    }

    return await html2canvas(dashboardElement as HTMLElement)
  } catch (error) {
    console.error("Erro ao capturar dashboard como canvas:", error)
    return null
  }
}
