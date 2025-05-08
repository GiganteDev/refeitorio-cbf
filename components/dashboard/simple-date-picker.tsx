"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import type { DateRange } from "react-day-picker"

interface SimpleDatePickerProps {
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
  onDateChange?: () => void
}

export function SimpleDatePicker({ date, setDate, onDateChange }: SimpleDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handlePresetSelect = (preset: string) => {
    const now = new Date()
    let from: Date
    let to: Date = now

    switch (preset) {
      case "today":
        from = now
        break
      case "yesterday":
        from = subDays(now, 1)
        to = subDays(now, 1)
        break
      case "last7days":
        from = subDays(now, 6)
        break
      case "last30days":
        from = subDays(now, 29)
        break
      case "thisMonth":
        from = startOfMonth(now)
        to = endOfMonth(now)
        break
      case "lastMonth":
        const lastMonth = subMonths(now, 1)
        from = startOfMonth(lastMonth)
        to = endOfMonth(lastMonth)
        break
      case "thisWeek":
        from = startOfWeek(now, { weekStartsOn: 1 })
        to = endOfWeek(now, { weekStartsOn: 1 })
        break
      default:
        from = subDays(now, 29)
    }

    setDate({ from, to })
    setIsOpen(false)

    if (onDateChange) {
      onDateChange()
    }
  }

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range || !range.from) {
      return "Selecione um período"
    }

    if (range.to) {
      if (format(range.from, "dd/MM/yyyy") === format(range.to, "dd/MM/yyyy")) {
        return format(range.from, "dd/MM/yyyy", { locale: ptBR })
      }
      return `${format(range.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(range.to, "dd/MM/yyyy", { locale: ptBR })}`
    }

    return format(range.from, "dd/MM/yyyy", { locale: ptBR })
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[260px] justify-start">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange(date)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Períodos</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handlePresetSelect("today")}>Hoje</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlePresetSelect("yesterday")}>Ontem</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlePresetSelect("last7days")}>Últimos 7 dias</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlePresetSelect("last30days")}>Últimos 30 dias</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handlePresetSelect("thisMonth")}>Este mês</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlePresetSelect("lastMonth")}>Mês passado</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlePresetSelect("thisWeek")}>Esta semana</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
