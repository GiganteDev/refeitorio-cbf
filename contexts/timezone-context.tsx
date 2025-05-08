"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { TIMEZONE, TIMEZONE_OFFSET } from "@/lib/timezone-config"

type TimezoneContextType = {
  timezone: string
  offset: number
  formatDate: (date: Date | string) => string
  formatTime: (date: Date | string) => string
  formatDateTime: (date: Date | string) => string
  now: () => Date
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined)

export function TimezoneProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  // Formatar data no formato brasileiro (dd/mm/yyyy)
  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date
    return d.toLocaleDateString("pt-BR", { timeZone: TIMEZONE })
  }

  // Formatar hora no formato brasileiro (HH:MM)
  const formatTime = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date
    return d.toLocaleTimeString("pt-BR", { timeZone: TIMEZONE, hour: "2-digit", minute: "2-digit" })
  }

  // Formatar data e hora no formato brasileiro (dd/mm/yyyy HH:MM)
  const formatDateTime = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date
    return d.toLocaleString("pt-BR", { timeZone: TIMEZONE })
  }

  // Obter data e hora atual no fuso horário brasileiro
  const now = () => {
    const date = new Date()
    const utc = date.getTime() + date.getTimezoneOffset() * 60000
    return new Date(utc + 3600000 * TIMEZONE_OFFSET)
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  const value = {
    timezone: TIMEZONE,
    offset: TIMEZONE_OFFSET,
    formatDate,
    formatTime,
    formatDateTime,
    now,
  }

  // Só renderiza o conteúdo após o componente ser montado para evitar problemas de SSR
  return <TimezoneContext.Provider value={value}>{mounted ? children : null}</TimezoneContext.Provider>
}

export function useTimezone() {
  const context = useContext(TimezoneContext)
  if (context === undefined) {
    throw new Error("useTimezone must be used within a TimezoneProvider")
  }
  return context
}
