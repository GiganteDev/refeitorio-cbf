import Database from "better-sqlite3"
import { formatISOBrazilian } from "./timezone-config"
import { logDebug } from "./debug-utils"
import { format } from "date-fns"

let db: Database.Database | null = null

// Função auxiliar para formatar datas no formato do banco
function formatDateForSQLite(date: Date): string {
  return date.toISOString() // Ex: 2025-05-05T00:00:00.000Z
}

function getDb(): Database.Database {
  if (db) {
    return db
  }

  logDebug("Initializing database connection")
  db = new Database("cbf_refeitorio.db")
  initDb()
  return db
}

export type VoteData = {
  id?: number
  rating: "otimo" | "regular" | "ruim"
  reason?: string | null
  comment?: string | null
  location: string
  created_at?: string
  timestamp?: string
}

export function initDb() {
  const db = getDb()

  db.exec(`
    CREATE TABLE IF NOT EXISTS authorized_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'readonly',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS cafeterias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      authorized_ip TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rating TEXT NOT NULL,
      reason TEXT,
      comment TEXT,
      location TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (location) REFERENCES cafeterias(code)
    )
  `)

  // Adicionar coluna authorized_ip à tabela cafeterias se não existir
  const tableInfo = db.pragma("table_info(cafeterias)")
  const authorizedIpColumnExists = tableInfo.some((column: any) => column.name === "authorized_ip")

  if (!authorizedIpColumnExists) {
    db.exec(`ALTER TABLE cafeterias ADD COLUMN authorized_ip TEXT`)
  }

  // Create email_settings table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      smtp_host TEXT NOT NULL,
      smtp_port INTEGER NOT NULL DEFAULT 25,
      smtp_secure INTEGER NOT NULL DEFAULT 0,
      from_email TEXT NOT NULL,
      from_name TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create report_schedules table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS report_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      frequency TEXT NOT NULL,
      day_of_week INTEGER,
      day_of_month INTEGER,
      hour INTEGER NOT NULL,
      minute INTEGER NOT NULL,
      recipients TEXT NOT NULL,
      formats TEXT NOT NULL,
      filters TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_sent TIMESTAMP,
      timezone TEXT DEFAULT 'America/Sao_Paulo'
    )
  `)
}

// Add a function to insert test data
export function insertTestData(count = 10) {
  const db = getDb()

  // Make sure we have at least one cafeteria
  try {
    const cafeteriaCount = db.prepare("SELECT COUNT(*) as count FROM cafeterias").get() as { count: number }

    if (cafeteriaCount.count === 0) {
      db.prepare("INSERT INTO cafeterias (code, name, active) VALUES (?, ?, ?)").run(
        "test_cafeteria",
        "Test Cafeteria",
        1,
      )
    }

    // Get the first cafeteria code
    const cafeteria = db.prepare("SELECT code FROM cafeterias LIMIT 1").get() as { code: string }
    const cafeteriaCode = cafeteria.code

    // Insert test votes
    const stmt = db.prepare("INSERT INTO votes (rating, reason, comment, location, created_at) VALUES (?, ?, ?, ?, ?)")

    const ratings = ["otimo", "regular", "ruim"]
    const reasons = ["food", "service", "other", null]
    const comments = ["Test comment", "Another comment", null]

    const now = new Date()

    // Insert votes with different dates (some today, some in the past week, some older)
    for (let i = 0; i < count; i++) {
      const rating = ratings[Math.floor(Math.random() * ratings.length)]
      const reason = rating === "ruim" ? reasons[Math.floor(Math.random() * reasons.length)] : null
      const comment = reason === "other" ? comments[Math.floor(Math.random() * comments.length)] : null

      // Create a date between now and 30 days ago
      const daysAgo = Math.floor(Math.random() * 30)
      const date = new Date(now)
      date.setDate(date.getDate() - daysAgo)

      stmt.run(rating, reason, comment, cafeteriaCode, date.toISOString())
    }

    return { success: true, count }
  } catch (error) {
    console.error("Error inserting test data:", error)
    return { success: false, error }
  }
}

export function getActiveCafeterias() {
  const db = getDb()
  return db.prepare("SELECT * FROM cafeterias WHERE active = 1 ORDER BY code ASC").all()
}

export function getCafeterias(includeInactive = false) {
  const db = getDb()
  const query = includeInactive ? "SELECT * FROM cafeterias" : "SELECT * FROM cafeterias WHERE active = 1"
  return db.prepare(query).all()
}

export function getCafeteriaByCode(code: string) {
  const db = getDb()
  return db.prepare("SELECT * FROM cafeterias WHERE code = ?").get(code)
}

export function getCafeteriaById(id: number) {
  const db = getDb()
  return db.prepare("SELECT * FROM cafeterias WHERE id = ?").get(id)
}

export function addCafeteria(cafeteria: {
  code: string
  name: string
  description: string | null
  authorizedIp: string | null
}) {
  const db = getDb()
  try {
    db.prepare("INSERT INTO cafeterias (code, name, description, authorized_ip) VALUES (?, ?, ?, ?)").run(
      cafeteria.code,
      cafeteria.name,
      cafeteria.description,
      cafeteria.authorizedIp,
    )
    return { success: true }
  } catch (error: any) {
    console.error("Erro ao adicionar refeitório:", error.message)
    return { success: false, error: "Código já está em uso." }
  }
}

export function updateCafeteria(
  id: number,
  cafeteria: { name: string; description: string | null; active: number; authorizedIp: string | null },
) {
  const db = getDb()
  try {
    db.prepare("UPDATE cafeterias SET name = ?, description = ?, active = ?, authorized_ip = ? WHERE id = ?").run(
      cafeteria.name,
      cafeteria.description,
      cafeteria.active,
      cafeteria.authorizedIp,
      id,
    )
    return { success: true }
  } catch (error: any) {
    console.error("Erro ao atualizar refeitório:", error.message)
    return { success: false, error: "Erro ao atualizar refeitório." }
  }
}

export function deleteCafeteria(id: number) {
  const db = getDb()
  try {
    // Tentar remover o refeitório
    const result = db.prepare("DELETE FROM cafeterias WHERE id = ?").run(id)

    if (result.changes === 0) {
      return { success: false, error: "Refeitório não encontrado." }
    }

    return { success: true, message: "Refeitório removido com sucesso." }
  } catch (error: any) {
    console.error("Erro ao remover refeitório:", error.message)
    return {
      success: false,
      error: "Não é possível remover o refeitório. Desative-o para preservar os dados.",
    }
  }
}

export function getAuthorizedUsers() {
  const db = getDb()
  return db.prepare("SELECT * FROM authorized_users").all()
}

export function addAuthorizedUser(email: string, role = "readonly") {
  const db = getDb()
  try {
    db.prepare("INSERT INTO authorized_users (email, role) VALUES (?, ?)").run(email, role)
    return { success: true }
  } catch (error: any) {
    console.error("Erro ao adicionar usuário:", error.message)
    return { success: false, error: "Usuário já está autorizado." }
  }
}

export function removeAuthorizedUser(id: number) {
  const db = getDb()
  try {
    db.prepare("DELETE FROM authorized_users WHERE id = ?").run(id)
    return { success: true }
  } catch (error: any) {
    console.error("Erro ao remover usuário:", error.message)
    return { success: false, error: "Erro ao remover usuário." }
  }
}

export function updateUserRole(id: number, role: string) {
  const db = getDb()
  try {
    const result = db.prepare("UPDATE authorized_users SET role = ? WHERE id = ?").run(role, id)

    if (result.changes === 0) {
      return { success: false, error: "Usuário não encontrado." }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Erro ao atualizar função do usuário:", error.message)
    return { success: false, error: "Erro ao atualizar função do usuário." }
  }
}

// Adicionar esta função para verificar se um usuário está autorizado
export function isUserInDatabase(email: string): boolean {
  const db = getDb()
  const user = db.prepare("SELECT id FROM authorized_users WHERE email = ?").get(email)
  return !!user
}

// Atualizar a função saveVote para usar o timestamp fornecido ou gerar um novo no fuso horário brasileiro
export function saveVote(data: VoteData): number {
  const db = getDb()

  // Usar o timestamp fornecido ou gerar um novo no fuso horário brasileiro
  const timestamp = data.created_at || data.timestamp || formatISOBrazilian(new Date())

  const result = db
    .prepare("INSERT INTO votes (rating, reason, comment, location, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(data.rating, data.reason || null, data.comment || null, data.location, timestamp)

  return result.lastInsertRowid as number
}

// Update the getVotes function to include cafeteria name and fix date filtering
export function getVotes(
  filters: {
    period?: string
    location?: string
    minVotes?: number
    ratings?: string[]
    from?: Date
    to?: Date
    limit?: number
  } = {},
) {
  const db = getDb()

  logDebug("getVotes called with filters:", filters)

  let query = `
   SELECT v.*, c.name as location_name 
   FROM votes v
   LEFT JOIN cafeterias c ON v.location = c.code
   WHERE 1=1
 `
  const params: any[] = []

  // Only add location filter if it's not "all"
  if (filters.location && filters.location !== "all") {
    query += " AND v.location = ?"
    params.push(filters.location)
    logDebug("Filtering by location:", filters.location)
  }

  // Handle date filtering based on period if from/to are not provided
  if (!filters.from && !filters.to && filters.period) {
    const now = new Date()
    let fromDate: Date

    switch (filters.period) {
      case "day":
        fromDate = new Date(now)
        fromDate.setHours(0, 0, 0, 0)
        break
      case "week":
        fromDate = new Date(now)
        fromDate.setDate(now.getDate() - 7)
        break
      case "month":
        fromDate = new Date(now)
        fromDate.setMonth(now.getMonth() - 1)
        break
      case "quarter":
        fromDate = new Date(now)
        fromDate.setMonth(now.getMonth() - 3)
        break
      case "year":
        fromDate = new Date(now)
        fromDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        fromDate = new Date(now)
        fromDate.setMonth(now.getMonth() - 1) // Default to last month
    }

    logDebug(`Using date range from period '${filters.period}':`, { from: fromDate, to: now })

    // Formatar as datas no formato do banco
    const fromStr = formatDateForSQLite(fromDate)
    const toStr = formatDateForSQLite(now)

    query += " AND v.created_at >= ?"
    params.push(fromStr)

    query += " AND v.created_at <= ?"
    params.push(toStr)
  } else {
    // Use explicit from/to dates if provided
    if (filters.from) {
      // Ajustar a data de início para o início do dia (00:00:00)
      const fromDate = new Date(filters.from)
      fromDate.setHours(0, 0, 0, 0)

      // Formatar a data no formato do banco
      const fromStr = formatDateForSQLite(fromDate)

      // Adicionar log para debug
      console.log("Data de início (formatada para SQLite):", fromStr)
      console.log("Data de início (local):", fromDate.toString())

      query += " AND v.created_at >= ?"
      params.push(fromStr)
      logDebug("Using explicit from date (start of day):", fromStr)
    }

    if (filters.to) {
      // Ajustar a data de fim para o final do dia (23:59:59)
      const toDate = new Date(filters.to)
      toDate.setHours(23, 59, 59, 999)

      // Formatar a data no formato do banco
      const toStr = formatDateForSQLite(toDate)

      // Adicionar log para debug
      console.log("Data de fim (formatada para SQLite):", toStr)
      console.log("Data de fim (local):", toDate.toString())

      query += " AND v.created_at <= ?"
      params.push(toStr)
      logDebug("Using explicit to date (end of day):", toStr)
    }
  }

  if (filters.ratings && filters.ratings.length > 0) {
    const placeholders = filters.ratings.map(() => "?").join(",")
    query += ` AND v.rating IN (${placeholders})`
    params.push(...filters.ratings)
    logDebug("Filtering by ratings:", filters.ratings)
  }

  query += " ORDER BY v.created_at DESC"

  if (filters.limit) {
    query += " LIMIT ?"
    params.push(filters.limit)
    logDebug("Limiting results to:", filters.limit)
  }

  logDebug("Final SQL query:", query)
  logDebug("Query parameters:", params)

  try {
    const stmt = db.prepare(query)
    const results = stmt.all(...params)
    logDebug(`Query returned ${results.length} votes`)

    // Adicionar log para ver os primeiros resultados
    if (results.length > 0) {
      console.log("Primeiros resultados:", results.slice(0, 3))
    }

    return results
  } catch (error) {
    console.error("Error executing getVotes query:", error)
    return []
  }
}
// Update the getVoteStats function to include cafeteria name and fix date filtering
export function getVoteStats(
  filters: {
    period?: string
    location?: string
    minVotes?: number
    ratings?: string[]
    from?: Date
    to?: Date
  } = {},
) {
  const db = getDb()

  logDebug("getVoteStats called with filters:", filters)

  let query = `
   SELECT 
     COUNT(*) AS totalVotes,
     SUM(CASE WHEN rating = 'otimo' THEN 1 ELSE 0 END) AS otimoCount,
     SUM(CASE WHEN rating = 'regular' THEN 1 ELSE 0 END) AS regularCount,
     SUM(CASE WHEN rating = 'ruim' THEN 1 ELSE 0 END) AS ruimCount
   FROM votes WHERE 1=1
 `
  const params: any[] = []

  // Only add location filter if it's not "all"
  if (filters.location && filters.location !== "all") {
    query += " AND location = ?"
    params.push(filters.location)
    logDebug("Filtering by location:", filters.location)
  }

  // Handle date filtering based on period if from/to are not provided
  if (!filters.from && !filters.to && filters.period) {
    const now = new Date()
    let fromDate: Date

    switch (filters.period) {
      case "day":
        fromDate = new Date(now)
        fromDate.setHours(0, 0, 0, 0)
        break
      case "week":
        fromDate = new Date(now)
        fromDate.setDate(now.getDate() - 7)
        break
      case "month":
        fromDate = new Date(now)
        fromDate.setMonth(now.getMonth() - 1)
        break
      case "quarter":
        fromDate = new Date(now)
        fromDate.setMonth(now.getMonth() - 3)
        break
      case "year":
        fromDate = new Date(now)
        fromDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        fromDate = new Date(now)
        fromDate.setMonth(now.getMonth() - 1) // Default to last month
    }

    logDebug(`Using date range from period '${filters.period}':`, { from: fromDate, to: now })

    // Formatar as datas no formato do banco
    const fromStr = formatDateForSQLite(fromDate)
    const toStr = formatDateForSQLite(now)

    query += " AND created_at >= ?"
    params.push(fromStr)

    query += " AND created_at <= ?"
    params.push(toStr)
  } else {
    // Use explicit from/to dates if provided
    if (filters.from) {
      // Ajustar a data de início para o início do dia (00:00:00)
      const fromDate = new Date(filters.from)
      fromDate.setHours(0, 0, 0, 0)

      // Formatar a data no formato do banco
      const fromStr = formatDateForSQLite(fromDate)

      // Adicionar log para debug
      console.log("Stats - Data de início (formatada para SQLite):", fromStr)
      console.log("Stats - Data de início (local):", fromDate.toString())

      query += " AND created_at >= ?"
      params.push(fromStr)
      logDebug("Using explicit from date (start of day):", fromStr)
    }

    if (filters.to) {
      // Ajustar a data de fim para o final do dia (23:59:59)
      const toDate = new Date(filters.to)
      toDate.setHours(23, 59, 59, 999)

      // Formatar a data no formato do banco
      const toStr = formatDateForSQLite(toDate)

      // Adicionar log para debug
      console.log("Stats - Data de fim (formatada para SQLite):", toStr)
      console.log("Stats - Data de fim (local):", toDate.toString())

      query += " AND created_at <= ?"
      params.push(toStr)
      logDebug("Using explicit to date (end of day):", toStr)
    }
  }

  if (filters.ratings && filters.ratings.length > 0) {
    const placeholders = filters.ratings.map(() => "?").join(",")
    query += ` AND rating IN (${placeholders})`
    params.push(...filters.ratings)
    logDebug("Filtering by ratings:", filters.ratings)
  }

  logDebug("Final SQL query for stats:", query)
  logDebug("Query parameters for stats:", params)

  try {
    const stmt = db.prepare(query)
    const result = stmt.get(...params)
    logDebug("Stats query result:", result)

    // Consulta para razões de avaliações ruins
    let badReasonsQuery = `
     SELECT reason, COUNT(*) AS count 
     FROM votes 
     WHERE rating = 'ruim'
   `
    const badReasonsParams: any[] = []

    // Only add location filter if it's not "all"
    if (filters.location && filters.location !== "all") {
      badReasonsQuery += " AND location = ?"
      badReasonsParams.push(filters.location)
    }

    // Apply the same date filtering to bad reasons query
    if (!filters.from && !filters.to && filters.period) {
      const now = new Date()
      let fromDate: Date

      switch (filters.period) {
        case "day":
          fromDate = new Date(now)
          fromDate.setHours(0, 0, 0, 0)
          break
        case "week":
          fromDate = new Date(now)
          fromDate.setDate(now.getDate() - 7)
          break
        case "month":
          fromDate = new Date(now)
          fromDate.setMonth(now.getMonth() - 1)
          break
        case "quarter":
          fromDate = new Date(now)
          fromDate.setMonth(now.getMonth() - 3)
          break
        case "year":
          fromDate = new Date(now)
          fromDate.setFullYear(now.getFullYear() - 1)
          break
        default:
          fromDate = new Date(now)
          fromDate.setMonth(now.getMonth() - 1) // Default to last month
      }

      // Formatar as datas no formato do banco
      const fromStr = formatDateForSQLite(fromDate)
      const toStr = formatDateForSQLite(now)

      badReasonsQuery += " AND created_at >= ?"
      badReasonsParams.push(fromStr)

      badReasonsQuery += " AND created_at <= ?"
      badReasonsParams.push(toStr)
    } else {
      if (filters.from) {
        // Ajustar a data de início para o início do dia (00:00:00)
        const fromDate = new Date(filters.from)
        fromDate.setHours(0, 0, 0, 0)

        // Formatar a data no formato do banco
        const fromStr = formatDateForSQLite(fromDate)

        badReasonsQuery += " AND created_at >= ?"
        badReasonsParams.push(fromStr)
      }

      if (filters.to) {
        // Ajustar a data de fim para o final do dia (23:59:59)
        const toDate = new Date(filters.to)
        toDate.setHours(23, 59, 59, 999)

        // Formatar a data no formato do banco
        const toStr = formatDateForSQLite(toDate)

        badReasonsQuery += " AND created_at <= ?"
        badReasonsParams.push(toStr)
      }
    }

    badReasonsQuery += " GROUP BY reason"

    logDebug("Bad reasons query:", badReasonsQuery)
    logDebug("Bad reasons parameters:", badReasonsParams)

    const badReasonsStmt = db.prepare(badReasonsQuery)
    const badReasons = badReasonsStmt.all(...badReasonsParams)
    logDebug("Bad reasons results:", badReasons)

    return {
      totalVotes: result?.totalVotes || 0,
      ratingCounts: [
        { rating: "otimo", count: result?.otimoCount || 0 },
        { rating: "regular", count: result?.regularCount || 0 },
        { rating: "ruim", count: result?.ruimCount || 0 },
      ],
      badReasons: badReasons || [],
    }
  } catch (error) {
    console.error("Error executing getVoteStats query:", error)
    return {
      totalVotes: 0,
      ratingCounts: [
        { rating: "otimo", count: 0 },
        { rating: "regular", count: 0 },
        { rating: "ruim", count: 0 },
      ],
      badReasons: [],
    }
  }
}

export function getUserRole(email: string): string | null {
  const db = getDb()
  const user = db.prepare("SELECT role FROM authorized_users WHERE email = ?").get(email)
  return user ? user.role : null
}

// Email settings functions
export function getEmailSettings() {
  const db = getDb()

  // Check if there are any settings
  const count = db.prepare("SELECT COUNT(*) as count FROM email_settings").get() as { count: number }

  // If no settings exist, create default settings
  if (count.count === 0) {
    db.prepare(`
      INSERT INTO email_settings (
        smtp_host, 
        smtp_port, 
        smtp_secure, 
        from_email, 
        from_name
      ) VALUES (?, ?, ?, ?, ?)
    `).run("smtp.example.com", 25, 0, "noreply@example.com", "CBF Refeitório")
  }

  // Get the settings
  return db.prepare("SELECT * FROM email_settings ORDER BY id DESC LIMIT 1").get()
}

export function updateEmailSettings(settings: {
  smtp_host: string
  smtp_port: number
  from_email: string
  from_name?: string
  smtp_secure?: boolean
}) {
  const db = getDb()

  try {
    // Check if there are any settings
    const existingSettings = db.prepare("SELECT id FROM email_settings ORDER BY id DESC LIMIT 1").get()

    if (existingSettings) {
      // Update existing settings
      db.prepare(`
        UPDATE email_settings SET 
          smtp_host = ?, 
          smtp_port = ?, 
          smtp_secure = ?, 
          from_email = ?, 
          from_name = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        settings.smtp_host,
        settings.smtp_port,
        settings.smtp_secure ? 1 : 0,
        settings.from_email,
        settings.from_name || null,
        existingSettings.id,
      )
    } else {
      // Insert new settings
      db.prepare(`
        INSERT INTO email_settings (
          smtp_host, 
          smtp_port, 
          smtp_secure, 
          from_email, 
          from_name
        ) VALUES (?, ?, ?, ?, ?)
      `).run(
        settings.smtp_host,
        settings.smtp_port,
        settings.smtp_secure ? 1 : 0,
        settings.from_email,
        settings.from_name || null,
      )
    }

    return { success: true }
  } catch (error: any) {
    console.error("Erro ao atualizar configurações de e-mail:", error.message)
    return { success: false, error: "Erro ao atualizar configurações de e-mail." }
  }
}

