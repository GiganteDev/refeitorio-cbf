import { format, formatISO, parseISO, addHours } from "date-fns"
import { ptBR } from "date-fns/locale"

// Configuração do timezone para America/Sao_Paulo (UTC-3)
export const TIMEZONE = "America/Sao_Paulo"
export const TIMEZONE_OFFSET = -3 // UTC-3

/**
 * Formata uma data para exibição no timezone do Brasil
 */
export function formatBrazilianDateTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  return format(dateObj, "dd/MM/yyyy HH:mm", { locale: ptBR })
}

/**
 * Formata uma data para exibição apenas da data no timezone do Brasil
 */
export function formatBrazilianDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  return format(dateObj, "dd/MM/yyyy", { locale: ptBR })
}

/**
 * Formata uma data para exibição apenas da hora no timezone do Brasil
 */
export function formatBrazilianTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  return format(dateObj, "HH:mm", { locale: ptBR })
}

/**
 * Converte uma data para o timezone do Brasil
 */
export function toBrazilianTimezone(date: Date): Date {
  // Ajusta a data para o timezone do Brasil (UTC-3)
  const utcDate = new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  )
  return addHours(utcDate, TIMEZONE_OFFSET)
}

/**
 * Obtém a data atual no timezone do Brasil
 */
export function getCurrentBrazilianDate(): Date {
  const now = new Date()
  return toBrazilianTimezone(now)
}

/**
 * Formata uma data ISO para o timezone do Brasil
 */
export function formatISOBrazilian(date: Date): string {
  const brazilianDate = toBrazilianTimezone(date)
  return formatISO(brazilianDate)
}

/**
 * Verifica se uma data está no mesmo dia que outra no timezone do Brasil
 */
export function isSameBrazilianDay(date1: Date, date2: Date): boolean {
  const d1 = toBrazilianTimezone(date1)
  const d2 = toBrazilianTimezone(date2)

  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
}

/**
 * Obtém o timestamp atual no timezone do Brasil
 */
export function getBrazilianTimestamp(): string {
  return formatISOBrazilian(new Date())
}
