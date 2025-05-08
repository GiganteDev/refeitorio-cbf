// Este arquivo deve ser executado uma vez para atualizar o esquema do banco de dados

import { getDb } from "./utils"

export async function updateDatabaseSchema() {
  const db = getDb()

  try {
    // Verificar se a coluna já existe
    const tableInfo = db.prepare("PRAGMA table_info(report_schedules)").all()
    const columnExists = tableInfo.some((col: any) => col.name === "include_dashboard_screenshot")

    if (!columnExists) {
      // Adicionar a nova coluna
      db.prepare("ALTER TABLE report_schedules ADD COLUMN include_dashboard_screenshot INTEGER DEFAULT 1").run()
      console.log("Coluna include_dashboard_screenshot adicionada com sucesso")
    } else {
      console.log("Coluna include_dashboard_screenshot já existe")
    }

    return { success: true }
  } catch (error) {
    console.error("Erro ao atualizar esquema do banco de dados:", error)
    return { success: false, error }
  }
}

// Executar a atualização
updateDatabaseSchema()
  .then((result) => {
    console.log("Resultado da atualização:", result)
  })
  .catch((error) => {
    console.error("Erro ao executar atualização:", error)
  })