// Report schedule functions
export function getReportSchedules() {
  const db = getDb()
  return db.prepare("SELECT * FROM report_schedules ORDER BY id DESC").all()
}

export function getReportScheduleById(id: number) {
  const db = getDb()
  return db.prepare("SELECT * FROM report_schedules WHERE id = ?").get(id)
}

export function addReportSchedule(schedule: {
  name: string
  frequency: string
  dayOfWeek?: number | null
  dayOfMonth?: number | null
  hour: number
  minute: number
  recipients: string
  formats: string
  filters?: string
  active?: number
}) {
  const db = getDb()

  try {
    const result = db
      .prepare(`
      INSERT INTO report_schedules (
        name, 
        frequency, 
        day_of_week, 
        day_of_month, 
        hour, 
        minute, 
        recipients, 
        formats, 
        filters, 
        active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .run(
        schedule.name,
        schedule.frequency,
        schedule.dayOfWeek || null,
        schedule.dayOfMonth || null,
        schedule.hour,
        schedule.minute,
        schedule.recipients,
        schedule.formats,
        schedule.filters || "{}",
        schedule.active !== undefined ? schedule.active : 1,
      )

    return { success: true, id: result.lastInsertRowid }
  } catch (error: any) {
    console.error("Erro ao adicionar agendamento:", error.message)
    return { success: false, error: "Erro ao adicionar agendamento." }
  }
}

export function updateReportSchedule(
  id: number,
  schedule: {
    name: string
    frequency: string
    dayOfWeek?: number | null
    dayOfMonth?: number | null
    hour: number
    minute: number
    recipients: string
    formats: string
    filters?: string
    active?: number
  },
) {
  const db = getDb()

  try {
    const result = db
      .prepare(`
      UPDATE report_schedules SET 
        name = ?, 
        frequency = ?, 
        day_of_week = ?, 
        day_of_month = ?, 
        hour = ?, 
        minute = ?, 
        recipients = ?, 
        formats = ?, 
        filters = ?, 
        active = ?
      WHERE id = ?
    `)
      .run(
        schedule.name,
        schedule.frequency,
        schedule.dayOfWeek || null,
        schedule.dayOfMonth || null,
        schedule.hour,
        schedule.minute,
        schedule.recipients,
        schedule.formats,
        schedule.filters || "{}",
        schedule.active !== undefined ? schedule.active : 1,
        id,
      )

    if (result.changes === 0) {
      return { success: false, error: "Agendamento não encontrado." }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Erro ao atualizar agendamento:", error.message)
    return { success: false, error: "Erro ao atualizar agendamento." }
  }
}

export function deleteReportSchedule(id: number) {
  const db = getDb()

  try {
    const result = db.prepare("DELETE FROM report_schedules WHERE id = ?").run(id)

    if (result.changes === 0) {
      return { success: false, error: "Agendamento não encontrado." }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Erro ao excluir agendamento:", error.message)
    return { success: false, error: "Erro ao excluir agendamento." }
  }
}

export function updateReportLastSent(id: number) {
  const db = getDb()

  try {
    const now = new Date().toISOString()
    db.prepare("UPDATE report_schedules SET last_sent = ? WHERE id = ?").run(now, id)
    return { success: true }
  } catch (error: any) {
    console.error("Erro ao atualizar data de último envio:", error.message)
    return { success: false, error: "Erro ao atualizar data de último envio." }
  }
}

export function getSchedulesToRun(now: Date) {
  const db = getDb()

  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentDayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
  const currentDayOfMonth = now.getDate() // 1-31

  // Get all active schedules
  const schedules = db
    .prepare(`
    SELECT * FROM report_schedules 
    WHERE active = 1 
    AND hour = ? 
    AND minute = ?
  `)
    .all(currentHour, currentMinute)

  // Filter schedules based on frequency
  return schedules.filter((schedule: any) => {
    if (schedule.frequency === "daily") {
      return true
    } else if (schedule.frequency === "weekly" && schedule.day_of_week === currentDayOfWeek) {
      return true
    } else if (schedule.frequency === "monthly" && schedule.day_of_month === currentDayOfMonth) {
      return true
    }
    return false
  })
}
